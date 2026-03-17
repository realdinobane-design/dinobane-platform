import express from "express";
import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { Resend } from "resend";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema, insertArticleSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

// ─── STRIPE CLIENT ────────────────────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : null;

const PRICE_ID = process.env.STRIPE_PRICE_ID || "price_1TAtUxLgaM5ScSUDmOEucYog";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// ─── EMAIL CLIENT (Resend) ────────────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// In-memory token store: token → { userId, email, expires }
// Small memory footprint — tokens expire after 24h
const verificationTokens = new Map<string, { userId: number; email: string; expires: number }>();

// ─── MENTION EMAIL RATE LIMITER ───────────────────────────────────────────────
// Tracks the last time a mention email was sent per user (userId → Date)
// We only send one email per user per calendar day (UTC)
const mentionEmailSentAt = new Map<number, string>(); // userId → "YYYY-MM-DD"

async function maybeSendMentionEmail(mentionedUsername: string, mentionedByUsername: string, channel: string): Promise<void> {
  if (!resend) return;
  try {
    const mentionedUser = await storage.getUserByUsername(mentionedUsername);
    if (!mentionedUser?.email) return;

    const todayUTC = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    if (mentionEmailSentAt.get(mentionedUser.id) === todayUTC) return; // already sent today

    mentionEmailSentAt.set(mentionedUser.id, todayUTC);

    const channelLabel = channel.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    await resend.emails.send({
      from: "DinoBane <noreply@dinobane.com>",
      to: mentionedUser.email,
      subject: `📣 @${mentionedByUsername} mentioned you in the DinoBane community`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#cc2a2a;padding:24px 32px;">
            <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:0.05em;">DINOBANE</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.7);display:block;margin-top:2px;">Community Alert</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;color:#e5e5e5;">
            <p style="margin:0 0 16px;font-size:16px;">Hey <strong>@${mentionedUser.username}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;"><strong>@${mentionedByUsername}</strong> mentioned you in <strong>#${channelLabel}</strong>. Head over to the community to see what they said.</p>
            <a href="https://dinobane.com/#/community" style="display:inline-block;background:#cc2a2a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;">View Message →</a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #222;">
            <p style="margin:0;font-size:12px;color:#555;">You're receiving this because you're a DinoBane member. You'll receive at most one of these per day.</p>
            <p style="margin:8px 0 0;font-size:12px;"><a href="https://dinobane.com" style="color:#cc2a2a;">dinobane.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    console.log(`[mention-email] sent to ${mentionedUser.email} (mentioned by @${mentionedByUsername} in #${channel})`);
  } catch (e: any) {
    console.error("[mention-email] failed:", e.message);
  }
}

// ─── SESSION AUGMENTATION ─────────────────────────────────────────────────────
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// ─── WEBSOCKET BROADCAST ──────────────────────────────────────────────────────
let wss: WebSocketServer;

function broadcast(data: object) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// HTML relay page — commits session cookie then redirects client-side
function relayPage(destination: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DinoBane — ${message}</title>
  <style>
    body { background: #0a0a0a; color: #fff; font-family: sans-serif; display: flex;
           align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: 2px; margin-bottom: 16px; }
    .logo span { color: #cc2a2a; }
    p { color: #aaa; font-size: 14px; }
  </style>
</head>
<body>
  <div class="box">
    <div class="logo">DINO<span>BANE</span></div>
    <p>${message}</p>
  </div>
  <script>
    // Small delay so Set-Cookie header is processed before navigation
    setTimeout(() => { window.location.replace("${destination}"); }, 300);
  </script>
</body>
</html>`;
}

export function registerRoutes(httpServer: Server, app: Express) {
  // ─── AUTH ROUTES ────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      // displayName is optional from frontend — falls back to username
      const schema = z.object({
        email: z.string().email(),
        username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
        displayName: z.string().min(2).max(30).optional(),
        password: z.string().min(6),
      });
      const body = schema.parse(req.body);
      const displayName = body.displayName || body.username;

      const existingEmail = await storage.getUserByEmail(body.email);
      if (existingEmail) return res.status(400).json({ error: "That email is already registered. Try signing in instead." });

      const existingUsername = await storage.getUserByUsername(body.username);
      if (existingUsername) return res.status(400).json({ error: "That username is already taken. Please choose another." });

      const hash = await bcrypt.hash(body.password, 10);
      const initials = displayName.slice(0, 2).toUpperCase();
      const colors = ["#cc2a2a", "#1d4ed8", "#16a34a", "#7c3aed", "#d97706", "#0891b2"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const user = await storage.createUser({
        email: body.email,
        username: body.username,
        displayName,
        password: hash,
        avatarInitials: initials,
        avatarColor: color,
        isMember: false,
        stripeCustomerId: null,
      });

      // Generate email verification token
      const token = crypto.randomBytes(32).toString("hex");
      verificationTokens.set(token, {
        userId: user.id,
        email: user.email,
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24h
      });

      // Send verification email
      const appUrl = process.env.VITE_APP_URL || "https://dinobane.com";
      const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

      if (resend) {
        await resend.emails.send({
          from: "DinoBane <noreply@dinobane.com>",
          to: user.email,
          subject: "Verify your DinoBane account",
          html: `
            <div style="background:#0a0a0a;color:#fff;font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;">
              <div style="margin-bottom:32px;">
                <span style="font-size:22px;font-weight:900;letter-spacing:2px;color:#fff;">DINO</span><span style="font-size:22px;font-weight:900;letter-spacing:2px;color:#cc2a2a;">BANE</span>
              </div>
              <h2 style="font-size:20px;font-weight:700;margin:0 0 12px;">Verify your email</h2>
              <p style="color:#aaa;font-size:14px;margin:0 0 28px;line-height:1.6;">
                Hi <strong style="color:#fff;">${user.displayName}</strong>, click the button below to verify your email address and proceed to membership.
              </p>
              <a href="${verifyUrl}" style="display:inline-block;background:#cc2a2a;color:#fff;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;text-decoration:none;border-radius:2px;">
                Verify Email &amp; Join
              </a>
              <p style="color:#555;font-size:12px;margin:28px 0 0;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
            </div>
          `,
        });
      } else {
        // No Resend key — log the verify URL (dev/fallback)
        console.log("[email] RESEND_API_KEY not set — verify URL:", verifyUrl);
      }

      return res.json({ ok: true, message: "Verification email sent" });
    } catch (e: any) {
      return res.status(400).json({ error: e.message || "Registration failed" });
    }
  });

  // ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────
  // User clicks link in email → verify → log them in → redirect to Stripe checkout
  // Uses an HTML relay page so the session cookie is committed before the SPA loads
  app.get("/api/auth/verify-email", async (req, res) => {
    const token = req.query.token as string;

    if (!token) {
      return res.send(relayPage("/#/register?error=missing_token", "Invalid link"));
    }

    const record = verificationTokens.get(token);
    if (!record) {
      return res.send(relayPage("/#/register?error=invalid_token", "Link not found — it may have already been used."));
    }
    if (Date.now() > record.expires) {
      verificationTokens.delete(token);
      return res.send(relayPage("/#/register?error=expired_token", "Link expired — please register again."));
    }

    verificationTokens.delete(token); // single-use

    // Log the user in — session is saved before the page redirects
    req.session.userId = record.userId;
    await new Promise<void>((resolve, reject) =>
      req.session.save(err => err ? reject(err) : resolve())
    );

    return res.send(relayPage("/#/membership?verified=1", "Verified! Redirecting to membership..."));
  });

  // ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────
  app.delete("/api/account", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Cancel Stripe subscription first if active member
    if (user.isMember && user.stripeCustomerId && stripe) {
      try {
        const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "active", limit: 1 });
        if (subs.data.length > 0) {
          await stripe.subscriptions.cancel(subs.data[0].id);
        }
      } catch (e: any) {
        console.error("[stripe] cancel on delete failed:", e.message);
      }
    }

    await storage.deleteUser(req.session.userId);
    req.session.destroy(() => {});
    return res.json({ ok: true });
  });

  // ─── CANCEL CHECKOUT — wipe unverified account ────────────────────────────────
  // When a new user cancels Stripe checkout, delete their account entirely
  // so they cannot access the site without paying
  app.post("/api/stripe/cancel-registration", async (req, res) => {
    if (!req.session.userId) return res.json({ ok: true }); // already gone
    const user = await storage.getUserById(req.session.userId);
    if (user && !user.isMember) {
      await storage.deleteUser(req.session.userId);
      req.session.destroy(() => {});
    }
    return res.json({ ok: true });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid credentials" });

      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (e: any) {
      return res.status(400).json({ error: e.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const { password: _, ...safeUser } = user;
    return res.json(safeUser);
  });

  // ─── PROFILE ─────────────────────────────────────────────────────────────────
  // Update display name, avatar initials, avatar colour
  app.patch("/api/profile", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const schema = z.object({
      displayName: z.string().min(2).max(30).optional(),
      avatarInitials: z.string().min(1).max(3).toUpperCase().optional(),
      avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const updated = await storage.updateUserProfile(req.session.userId, parsed.data);
    const { password: _, ...safeUser } = updated;
    return res.json(safeUser);
  });

  // Upload avatar image — accepts base64 data URL from client-side canvas resize
  app.post("/api/profile/avatar", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const schema = z.object({
      // data URL: "data:image/jpeg;base64,..." — must be JPEG or PNG, max ~400KB base64
      avatarUrl: z.string()
        .refine(v => v.startsWith("data:image/jpeg;base64,") || v.startsWith("data:image/png;base64,") || v.startsWith("data:image/webp;base64,"), "Must be a JPEG, PNG or WebP image")
        .refine(v => v.length <= 600_000, "Image too large — please use a smaller image"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const updated = await storage.updateUserProfile(req.session.userId, { avatarUrl: parsed.data.avatarUrl });
    const { password: _, ...safeUser } = updated;
    return res.json(safeUser);
  });

  // Remove avatar image (revert to initials)
  app.delete("/api/profile/avatar", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const updated = await storage.updateUserProfile(req.session.userId, { avatarUrl: null });
    const { password: _, ...safeUser } = updated;
    return res.json(safeUser);
  });

  // Get all messages that @mention the current user
  app.get("/api/profile/mentions", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const allUsers = await storage.getAllUsers();
    // Search all channels for messages containing @username
    const channels = ["general", "news-links", "video-discussion", "off-topic"];
    const mentionRegex = new RegExp(`@${user.username}\\b`, "i");
    const results: any[] = [];
    for (const channel of channels) {
      const msgs = await storage.getMessages(channel);
      for (const msg of msgs) {
        if (mentionRegex.test(msg.content)) {
          results.push(msg);
        }
      }
    }
    // Sort newest first
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(results);
  });

  // Get the current user's own messages (activity history)
  app.get("/api/profile/messages", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const channels = ["general", "news-links", "video-discussion", "off-topic"];
    const results: any[] = [];
    for (const channel of channels) {
      const msgs = await storage.getMessages(channel);
      for (const msg of msgs) {
        if (msg.userId === req.session.userId) results.push(msg);
      }
    }
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(results);
  });

  // ─── STRIPE CHECKOUT ────────────────────────────────────────────────────────────
  app.post("/api/stripe/checkout", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    if (!stripe) return res.status(503).json({ error: "Payments not configured" });

    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.isMember) return res.status(400).json({ error: "Already a member" });

    const appUrl = process.env.VITE_APP_URL || "http://localhost:5000";

    try {
      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.displayName,
          metadata: { userId: String(user.id) },
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: PRICE_ID, quantity: 1 }],
        success_url: `${appUrl}/#/membership?success=1`,
        cancel_url: `${appUrl}/#/membership?cancelled=1`,
        subscription_data: {
          metadata: { userId: String(user.id) },
        },
        allow_promotion_codes: true,
      });

      return res.json({ url: session.url });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Checkout failed" });
    }
  });

  // ─── STRIPE CUSTOMER PORTAL (self-serve cancel) ───────────────────────────────
  app.post("/api/stripe/portal", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    if (!stripe) return res.status(503).json({ error: "Payments not configured" });

    const user = await storage.getUserById(req.session.userId);
    if (!user?.stripeCustomerId) return res.status(400).json({ error: "No billing account found" });

    const appUrl = process.env.VITE_APP_URL || "http://localhost:5000";

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${appUrl}/#/membership`,
      });
      return res.json({ url: portalSession.url });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Portal failed" });
    }
  });

  // ─── STRIPE WEBHOOK ────────────────────────────────────────────────────────────
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe) return res.status(503).send("Not configured");

    let event: Stripe.Event;
    try {
      if (WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"] as string, WEBHOOK_SECRET);
      } else {
        event = JSON.parse(req.body.toString()) as Stripe.Event;
      }
    } catch (e: any) {
      return res.status(400).send(`Webhook error: ${e.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          let userId = parseInt(session.subscription_data?.metadata?.userId || "0");
          // Fallback: look up user by customer email if userId not in metadata
          if (!userId && session.customer_details?.email) {
            const userByEmail = await storage.getUserByEmail(session.customer_details.email);
            if (userByEmail) userId = userByEmail.id;
          }
          // Second fallback: look up by Stripe customer email
          if (!userId && session.customer && typeof session.customer === "string") {
            try {
              const customer = await stripe!.customers.retrieve(session.customer) as Stripe.Customer;
              if (customer && !customer.deleted && customer.email) {
                const userByEmail = await storage.getUserByEmail(customer.email);
                if (userByEmail) userId = userByEmail.id;
              }
            } catch (e) { console.error("[webhook] customer lookup failed:", e); }
          }
          if (userId) {
            await storage.updateUserMembership(userId, true);
            console.log(`[webhook] checkout.session.completed — granted membership to userId ${userId}`);
          } else {
            console.warn("[webhook] checkout.session.completed — could not resolve userId, session:", session.id);
          }
          break;
        }
        case "customer.subscription.deleted":
        case "customer.subscription.paused": {
          const sub = event.data.object as Stripe.Subscription;
          let userId = parseInt(sub.metadata?.userId || "0");
          // Fallback: look up by Stripe customer email
          if (!userId && sub.customer && typeof sub.customer === "string") {
            try {
              const customer = await stripe!.customers.retrieve(sub.customer) as Stripe.Customer;
              if (customer && !customer.deleted && customer.email) {
                const userByEmail = await storage.getUserByEmail(customer.email);
                if (userByEmail) userId = userByEmail.id;
              }
            } catch (e) { console.error("[webhook] customer lookup failed:", e); }
          }
          if (userId) await storage.updateUserMembership(userId, false);
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          let userId = parseInt(sub.metadata?.userId || "0");
          // Fallback: look up by Stripe customer email
          if (!userId && sub.customer && typeof sub.customer === "string") {
            try {
              const customer = await stripe!.customers.retrieve(sub.customer) as Stripe.Customer;
              if (customer && !customer.deleted && customer.email) {
                const userByEmail = await storage.getUserByEmail(customer.email);
                if (userByEmail) userId = userByEmail.id;
              }
            } catch (e) { console.error("[webhook] customer lookup failed:", e); }
          }
          const active = sub.status === "active" || sub.status === "trialing";
          if (userId) await storage.updateUserMembership(userId, active);
          break;
        }
      }
    } catch (e) {
      console.error("Webhook handler error:", e);
    }

    return res.json({ received: true });
  });

  // ─── DEMO ACTIVATE (fallback when Stripe not configured) ───────────────────────
  app.post("/api/membership/activate", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    if (stripe) return res.status(400).json({ error: "Use Stripe checkout" });
    const user = await storage.updateUserMembership(req.session.userId, true);
    const { password: _, ...safeUser } = user;
    return res.json(safeUser);
  });

  // ─── COMMUNITY (MESSAGES) ────────────────────────────────────────────────────
  app.get("/api/messages/:channel", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Members only" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Membership required" });

    const { channel } = req.params;
    const messages = await storage.getMessages(channel);
    return res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Members only" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Membership required" });

    try {
      const body = insertMessageSchema.parse({ ...req.body, userId: req.session.userId });
      const message = await storage.createMessage(body);
      broadcast({ type: "new_message", message });

      // ── @mention email notifications (fire-and-forget, max 1/day/user) ──
      if (typeof body.content === "string") {
        const mentioned = [...body.content.matchAll(/@([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
        if (mentioned.length > 0) {
          const sender = await storage.getUserById(req.session.userId!);
          const senderUsername = sender?.username ?? "someone";
          const channel = (body as any).channel ?? "general";
          // Deduplicate and skip self-mentions
          const unique = [...new Set(mentioned)].filter(u => u.toLowerCase() !== senderUsername.toLowerCase());
          for (const username of unique) {
            maybeSendMentionEmail(username, senderUsername, channel).catch(() => {});
          }
        }
      }

      return res.json(message);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });

  // ─── ARTICLES ────────────────────────────────────────────────────────────────
  app.get("/api/articles", async (req, res) => {
    const articles = await storage.getArticles();
    return res.json(articles);
  });

  app.get("/api/articles/:id", async (req, res) => {
    const article = await storage.getArticleById(parseInt(req.params.id));
    if (!article) return res.status(404).json({ error: "Not found" });
    return res.json(article);
  });

  app.post("/api/articles/generate", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const caller = await storage.getUserById(req.session.userId);
    if (!caller || !new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]).has(caller.email)) {
      return res.status(403).json({ error: "Admin only" });
    }

    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return res.status(400).json({ error: "YouTube URL required" });

    const videoIdMatch = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    let title = "DinoBane Video Analysis";
    let thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
      if (oembedRes.ok) {
        const data = await oembedRes.json() as any;
        title = data.title || title;
      }
    } catch {}

    const content = await generateArticleAI(title, youtubeUrl);
    const article = await storage.createArticle({
      title,
      content,
      summary: `Written analysis of "${title}" — key arguments and context from the latest DinoBane video.`,
      youtubeUrl,
      videoId,
      thumbnail,
      isPublic: true,
    });

    return res.json(article);
  });

  // ─── ADMIN USER MANAGEMENT ────────────────────────────────────────────────────
  // All routes require admin email. Cancel membership first, then delete account.
  const ADMIN_EMAILS = new Set(["realdinobane@gmail.com", "yingchanzeng@gmail.com"]);

  async function requireAdmin(req: express.Request, res: express.Response): Promise<{ ok: true; adminUser: any } | { ok: false }> {
    if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return { ok: false }; }
    const adminUser = await storage.getUserById(req.session.userId);
    if (!adminUser || !ADMIN_EMAILS.has(adminUser.email)) { res.status(403).json({ error: "Admin only" }); return { ok: false }; }
    return { ok: true, adminUser };
  }

  // GET /api/admin/users — list all users (admin only)
  app.get("/api/admin/users", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const users = await storage.getAllUsers();
    const safe = users.map(({ password: _, ...u }) => u);
    return res.json(safe);
  });

  // DELETE /api/admin/users/:id/membership — cancel Stripe + mark isMember=false
  app.delete("/api/admin/users/:id/membership", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const targetId = parseInt(req.params.id);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID" });
    const target = await storage.getUserById(targetId);
    if (!target) return res.status(404).json({ error: "User not found" });
    // Cancel Stripe subscription if active
    if (target.stripeCustomerId && stripe) {
      try {
        const subs = await stripe.subscriptions.list({ customer: target.stripeCustomerId, status: "active", limit: 1 });
        if (subs.data.length > 0) {
          await stripe.subscriptions.cancel(subs.data[0].id);
        }
      } catch (e: any) {
        console.error("[admin] stripe cancel failed:", e.message);
      }
    }
    await storage.updateUserMembership(targetId, false);
    const updated = await storage.getUserById(targetId);
    if (!updated) return res.status(404).json({ error: "User not found after update" });
    const { password: _, ...safe } = updated;
    return res.json(safe);
  });

  // POST /api/admin/users/:id/membership — manually grant membership (admin only)
  app.post("/api/admin/users/:id/membership", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const targetId = parseInt(req.params.id);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID" });
    const target = await storage.getUserById(targetId);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.isMember) return res.status(400).json({ error: "User is already a member" });
    await storage.updateUserMembership(targetId, true);
    const updated = await storage.getUserById(targetId);
    if (!updated) return res.status(404).json({ error: "User not found after update" });
    const { password: _, ...safe } = updated;
    console.log(`[admin] membership manually granted to userId ${targetId} by admin ${check.adminUser.email}`);
    return res.json(safe);
  });

  // DELETE /api/admin/users/:id — delete account (only if isMember is already false)
  app.delete("/api/admin/users/:id", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const targetId = parseInt(req.params.id);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID" });
    const target = await storage.getUserById(targetId);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (target.isMember) {
      return res.status(400).json({ error: "Cancel their membership before deleting their account." });
    }
    await storage.deleteUser(targetId);
    return res.json({ ok: true });
  });

  // GET /api/admin/users/:id/profile — full profile for a single user (admin only)
  app.get("/api/admin/users/:id/profile", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const targetId = parseInt(req.params.id);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID" });
    const target = await storage.getUserById(targetId);
    if (!target) return res.status(404).json({ error: "User not found" });
    const { password: _, ...safeUser } = target;
    // Gather messages across all channels
    const channels = ["general", "news-links", "video-discussion", "off-topic"];
    const messages: any[] = [];
    let mentionCount = 0;
    const mentionRegex = new RegExp(`@${target.username}\\b`, "i");
    for (const channel of channels) {
      const msgs = await storage.getMessages(channel);
      for (const msg of msgs) {
        if (msg.userId === targetId) messages.push(msg);
        if (mentionRegex.test(msg.content)) mentionCount++;
      }
    }
    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ user: safeUser, messages: messages.slice(0, 50), mentionCount });
  });

  // ─── MEDIA VAULT ─────────────────────────────────────────────────────────────
  // GET: any paid member can view all media
  // POST/DELETE: admin only
  const ADMIN_EMAIL = ADMIN_EMAILS; // reuse the Set defined above

  app.get("/api/media", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Members only" });
    const items = await storage.getAllMedia();
    return res.json(items);
  });

  app.post("/api/media", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!ADMIN_EMAIL.has(user.email)) return res.status(403).json({ error: "Only admins can upload media." });

    const schema = z.object({
      name: z.string().min(1).max(255),
      type: z.enum(["image", "video"]),
      dataUrl: z.string().min(10),
      size: z.number().positive(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const maxBytes = parsed.data.type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (parsed.data.size > maxBytes) {
      return res.status(400).json({ error: `File too large. Max ${parsed.data.type === "image" ? "5MB" : "50MB"}.` });
    }

    const item = await storage.createMedia({ userId: req.session.userId, ...parsed.data });
    return res.json(item);
  });

  app.delete("/api/media/:id", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!ADMIN_EMAIL.has(user.email)) return res.status(403).json({ error: "Only admins can delete media." });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    await storage.deleteMedia(id, req.session.userId);
    return res.json({ ok: true });
  });

  // ─── LINK PREVIEW ────────────────────────────────────────────────────────────
  // Fetches Open Graph / Twitter card metadata for a URL (used by chat)
  app.get("/api/link-preview", async (req, res) => {
    const url = req.query.url as string;
    if (!url || !url.startsWith("http")) return res.status(400).json({ error: "Invalid URL" });
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

    const domain = new URL(url).hostname.replace(/^www\./, "");
    const fallback = { url, title: "", description: "", image: "", siteName: domain, domain };

    try {
      // ─── YouTube / youtu.be: use oEmbed for reliable title + thumbnail ───
      const ytMatch = url.match(
        /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/
      );
      if (ytMatch) {
        const videoId = ytMatch[1];
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oController = new AbortController();
        const oTimeout = setTimeout(() => oController.abort(), 5000);
        const oRes = await fetch(oembedUrl, { signal: oController.signal });
        clearTimeout(oTimeout);
        if (oRes.ok) {
          const oembed = await oRes.json() as { title?: string; author_name?: string; thumbnail_url?: string };
          return res.json({
            url,
            title: oembed.title || "",
            description: oembed.author_name ? `By ${oembed.author_name}` : "",
            image: oembed.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            siteName: "YouTube",
            domain: "youtube.com",
          });
        }
        // oEmbed failed — fall back to thumbnail at least
        return res.json({
          url,
          title: "",
          description: "",
          image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          siteName: "YouTube",
          domain: "youtube.com",
        });
      }

      // ─── Generic OG / Twitter card fetch ───
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const r = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Twitterbot/1.0)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-GB,en;q=0.9",
        },
      });
      clearTimeout(timeout);
      const html = await r.text();

      // Decode HTML entities in meta values
      const decode = (s: string) =>
        s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

      const getMeta = (prop: string): string => {
        // Handle property="og:x" content="..." and name="x" content="..."
        const patterns = [
          new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i"),
          new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"),
          // Some sites use unquoted content
          new RegExp(`<meta[^>]+(?:property|name)=${prop}[^>]+content=["']([^"']*)["']`, "i"),
        ];
        for (const p of patterns) {
          const m = html.match(p);
          if (m?.[1]) return decode(m[1].trim());
        }
        return "";
      };

      const title = getMeta("og:title") || getMeta("twitter:title")
        || decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "");
      const description = getMeta("og:description") || getMeta("twitter:description") || getMeta("description");
      const image = getMeta("og:image") || getMeta("twitter:image");
      const siteName = getMeta("og:site_name");

      return res.json({ url, title, description, image, siteName: siteName || domain, domain });
    } catch (e: any) {
      return res.status(200).json(fallback);
    }
  });

  // ─── INTEL / NEWS RSS FEED ──────────────────────────────────────────────────
  app.get("/api/intel/feed", async (req, res) => {
    const FEEDS = [
      // Original alt / right-leaning
      { name: "Guido Fawkes",          url: "https://order-order.com/feed/" },
      { name: "Spiked Online",         url: "https://www.spiked-online.com/feed/" },
      { name: "GB News",               url: "https://www.gbnews.com/feed" },
      { name: "The Spectator",         url: "https://www.spectator.co.uk/feed/" },
      { name: "ZeroHedge",             url: "https://feeds.feedburner.com/zerohedge/feed" },
      { name: "Breitbart London",      url: "https://www.breitbart.com/london/feed/" },
      { name: "Daily Mail",            url: "https://www.dailymail.co.uk/articles.rss" },
      { name: "The Telegraph",         url: "https://www.telegraph.co.uk/rss.xml" },
      { name: "The Daily Sceptic",     url: "https://dailysceptic.org/feed/" },
      { name: "The Conservative Woman",url: "https://www.conservativewoman.co.uk/feed/" },
      // Mainstream UK outlets
      { name: "The Sun",               url: "https://www.thesun.co.uk/feed/" },
      { name: "The Times",             url: "https://www.thetimes.co.uk/rss/news" },
      { name: "The Guardian",          url: "https://www.theguardian.com/uk/rss" },
      { name: "BBC News",              url: "https://feeds.bbci.co.uk/news/rss.xml" },
      { name: "Sky News",              url: "https://feeds.skynews.com/feeds/rss/uk.xml" },
      { name: "The Independent",       url: "https://www.independent.co.uk/news/uk/rss" },
      { name: "The Mirror",            url: "https://www.mirror.co.uk/news/politics/?service=rss" },
      { name: "Express",               url: "https://www.express.co.uk/news/politics/rss" },
      // Alternative / independent
      { name: "Reclaim The Net",       url: "https://reclaimthenet.org/feed/" },
      { name: "The Gateway Pundit",    url: "https://www.thegatewaypundit.com/feed/" },
      { name: "Westmonster",           url: "https://westmonster.com/feed/" },
      { name: "UnHerd",                url: "https://unherd.com/feed/" },
      { name: "The Critic",            url: "https://thecritic.co.uk/feed/" },
      { name: "ConservativeHome",      url: "https://www.conservativehome.com/feed/" },
      { name: "Iain Dale",             url: "https://iaindale.com/feed/" },
      { name: "The Sun Politics",      url: "https://www.thesun.co.uk/news/politics/feed/" },
    ];

    async function fetchFeed(name: string, url: string): Promise<any[]> {
      try {
        // Try direct first, then allorigins proxy
        let xml = "";
        const attempts = [
          () => fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "Mozilla/5.0" } }),
          () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(8000) })
            .then(async r => { const d = await r.json() as any; return new Response(d.contents, { status: 200 }); }),
        ];
        for (const attempt of attempts) {
          try {
            const r = await attempt();
            if (r.ok) { xml = await r.text(); break; }
          } catch {}
        }
        if (!xml) return [];

        // Parse RSS/Atom items
        const items: any[] = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/g;
        let m;
        while ((m = itemRegex.exec(xml)) !== null) {
          const block = m[1] || m[2];
          const getTag = (tag: string) => {
            const r = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\/${tag}>|<${tag}[^>]*>([^<]*)<\/${tag}>`));
            return r ? (r[1] || r[2] || "").trim() : "";
          };
          const title = getTag("title");
          const link = getTag("link") || block.match(/<link[^>]+href=["']([^"']+)["']/)?.[1] || "";
          const pubDate = getTag("pubDate") || getTag("published") || getTag("updated") || "";
          const desc = getTag("description") || getTag("summary") || getTag("content");
          const cleanDesc = desc.replace(/<[^>]+>/g, "").slice(0, 200).trim();
          if (title && link) {
            items.push({ title, link, pubDate, description: cleanDesc, source: name });
          }
        }
        return items.slice(0, 8);
      } catch { return []; }
    }

    try {
      const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f.name, f.url)));
      const allItems: any[] = [];
      results.forEach(r => { if (r.status === "fulfilled") allItems.push(...r.value); });
      // Sort by date descending
      allItems.sort((a, b) => {
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return db - da;
      });
      return res.json(allItems.slice(0, 50));
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ─── YOUTUBE FEED PROXY ───────────────────────────────────────────────────────
  app.get("/api/youtube/feed", async (req, res) => {
    const channelId = "UCEJTJU2HaQfSfKbxJcPlh7Q";
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    let xml: string | null = null;

    // Try direct fetch first (works server-side), then fallback proxies
    const attempts = [
      () => fetch(rssUrl, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0" } }),
      () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`, { signal: AbortSignal.timeout(8000) }).then(async r => { const d = await r.json() as any; return new Response(d.contents); }),
      () => fetch(`https://corsproxy.io/?${encodeURIComponent(rssUrl)}`, { signal: AbortSignal.timeout(8000) }),
    ];

    for (const attempt of attempts) {
      try {
        const r = await attempt();
        if (r.ok) { xml = await r.text(); break; }
      } catch {}
    }

    if (xml && xml.includes("<feed")) {
      const videos = parseYouTubeFeed(xml);
      if (videos.length > 0) return res.json(videos);
    }

    return res.json(getFallbackVideos());
  });

  // ─── RSS POLL — auto-generate articles for new videos ────────────────────────
  app.post("/api/youtube/sync", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    try {
      const channelId = "UCEJTJU2HaQfSfKbxJcPlh7Q";
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const r = await fetch(rssUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const xml = await r.text();
      const videos = parseYouTubeFeed(xml);
      const articles = await storage.getArticles();
      const existingVideoIds = new Set(articles.map((a: any) => a.videoId).filter(Boolean));
      const newVideos = videos.filter((v: any) => !existingVideoIds.has(v.id));
      const created: any[] = [];
      for (const v of newVideos) {
        const content = await generateArticleAI(v.title, `https://www.youtube.com/watch?v=${v.id}`);
        const article = await storage.createArticle({
          title: v.title,
          content,
          summary: `Written analysis of "${v.title}" — key arguments and context from the latest DinoBane video.`,
          youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
          videoId: v.id,
          thumbnail: v.thumbnail,
          isPublic: true,
        });
        created.push(article);
      }
      return res.json({ synced: created.length, newArticles: created });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ─── AUTO-SYNC: poll YouTube RSS every 30 min, auto-generate articles ────────
  async function syncYouTubeArticles(reason = "scheduled") {
    try {
      const channelId = "UCEJTJU2HaQfSfKbxJcPlh7Q";
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const r = await fetch(rssUrl, { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) { console.log(`[sync] RSS fetch failed (${reason})`); return; }
      const xml = await r.text();
      const videos = parseYouTubeFeed(xml);
      const articles = await storage.getArticles();
      const existingVideoIds = new Set(articles.map((a: any) => a.videoId).filter(Boolean));
      const newVideos = videos.filter((v: any) => !existingVideoIds.has(v.id));
      if (newVideos.length === 0) { console.log(`[sync] no new videos (${reason})`); return; }
      console.log(`[sync] ${newVideos.length} new video(s) found — generating articles...`);
      for (const v of newVideos) {
        try {
          const content = await generateArticleAI(v.title, `https://www.youtube.com/watch?v=${v.id}`);
          await storage.createArticle({
            title: v.title,
            content,
            summary: `Written analysis of "${v.title}" — key arguments and context from the latest DinoBane video.`,
            youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
            videoId: v.id,
            thumbnail: v.thumbnail,
            isPublic: true,
          });
          console.log(`[sync] article created: ${v.title}`);
        } catch (e: any) {
          console.error(`[sync] failed to generate article for ${v.id}:`, e.message);
        }
      }
    } catch (e: any) {
      console.error(`[sync] error (${reason}):`, e.message);
    }
  }

  // Run once on startup (catches any videos uploaded while server was down)
  setTimeout(() => syncYouTubeArticles("startup"), 10_000);
  // Then every 30 minutes
  setInterval(() => syncYouTubeArticles("interval"), 30 * 60 * 1000);

  // ─── WEEKLY NEWSLETTER — every Sunday at 9 AM Bangkok (02:00 UTC) ─────────────
  async function sendWeeklyNewsletter() {
    if (!resend) return;
    try {
      // Fetch the YouTube RSS feed for the latest videos
      const channelId = "UCEJTJU2HaQfSfKbxJcPlh7Q";
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      let xml: string | null = null;
      const proxies = [
        () => fetch(rssUrl, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0" } }),
        () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`, { signal: AbortSignal.timeout(8000) }).then(async r => { const d = await r.json() as any; return new Response(d.contents); }),
      ];
      for (const attempt of proxies) {
        try { const r = await attempt(); if (r.ok) { xml = await r.text(); break; } } catch {}
      }
      if (!xml) { console.error("[newsletter] could not fetch YouTube feed"); return; }

      const allVideos = parseYouTubeFeed(xml);
      // Filter to videos published in the last 7 days
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const thisWeek = allVideos.filter(v => {
        const t = v.publishedAt ? new Date(v.publishedAt).getTime() : 0;
        return t >= oneWeekAgo;
      }).slice(0, 5);

      // If no new videos this week, skip sending
      if (thisWeek.length === 0) {
        console.log("[newsletter] no new videos this week — skipping");
        return;
      }

      // Get all paying members
      const allUsers = await storage.getAllUsers();
      const members = allUsers.filter(u => u.isMember && u.email);
      if (members.length === 0) { console.log("[newsletter] no members to send to"); return; }

      // Build the video cards HTML
      const videoCards = thisWeek.map((v, i) => `
        <tr>
          <td style="padding:0 0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:0;">
                  <a href="${v.url}" style="display:block;">
                    <img src="${v.thumbnail}" alt="${v.title.replace(/"/g, '&quot;')}" width="100%" style="display:block;border-radius:8px 8px 0 0;max-width:100%;" />
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#cc2a2a;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Video ${i + 1} of ${thisWeek.length}</p>
                  <a href="${v.url}" style="font-size:16px;font-weight:700;color:#fff;text-decoration:none;line-height:1.4;display:block;margin-bottom:12px;">${v.title}</a>
                  <a href="${v.url}" style="display:inline-block;background:#cc2a2a;color:#fff;text-decoration:none;padding:8px 20px;border-radius:5px;font-size:13px;font-weight:700;">Watch Now →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join("");

      const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#cc2a2a;padding:28px 32px;">
            <span style="font-size:24px;font-weight:900;color:#fff;letter-spacing:0.06em;">DINOBANE</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.75);display:block;margin-top:4px;">Weekly Dispatch — ${today}</span>
          </td>
        </tr>
        <!-- Thank you message -->
        <tr>
          <td style="padding:28px 32px 8px;">
            <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#fff;">This week on DinoBane</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#bbb;">Thank you for your continued support — it genuinely means everything. Here are the ${thisWeek.length} video${thisWeek.length > 1 ? "s" : ""} I uploaded this week. Watch, share, and keep exposing the truth.</p>
          </td>
        </tr>
        <!-- Video cards -->
        <tr>
          <td style="padding:0 32px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0">${videoCards}</table>
          </td>
        </tr>
        <!-- CTA -->
        <tr>
          <td style="padding:8px 32px 28px;text-align:center;">
            <a href="https://dinobane.com/#/community" style="display:inline-block;background:#1a1a1a;border:1px solid #333;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:700;">Join the Discussion in the Community</a>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #222;">
            <p style="margin:0;font-size:12px;color:#555;">You're receiving this weekly digest because you're a DinoBane member. <a href="https://dinobane.com" style="color:#cc2a2a;">Manage your membership</a></p>
            <p style="margin:6px 0 0;font-size:12px;"><a href="https://dinobane.com" style="color:#cc2a2a;">dinobane.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      // Send to all members
      let sent = 0;
      for (const member of members) {
        try {
          await resend.emails.send({
            from: "DinoBane <noreply@dinobane.com>",
            to: member.email,
            subject: `📺 DinoBane Weekly — ${thisWeek.length} new video${thisWeek.length > 1 ? "s" : ""} this week`,
            html,
          });
          sent++;
        } catch (e: any) {
          console.error(`[newsletter] failed to send to ${member.email}:`, e.message);
        }
      }
      console.log(`[newsletter] sent to ${sent}/${members.length} members`);
    } catch (e: any) {
      console.error("[newsletter] error:", e.message);
    }
  }

  // Schedule: check every hour — fire when it's Sunday and between 02:00–02:59 UTC (9 AM Bangkok)
  // Persist the last-sent date so it only fires once per week even if server restarts within that hour
  let newsletterLastSentDate = "";
  setInterval(async () => {
    const now = new Date();
    const dayUTC = now.getUTCDay();   // 0 = Sunday
    const hourUTC = now.getUTCHours(); // 2 = 09:00 Bangkok
    const dateStr = now.toISOString().slice(0, 10);
    if (dayUTC === 0 && hourUTC === 2 && newsletterLastSentDate !== dateStr) {
      newsletterLastSentDate = dateStr;
      console.log(`[newsletter] firing weekly dispatch for ${dateStr}`);
      await sendWeeklyNewsletter();
    }
  }, 60 * 60 * 1000); // check once per hour

  // ─── WEBSOCKET SERVER ─────────────────────────────────────────────────────────
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.on("error", () => {});
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function parseYouTubeFeed(xml: string): any[] {
  try {
    const entries: any[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const getTag = (tag: string) => {
        const m = entry.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`));
        return m ? m[1].trim() : "";
      };
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const videoId = videoIdMatch ? videoIdMatch[1] : "";
      const published = getTag("published");
      const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || "";

      if (videoId) {
        entries.push({
          id: videoId,
          title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          publishedAt: published,
        });
      }
    }
    return entries.slice(0, 12);
  } catch {
    return getFallbackVideos();
  }
}

function getFallbackVideos() {
  // Real DinoBane video IDs as fallback if RSS is unavailable
  return [
    { id: "Tyho3Qiq8eY", title: "Graham Moore — [Unfiltered]", thumbnail: "https://img.youtube.com/vi/Tyho3Qiq8eY/mqdefault.jpg", url: "https://www.youtube.com/watch?v=Tyho3Qiq8eY", publishedAt: "2026-03-13T20:19:50+00:00" },
    { id: "glP5aWLwd6s", title: "Inside The Mind of a Leftist", thumbnail: "https://img.youtube.com/vi/glP5aWLwd6s/mqdefault.jpg", url: "https://www.youtube.com/watch?v=glP5aWLwd6s", publishedAt: "2026-03-12T13:54:12+00:00" },
    { id: "Xfz1TaCRblA", title: "They Buried This Footage For a Reason", thumbnail: "https://img.youtube.com/vi/Xfz1TaCRblA/mqdefault.jpg", url: "https://www.youtube.com/watch?v=Xfz1TaCRblA", publishedAt: "2026-03-12T13:02:10+00:00" },
    { id: "gfZDulfXDQU", title: "We're Taking It Back", thumbnail: "https://img.youtube.com/vi/gfZDulfXDQU/mqdefault.jpg", url: "https://www.youtube.com/watch?v=gfZDulfXDQU", publishedAt: "2026-03-11T12:23:38+00:00" },
    { id: "Z1Ok0954i-8", title: "[ WARNING! ] This Video Will Make You a Patriot", thumbnail: "https://img.youtube.com/vi/Z1Ok0954i-8/mqdefault.jpg", url: "https://www.youtube.com/watch?v=Z1Ok0954i-8", publishedAt: "2026-03-11T07:11:48+00:00" },
    { id: "QFFO3EyGKUo", title: "Ben Habib Is Cooked", thumbnail: "https://img.youtube.com/vi/QFFO3EyGKUo/mqdefault.jpg", url: "https://www.youtube.com/watch?v=QFFO3EyGKUo", publishedAt: "2026-03-10T19:58:30+00:00" },
    { id: "DFaVsor8JeI", title: "The 'DEBATE' Is Over", thumbnail: "https://img.youtube.com/vi/DFaVsor8JeI/mqdefault.jpg", url: "https://www.youtube.com/watch?v=DFaVsor8JeI", publishedAt: "2026-03-10T16:53:13+00:00" },
    { id: "fxEwgChVQEs", title: "The BATTLE LINES Have Been Drawn", thumbnail: "https://img.youtube.com/vi/fxEwgChVQEs/mqdefault.jpg", url: "https://www.youtube.com/watch?v=fxEwgChVQEs", publishedAt: "2026-03-09T14:21:40+00:00" },
    { id: "8oVK_gK_aN8", title: "There Is No 'SPLIT' on The 'Right Wing'", thumbnail: "https://img.youtube.com/vi/8oVK_gK_aN8/mqdefault.jpg", url: "https://www.youtube.com/watch?v=8oVK_gK_aN8", publishedAt: "2026-03-07T14:13:31+00:00" },
    { id: "4NecXlxplf8", title: "The Cat's Out Of The Bag...", thumbnail: "https://img.youtube.com/vi/4NecXlxplf8/mqdefault.jpg", url: "https://www.youtube.com/watch?v=4NecXlxplf8", publishedAt: "2026-03-05T19:58:39+00:00" },
    { id: "4dCSN4G0G68", title: "Nothing About This Makes Sense. We Need To Unite", thumbnail: "https://img.youtube.com/vi/4dCSN4G0G68/mqdefault.jpg", url: "https://www.youtube.com/watch?v=4dCSN4G0G68", publishedAt: "2026-03-05T14:56:36+00:00" },
    { id: "8qvL5O3faWg", title: "These Channels Are DANGEROUS", thumbnail: "https://img.youtube.com/vi/8qvL5O3faWg/mqdefault.jpg", url: "https://www.youtube.com/watch?v=8qvL5O3faWg", publishedAt: "2026-03-05T12:09:24+00:00" },
  ];
}

// ─── AI ARTICLE GENERATION (OpenRouter — free tier) ──────────────────────────
async function generateArticleAI(title: string, url: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    try {
      const prompt = `You are writing a political commentary article for DinoBane, a UK YouTube channel covering corruption, immigration, media censorship, and stories the mainstream media buries. The tone is direct, no-nonsense, pro-English, and right-leaning.

Write a 400-500 word article based on this YouTube video title: "${title}"
Video URL: ${url}

Structure:
- Strong opening paragraph capturing the core argument
- 3-4 body paragraphs expanding on the theme
- A closing paragraph calling for awareness or action

Write in proper paragraphs (no bullet points, no markdown headers). Return only the article HTML using <p> tags for paragraphs. Do not include a title tag.`;

      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://dinobane.com",
          "X-Title": "DinoBane Platform",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (r.ok) {
        const data = await r.json() as any;
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content && content.length > 200) return content;
      }
    } catch (e) {
      console.error("OpenRouter error:", e);
    }
  }
  // Fallback if no API key or AI fails
  return `<p>This is a written analysis of the DinoBane video: <strong>${title}</strong>.</p><p>The video covers a topic that the mainstream media consistently ignores or misrepresents. DinoBane breaks it down with the context that establishment outlets refuse to provide.</p><p>Watch the full video here: <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>`;
}

// ─── NEWS / INTEL RSS FEED ────────────────────────────────────────────────────
// This is appended at module level — registered via registerRoutes call above
