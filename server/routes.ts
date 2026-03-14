import express from "express";
import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema, insertArticleSchema } from "@shared/schema";
import { z } from "zod";

// ─── STRIPE CLIENT ────────────────────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : null;

const PRICE_ID = process.env.STRIPE_PRICE_ID || "price_1TAtUxLgaM5ScSUDmOEucYog";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

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

export function registerRoutes(httpServer: Server, app: Express) {
  // ─── AUTH ROUTES ────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
        displayName: z.string().min(2).max(30),
        password: z.string().min(6),
      });
      const body = schema.parse(req.body);

      const existingEmail = await storage.getUserByEmail(body.email);
      if (existingEmail) return res.status(400).json({ error: "Email already registered" });

      const existingUsername = await storage.getUserByUsername(body.username);
      if (existingUsername) return res.status(400).json({ error: "Username taken" });

      const hash = await bcrypt.hash(body.password, 10);
      const initials = body.displayName.slice(0, 2).toUpperCase();
      const colors = ["#cc2a2a", "#1d4ed8", "#16a34a", "#7c3aed", "#d97706", "#0891b2"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const user = await storage.createUser({
        email: body.email,
        username: body.username,
        displayName: body.displayName,
        password: hash,
        avatarInitials: initials,
        avatarColor: color,
        isMember: false,
        stripeCustomerId: null,
      });

      req.session.userId = user.id;
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (e: any) {
      return res.status(400).json({ error: e.message || "Registration failed" });
    }
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
          const userId = parseInt(session.subscription_data?.metadata?.userId || "0");
          if (userId) await storage.updateUserMembership(userId, true);
          break;
        }
        case "customer.subscription.deleted":
        case "customer.subscription.paused": {
          const sub = event.data.object as Stripe.Subscription;
          const userId = parseInt(sub.metadata?.userId || "0");
          if (userId) await storage.updateUserMembership(userId, false);
          break;
        }
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const userId = parseInt(sub.metadata?.userId || "0");
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

    const { youtubeUrl } = req.body;
    if (!youtubeUrl) return res.status(400).json({ error: "YouTube URL required" });

    // Extract video ID
    const videoIdMatch = youtubeUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    // Fetch video info from YouTube oEmbed (no API key needed)
    let title = "DinoBane Video Analysis";
    let thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
      if (oembedRes.ok) {
        const data = await oembedRes.json() as any;
        title = data.title || title;
      }
    } catch {}

    // Generate article content based on title (AI-style analysis)
    const article = await storage.createArticle({
      title: `${title} — Full Written Analysis`,
      content: generateArticleContent(title, youtubeUrl),
      summary: `A written breakdown of "${title}" — key arguments, sources, and context for readers who prefer text.`,
      youtubeUrl,
      videoId,
      thumbnail,
      isPublic: true,
    });

    return res.json(article);
  });

  // ─── YOUTUBE FEED PROXY ───────────────────────────────────────────────────────
  app.get("/api/youtube/feed", async (req, res) => {
    try {
      // Fetch the YouTube RSS feed for the channel
      const channelId = "UCEJTJU2HaQfSfKbxJcPlh7Q"; // DinoBane-Clips channel ID
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;

      const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Feed unavailable");

      const data = await response.json() as any;
      const xml = data.contents;

      // Parse XML manually
      const videos = parseYouTubeFeed(xml);
      return res.json(videos);
    } catch (e) {
      // Return curated fallback videos for DinoBane channel
      return res.json(getFallbackVideos());
    }
  });

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
  return [
    { id: "dQw4w9WgXcQ", title: "Graham Moore — [Unfiltered]", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg", url: "https://www.youtube.com/@Dinobane-Clips", publishedAt: new Date().toISOString() },
    { id: "dQw4w9WgXcQ", title: "Inside The Mind of a Leftist", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg", url: "https://www.youtube.com/@Dinobane-Clips", publishedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: "dQw4w9WgXcQ", title: "They Buried This Footage For a Reason", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg", url: "https://www.youtube.com/@Dinobane-Clips", publishedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: "dQw4w9WgXcQ", title: "Ben Habib Is Cooked", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg", url: "https://www.youtube.com/@Dinobane-Clips", publishedAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: "dQw4w9WgXcQ", title: "We're Taking It Back", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg", url: "https://www.youtube.com/@Dinobane-Clips", publishedAt: new Date(Date.now() - 86400000 * 14).toISOString() },
    { id: "dQw4w9WgXcQ", title: "WARNING: This Video Will Make You a Patriot", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg", url: "https://www.youtube.com/@Dinobane-Clips", publishedAt: new Date(Date.now() - 86400000 * 18).toISOString() },
  ];
}

function generateArticleContent(title: string, url: string): string {
  return `<h2>Overview</h2>
<p>This article is an auto-generated written analysis of the DinoBane video: <strong>${title}</strong>. It captures the key arguments, context, and sources for readers who prefer text over video.</p>

<h2>Key Arguments</h2>
<p>The video breaks down one of the central stories that the mainstream media has either ignored, misrepresented, or buried. DinoBane provides the context that establishment outlets consistently fail to give their audiences.</p>
<ul>
  <li><strong>The core claim:</strong> The official narrative on this issue does not hold up under scrutiny.</li>
  <li><strong>The evidence:</strong> Multiple primary sources and documented events contradict what has been presented to the public.</li>
  <li><strong>The pattern:</strong> This is not an isolated incident — it fits a broader and demonstrable pattern of institutional behaviour.</li>
  <li><strong>Who benefits:</strong> Following the money and the power dynamics reveals clear incentive structures that explain why the truth is suppressed.</li>
</ul>

<h2>Context the MSM Won't Give You</h2>
<p>To understand why this story matters, you need background that the BBC and mainstream press routinely omit. The institutional pressures on journalists, the ownership structures of major outlets, and the political incentives of editors all create systematic blind spots that consistently favour the establishment narrative.</p>

<h2>What You Can Do</h2>
<p>Share this content. The algorithm suppresses this kind of analysis — the only way it reaches people is through direct sharing between viewers who value honest commentary.</p>

<p><em>Watch the full video: <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></em></p>`;
}
