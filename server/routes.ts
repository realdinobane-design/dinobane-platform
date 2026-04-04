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
import https from "https";
import http from "http";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

// ─── STRIPE CLIENT ────────────────────────────────────────────────────────────
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : null;

const PRICE_ID = process.env.STRIPE_PRICE_ID || "price_1TAtUxLgaM5ScSUDmOEucYog";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
// ─── SHARED EMAIL ASSETS ──────────────────────────────────────────────────────
// Pre-load logo once at startup; used by all email templates via CID attachment
const EMAIL_LOGO_PATH = require('path').join(__dirname, '../client/public/brand/email-logo.jpg');
let _emailLogoBuffer: Buffer | null = null;
function getEmailLogo(): Buffer | null {
  if (_emailLogoBuffer) return _emailLogoBuffer;
  try { _emailLogoBuffer = require('fs').readFileSync(EMAIL_LOGO_PATH); return _emailLogoBuffer; } catch { return null; }
}

// Returns the standard branded header table rows (logo left, title right) + footer row
// logoSrc should be "cid:logo" when sending with attachment, or omit for plain text fallback
function emailHeader(subtitle: string): string {
  return `
        <tr>
          <td style="background:#cc2a2a;padding:20px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;width:56px;">
                  <img src="cid:logo" alt="DinoBane" width="56" height="56" style="display:block;border-radius:6px;" />
                </td>
                <td style="vertical-align:middle;padding-left:14px;">
                  <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:0.08em;display:block;line-height:1.1;">DINOBANE</span>
                  <span style="font-size:12px;color:rgba(255,255,255,0.75);display:block;margin-top:3px;letter-spacing:0.04em;">${subtitle}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
}
function emailFooter(note: string): string {
  return `
        <tr>
          <td style="background:#0d0d0d;border-top:1px solid #1a1a1a;padding:18px 28px;">
            <p style="margin:0;font-size:11px;color:#444;line-height:1.6;">${note}</p>
          </td>
        </tr>`;
}
function emailWrapper(innerRows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:36px 16px;">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#111;border:1px solid #1f1f1f;border-radius:4px;overflow:hidden;">
        ${innerRows}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
function logoAttachment() {
  const buf = getEmailLogo();
  return buf ? [{ content: buf, filename: 'logo.jpg', contentType: 'image/jpeg', contentId: 'logo' }] : [];
}

// ─── EMAIL CLIENT (Resend) ────────────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// ─── VERIFICATION TOKEN STORE ───────────────────────────────────────────────
// Tokens are stored in the DB-backed sessions table so they survive server
// restarts (Railway deploys, crashes, etc.). We use a dedicated pg table.
// Falls back to in-memory if DB is unavailable.
const verificationTokens = new Map<string, { userId: number; email: string; expires: number }>();

async function storeVerificationToken(token: string, userId: number, email: string, expires: number) {
  verificationTokens.set(token, { userId, email, expires });
  try {
    const { pool } = await import("./db");
    await pool.query(
      `INSERT INTO verification_tokens (token, user_id, email, expires_at)
       VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))
       ON CONFLICT (token) DO NOTHING`,
      [token, userId, email, expires]
    );
  } catch (e: any) { console.warn("[verify-token] db store failed:", e.message); }
}

async function getVerificationToken(token: string): Promise<{ userId: number; email: string; expires: number } | null> {
  // Check in-memory first
  if (verificationTokens.has(token)) return verificationTokens.get(token)!;
  // Fall back to DB (after server restart)
  try {
    const { pool } = await import("./db");
    const r = await pool.query(
      `SELECT user_id, email, EXTRACT(EPOCH FROM expires_at)*1000 AS expires_ms
       FROM verification_tokens WHERE token=$1`,
      [token]
    );
    if (r.rows.length === 0) return null;
    const row = r.rows[0];
    const record = { userId: row.user_id, email: row.email, expires: Math.floor(parseFloat(row.expires_ms)) };
    verificationTokens.set(token, record); // warm the cache
    return record;
  } catch (e: any) { console.warn("[verify-token] db lookup failed:", e.message); return null; }
}

async function deleteVerificationToken(token: string) {
  verificationTokens.delete(token);
  try {
    const { pool } = await import("./db");
    await pool.query(`DELETE FROM verification_tokens WHERE token=$1`, [token]);
  } catch (e: any) { console.warn("[verify-token] db delete failed:", e.message); }
}

async function ensureVerificationTokensTable() {
  try {
    const { pool } = await import("./db");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);
    // Clean up expired tokens on startup
    await pool.query(`DELETE FROM verification_tokens WHERE expires_at < now()`);
  } catch (e: any) { console.warn("[verify-token] table setup failed:", e.message); }
}
ensureVerificationTokensTable();

async function ensureAppSettingsTable() {
  try {
    const { pool } = await import("./db");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  } catch (e: any) { console.warn("[app-settings] table setup failed:", e.message); }
}
ensureAppSettingsTable();

async function ensureDmTables() {
  const { pool } = await import("./db");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS private_messages (
        id SERIAL PRIMARY KEY,
        from_id INTEGER NOT NULL,
        to_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dm_notifications (
        id SERIAL PRIMARY KEY,
        from_id INTEGER NOT NULL,
        to_id INTEGER NOT NULL,
        sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS dm_from_to ON private_messages(from_id, to_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS dm_to_unread ON private_messages(to_id) WHERE read_at IS NULL`);
    console.log("[dm] tables ready");
  } catch (e: any) { console.warn("[dm] table setup failed:", e.message); }
}
ensureDmTables();

async function ensureReactionsTable() {
  const { pool } = await import("./db");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message_id INTEGER,
        dm_id INTEGER,
        emoji TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS reactions_unique ON message_reactions(user_id, emoji, message_id, dm_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS reactions_message ON message_reactions(message_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS reactions_dm ON message_reactions(dm_id)`);
    console.log("[reactions] table ready");
  } catch (e: any) { console.warn("[reactions] table setup failed:", e.message); }
}
ensureReactionsTable();

async function ensureBookmarksTable() {
  const { pool } = await import("./db");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS intel_bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        story_link TEXT NOT NULL,
        story_title TEXT NOT NULL,
        story_source TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(user_id, story_link)
      )
    `);
    console.log("[bookmarks] table ready");
  } catch (e: any) { console.warn("[bookmarks] table setup failed:", e.message); }
}
ensureBookmarksTable();

async function ensureBlockReportTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        id SERIAL PRIMARY KEY,
        blocker_id INTEGER NOT NULL,
        blocked_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(blocker_id, blocked_id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL,
        reported_user_id INTEGER NOT NULL,
        content_type TEXT NOT NULL,
        content_id INTEGER,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("[block-report] tables ready");
  } catch (e: any) { console.warn("[block-report] table setup failed:", e.message); }
}
ensureBlockReportTables();

// ─── MENTION EMAIL RATE LIMITER ───────────────────────────────────────────────
// ─── WELCOME EMAIL ──────────────────────────────────────────────────────────
async function sendWelcomeEmail(email: string, displayName: string) {
  if (!resend) return;
  const appUrl = process.env.VITE_APP_URL || "https://dinobane.com";
  const channels = [
    ["#general", "Main chat — anything goes"],
    ["#news-links", "Drop links to stories you find"],
    ["#video-discussion", "Discuss the latest videos"],
    ["#off-topic", "Banter, memes, off-the-record"],
  ];
  const html = emailWrapper(`
    ${emailHeader("Member Welcome")}
    <tr>
      <td style="padding:32px 28px 8px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#fff;letter-spacing:1px;text-transform:uppercase;">You're In.</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#aaa;line-height:1.7;">Welcome to <strong style="color:#fff;">DinoBane</strong>, ${displayName}. Your membership is now active — you've got full access to everything below.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #1f1f1f;border-radius:3px;background:#0d0d0d;">
          ${channels.map(([ch, desc], i) => `
          <tr>
            <td style="padding:13px 18px;${i < channels.length - 1 ? 'border-bottom:1px solid #1a1a1a;' : ''}">
              <span style="color:#cc2a2a;font-weight:700;font-size:13px;">${ch}&nbsp;</span>
              <span style="color:#888;font-size:13px;">${desc}</span>
            </td>
          </tr>`).join('')}
          <tr>
            <td style="padding:13px 18px;border-top:1px solid #1a1a1a;">
              <span style="color:#cc2a2a;font-weight:700;font-size:13px;">Media Vault&nbsp;</span>
              <span style="color:#888;font-size:13px;">Members-only content &amp; exclusives</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:4px 28px 28px;">
        <a href="${appUrl}/#/community" style="display:inline-block;background:#cc2a2a;color:#fff;font-weight:700;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:15px 36px;text-decoration:none;border-radius:2px;">Enter the Community &rarr;</a>
      </td>
    </tr>
    <tr>
      <td style="padding:0 28px 24px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #2a2a2a;border-radius:3px;background:#141414;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">Billing &amp; Account Issues?</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Email us at <a href="mailto:contact@dinobane.com" style="color:#cc2a2a;text-decoration:none;font-weight:600;">contact@dinobane.com</a> and we'll sort it out for you.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${emailFooter("&copy; 2026 DinoBane. You're receiving this because you just became a member at <a href=\"" + appUrl + "\" style=\"color:#555;text-decoration:none;\">dinobane.com</a>. Cancel any time from your <a href=\"" + appUrl + "/#/profile\" style=\"color:#555;text-decoration:underline;\">billing portal</a>.")}
  `);
  try {
    await resend.emails.send({
      from: "DinoBane <noreply@dinobane.com>",
      to: email,
      subject: "Welcome to DinoBane — You're in.",
      html,
      attachments: logoAttachment(),
    });
    console.log(`[welcome-email] sent to ${email}`);
  } catch (e: any) {
    console.error(`[welcome-email] failed for ${email}:`, e.message);
  }
}

// ─── ADMIN NEW MEMBER NOTIFICATION ─────────────────────────────────────────────
async function notifyAdminNewMember(email: string, displayName: string) {
  if (!resend) return;
  const html = emailWrapper(`
    ${emailHeader("Admin Alert")}
    <tr>
      <td style="padding:28px 28px 8px;">
        <h2 style="margin:0 0 20px;font-size:16px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:1px;">New Member Joined</h2>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #1f1f1f;border-radius:3px;background:#0d0d0d;">
          <tr>
            <td style="padding:14px 18px;border-bottom:1px solid #1a1a1a;">
              <span style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Name</span><br/>
              <span style="color:#fff;font-size:15px;font-weight:700;margin-top:4px;display:block;">${displayName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 18px;">
              <span style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Email</span><br/>
              <span style="color:#cc2a2a;font-size:15px;font-weight:700;margin-top:4px;display:block;">${email}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 28px;">
        <a href="https://dinobane.com/#/admin/users" style="display:inline-block;background:#cc2a2a;color:#fff;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;text-decoration:none;border-radius:2px;">View in Admin Panel →</a>
      </td>
    </tr>
    ${emailFooter("Sent automatically by DinoBane when a new paid member joins.")}
  `);
  try {
    await resend.emails.send({
      from: "DinoBane <noreply@dinobane.com>",
      to: "realdinobane@gmail.com",
      subject: `⭐ New member: ${displayName}`,
      html,
      attachments: logoAttachment(),
    });
    console.log(`[admin-notify] new member notification sent for ${email}`);
  } catch (e: any) {
    console.error(`[admin-notify] failed:`, e.message);
  }
}

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
      html: emailWrapper(`
        ${emailHeader("Community Alert")}
        <tr>
          <td style="padding:28px 28px 12px;">
            <p style="margin:0 0 14px;font-size:16px;color:#e5e5e5;">Hey <strong>@${mentionedUser.username}</strong>,</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#aaa;"><strong style="color:#fff;">@${mentionedByUsername}</strong> mentioned you in <strong style="color:#fff;">#${channelLabel}</strong>. Head over to the community to see what they said.</p>
            <a href="https://dinobane.com/#/community" style="display:inline-block;background:#cc2a2a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:2px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">View Message &rarr;</a>
          </td>
        </tr>
        ${emailFooter("You're receiving this because you're a DinoBane member. At most one of these per day.")}
      `),
      attachments: logoAttachment(),
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

      // ── STRIPE PRE-PAYMENT CHECK ─────────────────────────────────────────────
      // If this email already has an active Stripe subscription (paid before
      // registering, or paid via a direct link), grant membership immediately.
      let preGrantMember = false;
      let preGrantCustomerId: string | null = null;
      if (stripe) {
        try {
          const existingCustomers = await stripe.customers.list({ email: body.email, limit: 1 });
          if (existingCustomers.data.length > 0) {
            const cus = existingCustomers.data[0];
            const activeSubs = await stripe.subscriptions.list({ customer: cus.id, status: "active", limit: 1 });
            if (activeSubs.data.length > 0) {
              preGrantMember = true;
              preGrantCustomerId = cus.id;
              console.log(`[register] pre-payment detected for ${body.email} — granting membership on registration`);
            }
          }
        } catch (e: any) {
          console.error("[register] stripe pre-check failed:", e.message);
        }
      }
      // ── END PRE-PAYMENT CHECK ────────────────────────────────────────────────

      const user = await storage.createUser({
        email: body.email,
        username: body.username,
        displayName,
        password: hash,
        avatarInitials: initials,
        avatarColor: color,
        isMember: preGrantMember,
        stripeCustomerId: preGrantCustomerId,
      });

      // Link userId into Stripe customer metadata if pre-granted
      if (preGrantMember && preGrantCustomerId && stripe) {
        stripe.customers.update(preGrantCustomerId, { metadata: { userId: String(user.id) } }).catch(() => {});
      }

      // Send welcome email immediately for pre-granted members (they've already paid)
      if (preGrantMember) {
        sendWelcomeEmail(user.email, user.displayName).catch(() => {});
        notifyAdminNewMember(user.email, user.displayName).catch(() => {});
      }

      // Generate email verification token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
      await storeVerificationToken(token, user.id, user.email, tokenExpires);

      // Send verification email
      const appUrl = process.env.VITE_APP_URL || "https://dinobane.com";
      const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

      if (resend) {
        const emailSubject = preGrantMember
          ? "Welcome to DinoBane — Verify your email to get in"
          : "Verify your DinoBane account";
        const emailBody = preGrantMember
          ? `Hi <strong style="color:#fff;">${user.displayName}</strong>, we found your payment — your membership is ready. Just verify your email to access the community.`
          : `Hi <strong style="color:#fff;">${user.displayName}</strong>, click the button below to verify your email address and proceed to membership.`;
        const buttonText = preGrantMember ? "Verify Email &amp; Access Community" : "Verify Email &amp; Join";
        await resend.emails.send({
          from: "DinoBane <noreply@dinobane.com>",
          to: user.email,
          subject: emailSubject,
          html: emailWrapper(`
            ${emailHeader("Account Verification")}
            <tr>
              <td style="padding:28px 28px 12px;">
                <h2 style="margin:0 0 14px;font-size:18px;font-weight:900;color:#fff;">Verify your email</h2>
                <p style="color:#aaa;font-size:14px;margin:0 0 24px;line-height:1.7;">${emailBody}</p>
                <a href="${verifyUrl}" style="display:inline-block;background:#cc2a2a;color:#fff;font-weight:700;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 32px;text-decoration:none;border-radius:2px;">${buttonText}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <p style="color:#555;font-size:11px;margin:0;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
              </td>
            </tr>
            ${emailFooter("&copy; 2026 DinoBane &mdash; <a href=\"https://dinobane.com\" style=\"color:#555;text-decoration:none;\">dinobane.com</a>")}
          `),
          attachments: logoAttachment(),
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

    const record = await getVerificationToken(token);
    if (!record) {
      return res.send(relayPage("/#/register?error=invalid_token", "Link not found — it may have already been used."));
    }
    if (Date.now() > record.expires) {
      await deleteVerificationToken(token);
      return res.send(relayPage("/#/register?error=expired_token", "Link expired — please register again."));
    }

    await deleteVerificationToken(token); // single-use

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

  // ─── FORGOT / RESET PASSWORD ───────────────────────────────────────────────────
  // In-memory password reset token store (also persisted to DB like verify tokens)
  const passwordResetTokens = new Map<string, { userId: number; expires: number }>();

  async function storePasswordResetToken(token: string, userId: number, expires: number) {
    passwordResetTokens.set(token, { userId, expires });
    try {
      const { pool } = await import("./db");
      await pool.query(
        `CREATE TABLE IF NOT EXISTS password_reset_tokens (
          token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at TIMESTAMPTZ NOT NULL
        )`,
      );
      await pool.query(
        `INSERT INTO password_reset_tokens (token, user_id, expires_at)
         VALUES ($1, $2, to_timestamp($3 / 1000.0))
         ON CONFLICT (token) DO NOTHING`,
        [token, userId, expires]
      );
    } catch (e: any) { console.warn("[reset-token] db store failed:", e.message); }
  }

  async function getPasswordResetToken(token: string): Promise<{ userId: number; expires: number } | null> {
    if (passwordResetTokens.has(token)) return passwordResetTokens.get(token)!;
    try {
      const { pool } = await import("./db");
      const r = await pool.query(
        `SELECT user_id, EXTRACT(EPOCH FROM expires_at)*1000 AS expires_ms FROM password_reset_tokens WHERE token=$1`,
        [token]
      );
      if (r.rows.length === 0) return null;
      const row = r.rows[0];
      const record = { userId: row.user_id, expires: Math.floor(parseFloat(row.expires_ms)) };
      passwordResetTokens.set(token, record);
      return record;
    } catch (e: any) { return null; }
  }

  async function deletePasswordResetToken(token: string) {
    passwordResetTokens.delete(token);
    try {
      const { pool } = await import("./db");
      await pool.query(`DELETE FROM password_reset_tokens WHERE token=$1`, [token]);
    } catch (e: any) {}
  }

  // POST /api/auth/forgot-password — sends reset link
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    // Always return 200 to prevent email enumeration
    const user = await storage.getUserByEmail(email);
    if (!user || !resend) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    await storePasswordResetToken(token, user.id, expires);

    const appUrl = process.env.VITE_APP_URL || "https://dinobane.com";
    const resetUrl = `${appUrl}/#/reset-password?token=${token}`;

    await resend.emails.send({
      from: "DinoBane <noreply@dinobane.com>",
      to: user.email,
      subject: "Reset your DinoBane password",
      html: emailWrapper(`
        ${emailHeader("Account Security")}
        <tr>
          <td style="padding:28px 28px 12px;">
            <h2 style="margin:0 0 14px;font-size:18px;font-weight:900;color:#fff;">Reset your password</h2>
            <p style="color:#aaa;font-size:14px;line-height:1.7;margin:0 0 24px;">Hi ${user.displayName}, click the button below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#cc2a2a;color:#fff;font-weight:700;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 32px;text-decoration:none;border-radius:2px;">Reset Password &rarr;</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 24px;">
            <p style="color:#555;font-size:11px;margin:0;">If you didn't request this, ignore this email. Your password won't change.</p>
          </td>
        </tr>
        ${emailFooter("&copy; 2026 DinoBane &mdash; <a href=\"https://dinobane.com\" style=\"color:#555;text-decoration:none;\">dinobane.com</a>")}
      `),
      attachments: logoAttachment(),
    }).catch(() => {});

    return res.json({ ok: true });
  });

  // POST /api/auth/reset-password — consumes token and sets new password
  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const record = await getPasswordResetToken(token);
    if (!record) return res.status(400).json({ error: "Invalid or expired reset link" });
    if (Date.now() > record.expires) {
      await deletePasswordResetToken(token);
      return res.status(400).json({ error: "Reset link has expired — please request a new one" });
    }

    const hash = await bcrypt.hash(password, 10);
    await storage.updateUserProfile(record.userId, { password: hash });
    await deletePasswordResetToken(token);

    return res.json({ ok: true });
  });

  // POST /api/auth/change-password — authenticated user changes their own password
  app.post("/api/auth/change-password", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current password and new password are required" });
    if (newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });

    const user = await storage.getUserById(req.session.userId);
    if (!user || !user.password) return res.status(401).json({ error: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(newPassword, 10);
    await storage.updateUserProfile(req.session.userId, { password: hash });

    return res.json({ ok: true });
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
    const results = await storage.getMessagesByUser(req.session.userId);
    return res.json(results);
  });

  // ─── STRIPE CHECKOUT ────────────────────────────────────────────────────────────
  app.post("/api/stripe/checkout", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    if (!stripe) return res.status(503).json({ error: "Payments not configured" });

    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.isMember) return res.status(400).json({ error: "Already a member" });

    const appUrl = process.env.VITE_APP_URL || "https://dinobane.com";

    try {
      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        // Check if a Stripe customer already exists for this email (prevents duplicates)
        const existing = await stripe.customers.list({ email: user.email, limit: 1 });
        if (existing.data.length > 0) {
          customerId = existing.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.displayName,
            metadata: { userId: String(user.id) },
          });
          customerId = customer.id;
        }
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      // ── DUPLICATE PAYMENT GUARD ──────────────────────────────────────────────
      // If this customer already has an active subscription, do NOT create a new
      // checkout session. Instead, self-heal by granting membership immediately.
      const activeSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      if (activeSubs.data.length > 0) {
        // They already paid — fix their account right now
        await storage.updateUserMembership(user.id, true);
        sendWelcomeEmail(user.email, user.displayName).catch(() => {});
        notifyAdminNewMember(user.email, user.displayName).catch(() => {});
        console.log(`[checkout] duplicate guard triggered — auto-granted membership to userId ${user.id} (existing sub: ${activeSubs.data[0].id})`);
        return res.status(400).json({
          error: "already_subscribed",
          message: "You already have an active subscription. Your membership has been activated — please refresh the page.",
        });
      }
      // ── END GUARD ────────────────────────────────────────────────────────────

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

    const appUrl = process.env.VITE_APP_URL || "https://dinobane.com";

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
            const webhookUser = await storage.getUserById(userId);
            if (webhookUser) {
              sendWelcomeEmail(webhookUser.email, webhookUser.displayName).catch(() => {});
              notifyAdminNewMember(webhookUser.email, webhookUser.displayName).catch(() => {});
            }
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
  // POST /api/membership/activate — dev/fallback only, admin-only when Stripe is live
  // When Stripe IS configured (production), this endpoint is blocked entirely.
  // When Stripe is NOT configured, only admins can activate membership (prevents free bypass).
  app.post("/api/membership/activate", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    // In production (Stripe configured), this endpoint is disabled entirely
    if (stripe) return res.status(403).json({ error: "Membership must be purchased via checkout" });
    // Without Stripe (dev only), restrict to admin accounts only
    const caller = await storage.getUserById(req.session.userId);
    if (!caller || !ADMIN_EMAILS.has(caller.email)) {
      return res.status(403).json({ error: "Admin only" });
    }
    const user = await storage.updateUserMembership(req.session.userId, true);
    sendWelcomeEmail(user.email, user.displayName).catch(() => {});
    notifyAdminNewMember(user.email, user.displayName).catch(() => {});
    const { password: _, ...safeUser } = user;
    return res.json(safeUser);
  });

  // ─── COMMUNITY (MESSAGES) ────────────────────────────────────────────────────
  // GET /api/community/members — public list of paid members (username + display name + avatar)
  app.get("/api/community/members", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Members only" });
    const me = await storage.getUserById(req.session.userId);
    if (!me?.isMember) return res.status(403).json({ error: "Membership required" });
    const all = await storage.getAllUsers();
    const members = all
      .filter(u => u.isMember)
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarInitials: u.avatarInitials,
        avatarColor: u.avatarColor,
        avatarUrl: u.avatarUrl ?? null,
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
    return res.json(members);
  });

  // ─── BLOCK / UNBLOCK ──────────────────────────────────────────────────────
  app.post("/api/users/:id/block", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const blockerId = req.session.userId;
    const blockedId = parseInt(req.params.id);
    if (blockerId === blockedId) return res.status(400).json({ error: "Cannot block yourself" });
    await storage.blockUser(blockerId, blockedId);
    return res.json({ ok: true });
  });

  app.delete("/api/users/:id/block", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    await storage.unblockUser(req.session.userId, parseInt(req.params.id));
    return res.json({ ok: true });
  });

  app.get("/api/users/blocked", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const blocked = await storage.getBlockedUsers(req.session.userId);
    return res.json(blocked);
  });

  // ─── REPORT ───────────────────────────────────────────────────────────────
  app.post("/api/report", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const { reportedUserId, contentType, contentId, reason, details } = req.body;
    if (!reportedUserId || !contentType || !reason) return res.status(400).json({ error: "Missing fields" });
    if (req.session.userId === reportedUserId) return res.status(400).json({ error: "Cannot report yourself" });
    await storage.createReport({
      reporterId: req.session.userId,
      reportedUserId,
      contentType,
      contentId: contentId || null,
      reason,
      details: details || null,
    });
    return res.json({ ok: true });
  });

  // ─── ADMIN: view reports ───────────────────────────────────────────────────
  app.get("/api/admin/reports", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const allReports = await storage.getAllReports();
    return res.json(allReports);
  });

  app.patch("/api/admin/reports/:id", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const { status } = req.body;
    await storage.updateReportStatus(parseInt(req.params.id), status);
    return res.json({ ok: true });
  });

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

  // Get replies for a post
  app.get("/api/messages/:id/replies", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Members only" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Membership required" });
    const parentId = parseInt(req.params.id);
    if (isNaN(parentId)) return res.status(400).json({ error: "Invalid id" });
    const replies = await storage.getReplies(parentId);
    return res.json(replies);
  });

  // Get reply count for multiple posts at once
  app.post("/api/messages/reply-counts", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Members only" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Membership required" });
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids)) return res.status(400).json({ error: "ids must be array" });
    const counts: Record<number, number> = {};
    await Promise.all(ids.map(async id => {
      counts[id] = await storage.getReplyCount(id);
    }));
    return res.json(counts);
  });

  // ─── ARTICLES ────────────────────────────────────────────────────────────────
  // Articles cache — 2 min TTL, invalidated on write
  let articlesCache: { data: any[]; fetchedAt: number } | null = null;
  const ARTICLES_CACHE_TTL = 2 * 60 * 1000;
  async function getArticlesCached() {
    if (articlesCache && (Date.now() - articlesCache.fetchedAt) < ARTICLES_CACHE_TTL) return articlesCache.data;
    const articles = await storage.getArticles();
    articlesCache = { data: articles, fetchedAt: Date.now() };
    return articles;
  }
  function invalidateArticlesCache() { articlesCache = null; }

  app.get("/api/articles", async (req, res) => {
    if (articlesCache && (Date.now() - articlesCache.fetchedAt) < ARTICLES_CACHE_TTL) {
      res.setHeader("X-Cache", "HIT");
      return res.json(articlesCache.data);
    }
    if (articlesCache) {
      res.setHeader("X-Cache", "STALE");
      getArticlesCached().catch(() => {});
      return res.json(articlesCache.data);
    }
    res.setHeader("X-Cache", "MISS");
    return res.json(await getArticlesCached());
  });

  app.get("/api/articles/:id", async (req, res) => {
    const article = await storage.getArticleById(parseInt(req.params.id));
    if (!article) return res.status(404).json({ error: "Not found" });
    return res.json(article);
  });

  app.post("/api/articles/generate", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;

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

    invalidateArticlesCache();
    return res.json(article);
  });

  // POST /api/admin/articles/regenerate-all — wipe all articles and regenerate from transcripts
  // Secured with cron secret so it can be called without a session cookie
  app.post("/api/admin/articles/regenerate-all", async (req, res) => {
    const secret = req.headers["x-cron-secret"] || req.body?.secret;
    if (secret !== "DinoBane2026CronSecret") return res.status(403).json({ error: "Forbidden" });
    // Respond immediately — this is a slow operation
    res.json({ ok: true, status: "regeneration_started" });
    // Run in background
    (async () => {
      try {
        const allArticles = await storage.getAllArticles();
        console.log(`[regen] Starting regeneration of ${allArticles.length} articles`);
        let regenerated = 0;
        for (const article of allArticles) {
          if (!article.youtubeUrl) continue;
          try {
            const newContent = await generateArticleAI(article.title, article.youtubeUrl);
            await storage.updateArticle(article.id, { content: newContent });
            regenerated++;
            console.log(`[regen] ✓ ${article.title.slice(0, 50)}`);
            await new Promise(r => setTimeout(r, 1500)); // pace requests
          } catch (e: any) {
            console.error(`[regen] ✗ ${article.title.slice(0, 50)}: ${e.message}`);
          }
        }
        invalidateArticlesCache();
        console.log(`[regen] Complete — regenerated ${regenerated}/${allArticles.length} articles`);
      } catch (e: any) {
        console.error(`[regen] Fatal error: ${e.message}`);
      }
    })();
  });

  // ─── ADMIN: UPDATE ARTICLE CONTENT ──────────────────────────────────────────
  app.patch("/api/admin/articles/:id", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { content, summary } = req.body;
    const updated = await storage.updateArticle(id, { ...(content && { content }), ...(summary && { summary }) });
    return res.json(updated);
  });

  // DELETE /api/admin/articles/:id — admin hard-delete any article
  app.delete("/api/admin/articles/:id", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    await storage.deleteArticle(id);
    invalidateArticlesCache();
    return res.json({ ok: true });
  });

  // GET /api/admin/messages — list all community messages across all channels (admin)
  app.get("/api/admin/messages", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const channels = ["general", "politics", "media", "immigration", "corruption", "free-speech"];
    const all: any[] = [];
    for (const ch of channels) {
      const msgs = await storage.getMessages(ch);
      msgs.forEach(m => all.push({ ...m, channel: ch }));
    }
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(all);
  });

  // DELETE /api/messages/:id — user deletes their own message (or admin deletes any)
  app.delete("/api/messages/:id", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const caller = await storage.getUserById(req.session.userId);
    if (!caller) return res.status(401).json({ error: "User not found" });
    // Find the message to verify ownership
    const { pool } = await import("./db");
    const r = await pool.query(`SELECT user_id FROM messages WHERE id = $1`, [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Message not found" });
    const isOwner = r.rows[0].user_id === req.session.userId;
    const isAdmin = ADMIN_EMAILS.has(caller.email);
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "You can only delete your own messages" });
    await storage.deleteMessage(id);
    return res.json({ ok: true });
  });

  // DELETE /api/admin/messages/:id — admin hard-delete any community message + its replies
  app.delete("/api/admin/messages/:id", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    await storage.deleteMessage(id);
    return res.json({ ok: true });
  });

  // ─── ADMIN USER MANAGEMENT ────────────────────────────────────────────────────

  // ─── PRIVATE DIRECT MESSAGES ─────────────────────────────────────────────────

  // Send DM notification email (max 1 per day per sender→recipient pair)
  async function sendDmNotificationEmail(fromUser: any, toUser: any) {
    if (!resend || !toUser?.email) return;
    const alreadySent = await storage.getDmEmailSentToday(fromUser.id, toUser.id);
    if (alreadySent) return;
    const appUrl = process.env.VITE_APP_URL || "https://dinobane.com";
    try {
      const html = emailWrapper(`
        ${emailHeader("Private Message")}
        <tr>
          <td style="padding:32px 28px 24px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#cc2a2a;text-transform:uppercase;letter-spacing:0.08em;">New Message</p>
            <p style="margin:0 0 20px;font-size:22px;font-weight:900;color:#fff;line-height:1.2;">
              ${fromUser.displayName} sent you a message
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#aaa;line-height:1.6;">
              You have a new private message waiting on DinoBane. Log in to read it and reply.
            </p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#cc2a2a;border-radius:3px;">
                  <a href="${appUrl}/#/community"
                     style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">
                    Read &amp; Reply
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #2a2a2a;border-radius:3px;background:#141414;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:1px;">Sent by</p>
                  <p style="margin:0;font-size:13px;color:#888;">${fromUser.displayName} &middot; @${fromUser.username}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${emailFooter("&copy; 2026 DinoBane. You received this because a member sent you a private message. <a href=\"${appUrl}/#/community\" style=\"color:#555;text-decoration:underline;\">Log in to manage your messages</a>.")}
      `);
      await resend.emails.send({
        from: "DinoBane <noreply@dinobane.com>",
        to: toUser.email,
        subject: `New message from ${fromUser.displayName} on DinoBane`,
        attachments: logoAttachment(),
        html,
      });
      await storage.recordDmEmailSent(fromUser.id, toUser.id);
      console.log(`[dm] notification email sent: ${fromUser.email} → ${toUser.email}`);
    } catch (e: any) {
      console.error(`[dm] email failed:`, e.message, e);
    }
  }

  // GET /api/dm/unread/count — total unread DM count for current user
  app.get("/api/dm/unread/count", async (req, res) => {
    if (!req.session.userId) return res.json({ count: 0 });
    const count = await storage.getUnreadDmCount(req.session.userId);
    return res.json({ count });
  });

  // GET /api/dm/conversations — list all DM conversations
  app.get("/api/dm/conversations", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const convos = await storage.getDmConversations(req.session.userId);
    return res.json(convos);
  });

  // GET /api/dm/:userId — fetch DM history with a specific user
  app.get("/api/dm/:userId", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const otherId = parseInt(req.params.userId);
    if (isNaN(otherId)) return res.status(400).json({ error: "Invalid user ID" });
    const msgs = await storage.getDmHistory(req.session.userId, otherId);
    await storage.markDmsRead(otherId, req.session.userId);
    return res.json(msgs);
  });

  // POST /api/dm/:userId — send a DM to a user
  app.post("/api/dm/:userId", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const toId = parseInt(req.params.userId);
    if (isNaN(toId) || toId === req.session.userId) return res.status(400).json({ error: "Invalid recipient" });
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Message cannot be empty" });
    const msg = await storage.sendDm(req.session.userId, toId, content.trim());
    const sender = await storage.getUserById(req.session.userId);
    const recipient = await storage.getUserById(toId);
    if (sender && recipient) sendDmNotificationEmail(sender, recipient).catch((e: any) => console.error('[dm] notification failed:', e.message));
    return res.json(msg);
  });

  // POST /api/admin/dm/clear-throttle — admin clears DM email throttle records
  app.post("/api/admin/dm/clear-throttle", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const { pool } = await import("./db");
    await pool.query(`DELETE FROM dm_notifications`);
    return res.json({ ok: true, message: "DM email throttle cleared" });
  });

  // ─── REACTIONS ─────────────────────────────────────────────────────────────

  // GET /api/reactions?messageId=X  or  ?dmId=X
  app.get("/api/reactions", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const messageId = req.query.messageId ? parseInt(req.query.messageId as string) : undefined;
    const dmId = req.query.dmId ? parseInt(req.query.dmId as string) : undefined;
    if (messageId === undefined && dmId === undefined) return res.status(400).json({ error: "messageId or dmId required" });
    const reactions = await storage.getReactions(messageId, dmId);
    return res.json(reactions);
  });

  // POST /api/reactions — toggle a reaction (add if not present, remove if present)
  app.post("/api/reactions", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const { emoji, messageId, dmId } = req.body;
    if (!emoji) return res.status(400).json({ error: "emoji required" });
    if (messageId === undefined && dmId === undefined) return res.status(400).json({ error: "messageId or dmId required" });
    // Validate emoji is from the allowed set
    const ALLOWED_EMOJIS = ["👍","🔥","😂","😡","😮","❤️","👏","🏴‍☠️"];
    if (!ALLOWED_EMOJIS.includes(emoji)) return res.status(400).json({ error: "Invalid emoji" });
    const result = await storage.toggleReaction(req.session.userId, emoji, messageId, dmId);
    return res.json(result);
  });

  // ─── INTEL BOOKMARKS ─────────────────────────────────────────────────────────

  // GET /api/bookmarks — get current user's bookmarks
  app.get("/api/bookmarks", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const { pool } = await import("./db");
    const r = await pool.query(
      `SELECT * FROM intel_bookmarks WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.session.userId]
    );
    return res.json(r.rows.map(row => ({ id: row.id, storyLink: row.story_link, storyTitle: row.story_title, storySource: row.story_source, createdAt: row.created_at })));
  });

  // POST /api/bookmarks — toggle bookmark (add or remove)
  app.post("/api/bookmarks", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const { storyLink, storyTitle, storySource } = req.body;
    if (!storyLink || !storyTitle) return res.status(400).json({ error: "storyLink and storyTitle required" });
    const { pool } = await import("./db");
    // Check if exists
    const existing = await pool.query(
      `SELECT id FROM intel_bookmarks WHERE user_id = $1 AND story_link = $2`,
      [req.session.userId, storyLink]
    );
    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM intel_bookmarks WHERE id = $1`, [existing.rows[0].id]);
      return res.json({ bookmarked: false });
    } else {
      await pool.query(
        `INSERT INTO intel_bookmarks (user_id, story_link, story_title, story_source) VALUES ($1, $2, $3, $4)`,
        [req.session.userId, storyLink, storyTitle, storySource || "Unknown"]
      );
      return res.json({ bookmarked: true });
    }
  });

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
    sendWelcomeEmail(updated.email, updated.displayName).catch(() => {});
    notifyAdminNewMember(updated.email, updated.displayName).catch(() => {});
    const { password: _, ...safe } = updated;
    console.log(`[admin] membership manually granted to userId ${targetId} by admin ${check.adminUser.email}`);
    return res.json(safe);
  });

  // POST /api/admin/send-welcome-to-members — one-off: send welcome email to all current members
  app.post("/api/admin/send-welcome-to-members", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const allUsers = await storage.getAllUsers();
    const members = allUsers.filter((u: any) => u.isMember);
    let sent = 0;
    for (const u of members) {
      await sendWelcomeEmail(u.email, u.displayName);
      sent++;
    }
    console.log(`[admin] sent welcome email to ${sent} existing members`);
    return res.json({ ok: true, sent });
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

  // POST /api/admin/cleanup — delete all non-member accounts older than 24h (admin only)
  app.post("/api/admin/cleanup", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const users = await storage.getAllUsers();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    const stale = users.filter(u =>
      !u.isMember &&
      new Date(u.createdAt).getTime() < cutoff
    );
    let deleted = 0;
    for (const u of stale) {
      await storage.deleteUser(u.id);
      deleted++;
      console.log(`[admin cleanup] deleted stale non-member account: ${u.email} (userId ${u.id})`);
    }
    return res.json({ deleted, message: `Removed ${deleted} unpaid account(s) older than 24h.` });
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

  // ─── ADMIN EMAIL CONTROL CENTRE ──────────────────────────────────────────────

  // GET /api/admin/emails/config — returns all email template metadata + schedule info
  app.get("/api/admin/emails/config", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;

    // Calculate next newsletter send time (next Sunday 02:00 UTC = 09:00 Bangkok)
    const now = new Date();
    const nextSunday = new Date(now);
    const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7;
    nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
    nextSunday.setUTCHours(2, 0, 0, 0);

    // Load intel briefing send time (default 14:00 Bangkok = 07:00 UTC)
    const intelTimeStr = await storage.getSetting("intel_briefing_time_utc") || "07:00";
    const [intelHour, intelMin] = intelTimeStr.split(":").map(Number);
    const nextIntel = new Date(now);
    nextIntel.setUTCHours(intelHour, intelMin, 0, 0);
    if (nextIntel <= now) nextIntel.setUTCDate(nextIntel.getUTCDate() + 1); // if today's send already passed, next is tomorrow
    // Bangkok display time (UTC+7)
    const intelBkkHour = (intelHour + 7) % 24;
    const intelBkkDisplay = `${String(intelBkkHour).padStart(2, "0")}:${String(intelMin).padStart(2, "0")}`;

    const allUsers = await storage.getAllUsers();
    const memberCount = allUsers.filter(u => u.isMember && u.email).length;

    return res.json({
      emails: [
        {
          id: "welcome",
          name: "Welcome Email",
          description: "Sent automatically when someone subscribes and pays their first £5.",
          trigger: "Automatic — on successful Stripe payment",
          schedule: null,
          nextSend: null,
          recipients: "New member only",
          recipientCount: null,
          subject: "Welcome to DinoBane — You're in.",
          canTestSend: true,
          canManualTrigger: false,
        },
        {
          id: "newsletter",
          name: "Weekly Newsletter",
          description: "Sent every Sunday at 9 AM Bangkok time. Shows top 5 videos uploaded that week. Skipped if no new videos.",
          trigger: "Automatic — every Sunday 09:00 Bangkok (02:00 UTC)",
          schedule: "Sunday 09:00 Bangkok",
          nextSend: nextSunday.toISOString(),
          recipients: "All paid members",
          recipientCount: memberCount,
          subject: "📺 DinoBane Weekly — [N] new videos this week",
          canTestSend: true,
          canManualTrigger: true,
        },
        {
          id: "mention",
          name: "Mention Notification",
          description: "Sent when a member is @mentioned in the community chat. Max once per day per user to avoid spam.",
          trigger: "Automatic — on @mention in community chat",
          schedule: null,
          nextSend: null,
          recipients: "Mentioned member only",
          recipientCount: null,
          subject: "📣 @[user] mentioned you in the DinoBane community",
          canTestSend: true,
          canManualTrigger: false,
        },
        {
          id: "password-reset",
          name: "Password Reset",
          description: "Sent when a user requests a password reset. Contains a secure one-time link valid for 1 hour.",
          trigger: "Automatic — on password reset request",
          schedule: null,
          nextSend: null,
          recipients: "Requesting user only",
          recipientCount: null,
          subject: "Reset your DinoBane password",
          canTestSend: true,
          canManualTrigger: false,
        },
        {
          id: "admin-new-member",
          name: "Admin: New Member Alert",
          description: "Sent to the admin email (realdinobane@gmail.com) whenever a new member joins. Includes their name and email.",
          trigger: "Automatic — on new paid member",
          schedule: null,
          nextSend: null,
          recipients: "Admin only (realdinobane@gmail.com)",
          recipientCount: 1,
          subject: "⭐ New member: [display name]",
          canTestSend: true,
          canManualTrigger: false,
        },
        {
          id: "intel-briefing",
          name: "Intel Daily Briefing",
          description: `Sent daily at ${intelBkkDisplay} Bangkok time to all paid members. Top 8 UK political stories — corruption, immigration, censorship, geopolitics, and suppressed news. You can change the send time or fire it manually below.`,
          trigger: `Automatic daily at ${intelBkkDisplay} Bangkok (${intelTimeStr} GMT)`,
          schedule: `Daily ${intelBkkDisplay} Bangkok`,
          nextSend: nextIntel.toISOString(),
          sendTimeUtc: intelTimeStr,
          sendTimeBkk: intelBkkDisplay,
          recipients: "All paid members",
          recipientCount: memberCount,
          subject: "🔴 DinoBane Intel — Daily Briefing [date]",
          canTestSend: true,
          canManualTrigger: true,
        },
      ],
      stats: {
        memberCount,
        resendConfigured: !!resend,
      },
    });
  });

  // POST /api/admin/emails/test-send — send a test copy of any template to admin email
  app.post("/api/admin/emails/test-send", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    if (!resend) return res.status(503).json({ error: "Resend not configured — set RESEND_API_KEY env var" });

    const { emailId } = req.body;
    if (!emailId) return res.status(400).json({ error: "emailId required" });

    const adminEmail = check.adminUser.email;
    const appUrl = process.env.VITE_APP_URL || "https://dinobane.com";

    try {
      switch (emailId) {
        case "welcome":
          await sendWelcomeEmail(adminEmail, check.adminUser.displayName || "DinoBane Admin");
          break;

        case "newsletter":
          await sendWeeklyNewsletter(true, adminEmail);
          break;

        case "mention":
          await resend.emails.send({
            from: "DinoBane <noreply@dinobane.com>",
            to: adminEmail,
            subject: `[TEST] 📣 @TestUser mentioned you in the DinoBane community`,
            html: emailWrapper(`
              ${emailHeader("Community Alert — TEST")}
              <tr>
                <td style="padding:28px 28px 12px;">
                  <p style="margin:0 0 14px;font-size:16px;color:#e5e5e5;">Hey <strong>@AdminUser</strong>,</p>
                  <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#aaa;"><strong style="color:#fff;">@TestUser</strong> mentioned you in <strong style="color:#fff;">#General</strong>. Head over to the community to see what they said.</p>
                  <a href="${appUrl}/#/community" style="display:inline-block;background:#cc2a2a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:2px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">View Message &rarr;</a>
                </td>
              </tr>
              ${emailFooter("TEST EMAIL — This is how a mention notification looks to members.")}
            `),
            attachments: logoAttachment(),
          });
          break;

        case "password-reset":
          await resend.emails.send({
            from: "DinoBane <noreply@dinobane.com>",
            to: adminEmail,
            subject: `[TEST] Reset your DinoBane password`,
            html: emailWrapper(`
              ${emailHeader("Account Security — TEST")}
              <tr>
                <td style="padding:28px 28px 12px;">
                  <h2 style="margin:0 0 14px;font-size:18px;font-weight:900;color:#fff;">Reset your password</h2>
                  <p style="color:#aaa;font-size:14px;line-height:1.7;margin:0 0 24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
                  <a href="${appUrl}/#/forgot-password" style="display:inline-block;background:#cc2a2a;color:#fff;font-weight:700;font-size:13px;letter-spacing:2px;text-transform:uppercase;padding:14px 32px;text-decoration:none;border-radius:2px;">Reset Password →</a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 28px 24px;">
                  <p style="color:#555;font-size:11px;margin:0;">TEST EMAIL — If you didn't request this, ignore this email.</p>
                </td>
              </tr>
              ${emailFooter("TEST EMAIL — &copy; 2026 DinoBane")}
            `),
            attachments: logoAttachment(),
          });
          break;

        case "admin-new-member":
          await notifyAdminNewMember(adminEmail, "Test Member");
          break;

        case "intel-briefing":
          await sendIntelBriefing(adminEmail);
          break;

        default:
          return res.status(400).json({ error: `Unknown emailId: ${emailId}` });
      }

      return res.json({ ok: true, sentTo: adminEmail });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // POST /api/admin/emails/trigger-newsletter — manually fire the newsletter right now
  app.post("/api/admin/emails/trigger-newsletter", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    if (!resend) return res.status(503).json({ error: "Resend not configured" });
    try {
      await sendWeeklyNewsletter();
      return res.json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Broadcast intel briefing to all paying members
  async function sendIntelBriefingToAllMembers() {
    const allUsers = await storage.getAllUsers();
    const members = allUsers.filter((u: any) => u.isMember && u.email);
    if (members.length === 0) { console.log("[intel-briefing] no members to send to"); return 0; }
    // Fetch the feed ONCE and reuse for all members — avoids re-fetching RSS for every recipient
    const cachedStories = await refreshIntelCache();
    let sent = 0;
    for (const member of members) {
      try {
        await sendIntelBriefing(member.email, cachedStories);
        sent++;
        // Small delay between sends to avoid Resend rate limits
        await new Promise(r => setTimeout(r, 200));
      } catch (e: any) {
        console.error(`[intel-briefing] failed to send to ${member.email}: ${e.message}`);
      }
    }
    console.log(`[intel-briefing] broadcast complete — sent to ${sent}/${members.length} members`);
    return sent;
  }

  // POST /api/admin/emails/trigger-intel — manually fire the intel briefing (admin only)
  app.post("/api/admin/emails/trigger-intel", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    if (!resend) return res.status(503).json({ error: "Resend not configured" });
    const { testMode, testEmail } = req.body ?? {};
    try {
      if (testMode) {
        const recipient = testEmail || check.adminUser.email;
        await sendIntelBriefing(recipient);
        return res.json({ ok: true, sentTo: recipient, mode: "test" });
      } else {
        // Full broadcast to all paying members
        const sent = await sendIntelBriefingToAllMembers();
        return res.json({ ok: true, sentTo: sent, mode: "broadcast" });
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // POST /api/admin/emails/intel-schedule — update the intel briefing send time
  app.post("/api/admin/emails/intel-schedule", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const { timeBkk } = req.body ?? {}; // expects "HH:MM" in Bangkok time
    if (!timeBkk || !/^\d{2}:\d{2}$/.test(timeBkk)) {
      return res.status(400).json({ error: "timeBkk must be HH:MM format" });
    }
    const [bkkHour, bkkMin] = timeBkk.split(":").map(Number);
    if (bkkHour < 0 || bkkHour > 23 || bkkMin < 0 || bkkMin > 59) {
      return res.status(400).json({ error: "Invalid time" });
    }
    // Convert Bangkok (UTC+7) to UTC
    const utcHour = (bkkHour - 7 + 24) % 24;
    const utcStr = `${String(utcHour).padStart(2, "0")}:${String(bkkMin).padStart(2, "0")}`;
    await storage.setSetting("intel_briefing_time_utc", utcStr);
    console.log(`[intel-schedule] updated to ${timeBkk} Bangkok (${utcStr} UTC)`);
    return res.json({ ok: true, timeBkk, timeUtc: utcStr });
  });

  // ─── INTEL STORY BLOCK LIST ─────────────────────────────────────────────────
  // Admin can block individual stories by URL — persisted in app_settings as JSON array.
  async function getBlockedLinks(): Promise<string[]> {
    try {
      const raw = await storage.getSetting("intel_blocked_links");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  // POST /api/admin/intel/block — admin blocks a story by URL
  app.post("/api/admin/intel/block", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const { url } = req.body;
    if (!url || typeof url !== "string") return res.status(400).json({ error: "url required" });
    const blocked = await getBlockedLinks();
    if (!blocked.includes(url)) {
      blocked.push(url);
      await storage.setSetting("intel_blocked_links", JSON.stringify(blocked));
    }
    // Remove from live cache immediately so it vanishes without waiting for next refresh
    if (intelCache) {
      intelCache.data = intelCache.data.filter((item: any) => item.link !== url);
    }
    console.log(`[intel] admin blocked story: ${url}`);
    return res.json({ ok: true, blockedCount: blocked.length });
  });

  // DELETE /api/admin/intel/block — admin unblocks a story URL
  app.delete("/api/admin/intel/block", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });
    const blocked = await getBlockedLinks();
    const updated = blocked.filter((u: string) => u !== url);
    await storage.setSetting("intel_blocked_links", JSON.stringify(updated));
    return res.json({ ok: true, blockedCount: updated.length });
  });

  // GET /api/admin/intel/blocked — list all blocked story URLs
  app.get("/api/admin/intel/blocked", async (req, res) => {
    const check = await requireAdmin(req, res);
    if (!check.ok) return;
    return res.json(await getBlockedLinks());
  });

  // POST /api/admin/setup-test-account — one-time: creates test@dinobane.com as a verified paid member
  app.post("/api/admin/setup-test-account", async (req, res) => {
    const secret = req.headers["x-cron-secret"];
    if (secret !== "DinoBane2026CronSecret") return res.status(403).json({ error: "Forbidden" });
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("TestMember2026!", 10);
    const existing = await storage.getUserByEmail("test@dinobane.com");
    if (existing) {
      await storage.updateUserMembership(existing.id, true);
      return res.json({ ok: true, action: "updated", id: existing.id });
    }
    const user = await storage.createUser({
      email: "test@dinobane.com",
      password: hash,
      username: "test_member",
      displayName: "TEST",
      isMember: true,
      isVerified: true,
      avatarColor: "#cc2a2a",
      avatarInitials: "T",
    });
    return res.json({ ok: true, action: "created", id: user.id });
  });

  // GET /api/intel/schedule-info — returns current intel briefing send time (used by cron)
  app.get("/api/intel/schedule-info", async (_req, res) => {
    const sendTimeUtc = await storage.getSetting("intel_briefing_time_utc") || "07:00";
    return res.json({ sendTimeUtc });
  });

  // POST /api/intel/auto-broadcast — internal endpoint called by daily cron
  // Responds immediately (202) and runs the broadcast in the background to avoid HTTP timeouts
  app.post("/api/intel/auto-broadcast", async (req, res) => {
    const secret = req.headers["x-cron-secret"];
    if (secret !== "DinoBane2026CronSecret") return res.status(403).json({ error: "Forbidden" });
    if (!resend) return res.status(503).json({ error: "Resend not configured" });
    // Acknowledge immediately so the cron doesn't time out
    res.status(202).json({ ok: true, status: "broadcast_started" });
    // Run broadcast in background
    sendIntelBriefingToAllMembers()
      .then(sent => console.log(`[auto-broadcast] complete — sent to ${sent} members`))
      .catch(e => console.error(`[auto-broadcast] failed: ${e.message}`));
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

  // ─── MEDIA LIKES ─────────────────────────────────────────────────────────────
  // GET /api/media/stats — bulk stats for ALL media in 3 DB queries total
  app.get("/api/media/stats", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Members only" });
    const stats = await storage.getAllMediaStats(req.session.userId);
    return res.json(stats);
  });

  // GET: returns like count + whether the current user has liked it
  app.get("/api/media/:id/likes", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Members only" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const [count, liked] = await Promise.all([
      storage.getMediaLikeCount(id),
      storage.hasUserLikedMedia(id, req.session.userId),
    ]);
    return res.json({ count, liked });
  });

  // POST: toggle like
  app.post("/api/media/:id/likes", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Members only" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const result = await storage.toggleMediaLike(id, req.session.userId);
    return res.json(result);
  });

  // ─── MEDIA COMMENTS ──────────────────────────────────────────────────────────
  // GET: all comments for a media item
  app.get("/api/media/:id/comments", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Members only" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const comments = await storage.getMediaComments(id);
    return res.json(comments);
  });

  // POST: add a comment
  app.post("/api/media/:id/comments", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Members only" });
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0)
      return res.status(400).json({ error: "Comment cannot be empty" });
    if (content.trim().length > 500)
      return res.status(400).json({ error: "Comment too long (max 500 chars)" });
    const comment = await storage.createMediaComment({
      mediaId: id,
      userId: req.session.userId,
      content: content.trim(),
    });
    return res.json(comment);
  });

  // DELETE: remove a comment (own comment, or admin)
  app.delete("/api/media/comments/:commentId", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUserById(req.session.userId);
    if (!user?.isMember) return res.status(403).json({ error: "Members only" });
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) return res.status(400).json({ error: "Invalid ID" });
    const isAdmin = ADMIN_EMAILS.has(user.email);
    await storage.deleteMediaComment(commentId, req.session.userId, isAdmin);
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
  // ─── INTEL FEED CACHE — avoids fetching 26 RSS feeds on every page load ────────
  let intelCache: { data: any[]; fetchedAt: number } | null = null;
  const INTEL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  let intelFetchInProgress = false;

  async function refreshIntelCache(): Promise<any[]> {
    if (intelFetchInProgress) {
      // Already fetching — return stale data if available
      if (intelCache) return intelCache.data;
      await new Promise(r => setTimeout(r, 500));
      return intelCache?.data ?? [];
    }
    intelFetchInProgress = true;
    try {
      // ─── FEED SOURCES ─────────────────────────────────────────────────────────────────
      // RULE: only use politics/news-specific feeds — never root-level feeds for
      // tabloids (Daily Mail, The Sun) which mix in sport, celeb and betting content.
      const FEEDS = [
      // ─ Alt / right-leaning (these are politics-only by nature)
      { name: "Guido Fawkes",           url: "https://order-order.com/feed/" },
      { name: "Spiked Online",          url: "https://www.spiked-online.com/feed/" },
      { name: "GB News",                url: "https://www.gbnews.com/feed" },
      { name: "The Spectator",          url: "https://www.spectator.co.uk/feed/" },
      { name: "Breitbart London",       url: "https://www.breitbart.com/london/feed/" },
      { name: "The Daily Sceptic",      url: "https://dailysceptic.org/feed/" },
      { name: "The Conservative Woman", url: "https://www.conservativewoman.co.uk/feed/" },
      { name: "Reclaim The Net",        url: "https://reclaimthenet.org/feed/" },
      { name: "The Gateway Pundit",     url: "https://www.thegatewaypundit.com/feed/" },
      { name: "Westmonster",            url: "https://westmonster.com/feed/" },
      { name: "UnHerd",                 url: "https://unherd.com/feed/" },
      { name: "The Critic",             url: "https://thecritic.co.uk/feed/" },
      { name: "ConservativeHome",       url: "https://www.conservativehome.com/feed/" },
      { name: "Iain Dale",              url: "https://iaindale.com/feed/" },
      { name: "ZeroHedge",              url: "https://feeds.feedburner.com/zerohedge/feed" },
      // ─ Mainstream UK — POLITICS-ONLY feeds (avoids sport/celeb/betting sections)
      { name: "Daily Mail",             url: "https://www.dailymail.co.uk/news/politics/index.rss" },
      { name: "The Telegraph",          url: "https://www.telegraph.co.uk/politics/rss.xml" },
      { name: "The Times",              url: "https://www.thetimes.co.uk/rss/news/politics" },
      { name: "The Guardian",           url: "https://www.theguardian.com/politics/rss" },
      { name: "BBC News",               url: "https://feeds.bbci.co.uk/news/politics/rss.xml" },
      { name: "Sky News",               url: "https://feeds.skynews.com/feeds/rss/politics.xml" },
      { name: "The Independent",        url: "https://www.independent.co.uk/news/uk/politics/rss" },
      { name: "The Mirror",             url: "https://www.mirror.co.uk/news/politics/?service=rss" },
      { name: "Express",                url: "https://www.express.co.uk/news/politics/rss" },
      { name: "The Sun Politics",       url: "https://www.thesun.co.uk/news/politics/feed/" },
    ];

      // ─── CONTENT FILTER ─────────────────────────────────────────────────────────────────
      // Hard blocklist — any story whose title/description matches ANY of these
      // terms is silently dropped. Covers sport, betting, celeb gossip, trivial content.
      const BLOCKED_TERMS = [
        // Sport
        "premier league", "champions league", "fa cup", "world cup", "euro 2024", "euro 2025",
        "football", "soccer", "rugby", "cricket", "tennis", "golf", "boxing", "ufc", "mma",
        "formula 1", "formula one", "grand prix", "nfl", "nba", "transfer deadline",
        "match report", "half-time", "full-time", "goal", "scorer", "fixture",
        // Betting / gambling
        "betting", "odds", "bookmaker", "accumulator", "each-way", "ante-post",
        "free bet", "sign-up offer", "best odds", "gamble", "casino", "slots",
        // Celebrity / gossip / entertainment
        "celebrity", "celeb", "showbiz", "kardashian", "reality tv", "love island",
        "strictly", "x factor", "the voice", "big brother",
        "bafta", "oscars", "grammys", "brit awards",
        "married", "divorce", "baby bump", "pregnant", "affair",
        "bikini", "swimsuit", "lingerie",
        // Lifestyle / trivial
        "recipe", "horoscope", "astrology", "lottery", "euromillions",
        "property prices", "house prices",
        "tv review", "film review", "music review",
      ];

      function isBlockedStory(title: string, desc: string): boolean {
        const haystack = (title + " " + desc).toLowerCase();
        return BLOCKED_TERMS.some(term => haystack.includes(term));
      }

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
          const decodeEntities = (s: string) => s
            .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&apos;/g, "'")
            .replace(/&#(\d+);/g, (_: string, n: string) => String.fromCharCode(parseInt(n, 10)))
            .replace(/&#x([0-9a-fA-F]+);/g, (_: string, h: string) => String.fromCharCode(parseInt(h, 16)))
            .replace(/&nbsp;/g, " ").replace(/&ndash;/g, "–").replace(/&mdash;/g, "—")
            .replace(/&lsquo;/g, "\u2018").replace(/&rsquo;/g, "\u2019")
            .replace(/&ldquo;/g, "\u201C").replace(/&rdquo;/g, "\u201D");
          const title = decodeEntities(getTag("title"));
          const link = getTag("link") || block.match(/<link[^>]+href=["']([^"']+)["']/)?.[1] || "";
          const pubDate = getTag("pubDate") || getTag("published") || getTag("updated") || "";
          const desc = getTag("description") || getTag("summary") || getTag("content");
          const cleanDesc = decodeEntities(desc.replace(/<[^>]+>/g, "")).slice(0, 200).trim();
          // Extract inline image from RSS (media:thumbnail, media:content, enclosure, or img inside description)
          const inlineImage =
            block.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ||
            block.match(/media:content[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)?.[1] ||
            block.match(/<enclosure[^>]+type="image[^"]*"[^>]+url=["']([^"']+)["']/i)?.[1] ||
            block.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)?.[1] ||
            desc.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
            null;
          if (title && link) {
            items.push({ title, link, pubDate, description: cleanDesc, source: name, image: inlineImage || null });
          }
        }
        return items.slice(0, 8);
      } catch { return []; }
    }

      const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f.name, f.url)));
      const allItems: any[] = [];
      results.forEach(r => { if (r.status === "fulfilled") allItems.push(...r.value); });

      // Apply content filter — drop sport, betting, celeb, gossip
      const filtered = allItems.filter(item => !isBlockedStory(item.title || "", item.description || ""));
      const blocked = allItems.length - filtered.length;
      if (blocked > 0) console.log(`[intel] filtered out ${blocked} blocked stories (sport/betting/celeb)`);

      // ─── TOPIC BOOST ─────────────────────────────────────────────────────────────────
      // Stories matching these topics are promoted to the top of the feed.
      // Sorted by recency within each priority tier.
      const PRIORITY_TOPICS = [
        // UK corruption & establishment
        "grooming", "grooming gang", "rape gang", "child abuse", "paedophile",
        "corruption", "cover-up", "cover up", "scandal", "exposed", "leaked",
        "two-tier", "two tier", "police fail",
        // Islam / Islamism in political context
        "islam", "islamist", "sharia", "mosque", "jihad", "muslim",
        "grooming gang", "rotherham", "telford", "rochdale",
        // Zionism / Israeli political influence
        "zionist", "zionism", "israel", "aipac", "gaza", "netanyahu",
        "palestine", "lobby", "israeli",
        // Immigration & borders
        "immigration", "migrant", "illegal", "small boats", "channel crossing",
        "asylum", "deportation", "rwanda",
        // Free speech & censorship
        "censorship", "free speech", "deplatform", "banned", "silenced",
        "hate speech", "thought crime",
        // Geopolitics
        "nato", "ukraine", "russia", "china", "wef", "globalist",
      ];

      function getStoryScore(title: string, desc: string): number {
        const haystack = (title + " " + desc).toLowerCase();
        let score = 0;
        for (const term of PRIORITY_TOPICS) {
          if (haystack.includes(term)) score += 10;
        }
        return score;
      }

      filtered.sort((a, b) => {
        const scoreA = getStoryScore(a.title || "", a.description || "");
        const scoreB = getStoryScore(b.title || "", b.description || "");
        // Primary: topic relevance score (higher = better)
        if (scoreB !== scoreA) return scoreB - scoreA;
        // Secondary: recency
        const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return db - da;
      });
      const top100 = filtered.slice(0, 100);

      // Cache immediately with RSS-only images — users get fast response
      intelCache = { data: top100, fetchedAt: Date.now() };
      console.log(`[intel] cache refreshed — ${top100.length} stories from ${FEEDS.length} feeds`);

      // Background enrichment: fetch og:image for stories missing inline images
      // Runs AFTER cache is set so it never blocks a user request
      ;(async () => {
        async function fetchOgImage(url: string): Promise<string | null> {
          try {
            const r = await fetch(url, {
              signal: AbortSignal.timeout(2500),
              headers: { "User-Agent": "Mozilla/5.0", "Range": "bytes=0-16384" },
            });
            if (!r.ok) return null;
            const chunk = await r.text();
            return chunk.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
              || chunk.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
              || chunk.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
              || null;
          } catch { return null; }
        }
        const noImage = top100.filter((item: any) => !item.image).slice(0, 30);
        if (!noImage.length) return;
        const results = await Promise.allSettled(noImage.map((item: any) => fetchOgImage(item.link)));
        let enriched = 0;
        results.forEach((r, i) => {
          if (r.status === "fulfilled" && r.value) { noImage[i].image = r.value; enriched++; }
        });
        if (enriched > 0) console.log(`[intel] enriched ${enriched} story images in background`);
      })().catch(() => {});

      return top100;
    } finally {
      intelFetchInProgress = false;
    }
  }

  // ─── INTEL BRIEFING EMAIL ────────────────────────────────────────────────────
  // Sends a branded daily intel digest. Only fires when admin triggers manually.
  async function sendIntelBriefing(to: string, preloadedStories?: any[]) {
    if (!resend) throw new Error("Resend not configured");
    const allStories: any[] = preloadedStories ?? await refreshIntelCache();
    const top8 = allStories.slice(0, 8);
    if (top8.length === 0) throw new Error("No intel stories available — feed may be empty");
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    function tagStory(item: any): { label: string; color: string; bg: string } {
      const title = (item.title || "").toLowerCase();
      const explosive = ["record","surge","exposed","scandal","leaked","shock","crisis","collapse","ban","fury","outrage","exclusive","breaking","court","arrest","cover"];
      const isViral = explosive.some(w => title.includes(w));
      const altSources = ["Guido Fawkes","Spiked Online","GB News","The Spectator","ZeroHedge","Breitbart London","The Daily Sceptic","The Conservative Woman","UnHerd","Reclaim The Net","The Gateway Pundit","Westmonster","The Critic","ConservativeHome"];
      const isSuppressed = altSources.includes(item.source) && !isViral;
      if (isViral) return { label: "🔥 VIRAL", color: "#ff4444", bg: "#2a0000" };
      if (isSuppressed) return { label: "🕵️ SUPPRESSED", color: "#a78bfa", bg: "#1a0a2e" };
      return { label: "📰 NEWS", color: "#aaa", bg: "#1a1a1a" };
    }
    const storyCards = top8.map((item: any, i: number) => {
      const tag = tagStory(item);
      const desc = (item.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
      const title = (item.title || "Untitled").replace(/&amp;/g,"&").replace(/&#\d+;/g,"").replace(/&[a-z]+;/g," ");
      const link = item.link || "#";
      const source = item.source || "";
      const imgHtml = item.image
        ? `<tr><td style="padding:0;"><img src="${item.image}" alt="" width="464" style="display:block;width:100%;max-width:464px;border-radius:4px 4px 0 0;max-height:180px;object-fit:cover;" /></td></tr>`
        : "";
      return `
        <tr>
          <td style="padding:0 0 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1a1a1a;border-radius:4px;overflow:hidden;border:1px solid #2a2a2a;">
              ${imgHtml}
              <tr><td style="padding:16px 18px 6px;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td><span style="display:inline-block;background:${tag.bg};color:${tag.color};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:2px;">${tag.label}</span>
                  <span style="display:inline-block;font-size:10px;color:#666;margin-left:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${source}</span></td>
                  <td align="right" style="font-size:10px;color:#555;">#${i + 1}</td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:8px 18px 0;"><a href="${link}" style="font-size:16px;font-weight:800;color:#fff;text-decoration:none;line-height:1.35;display:block;letter-spacing:0.01em;">${title}</a></td></tr>
              ${desc ? `<tr><td style="padding:8px 18px 0;"><p style="margin:0;font-size:13px;color:#999;line-height:1.6;">${desc}</p></td></tr>` : ""}
              <tr><td style="padding:12px 18px 16px;"><a href="${link}" style="display:inline-block;background:#cc2a2a;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:8px 18px;text-decoration:none;border-radius:2px;">Read Story &rarr;</a></td></tr>
            </table>
          </td>
        </tr>`;
    }).join("");
    const html = emailWrapper(`
      ${emailHeader("Daily Intel Briefing — " + dateStr)}
      <tr><td style="padding:20px 28px 8px;"><p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">Top stories curated for the DinoBane intelligence feed. UK corruption, immigration, media censorship, geopolitics, and suppressed news — the stories they don't want you to see.</p></td></tr>
      <tr><td style="padding:8px 28px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0">${storyCards}</table></td></tr>
      <tr><td style="padding:4px 28px 24px;"><a href="https://dinobane.com/#/news" style="display:inline-block;background:#111;border:1px solid #333;color:#aaa;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:10px 20px;text-decoration:none;border-radius:2px;">View Full Feed at dinobane.com &rarr;</a></td></tr>
      ${emailFooter("&copy; 2026 DinoBane &mdash; <a href=\"https://dinobane.com\" style=\"color:#555;text-decoration:none;\">dinobane.com</a> &mdash; This briefing was manually sent by an admin.")}
    `);
    await resend.emails.send({
      from: "DinoBane <noreply@dinobane.com>",
      to,
      subject: `🔴 DinoBane Intel — Daily Briefing ${dateStr}`,
      html,
      attachments: logoAttachment(),
    });
    console.log(`[intel-briefing] sent to ${to}`);
  }

  app.get("/api/intel/feed", async (req, res) => {
    try {
      let data: any[];
      // Serve from cache if still fresh
      if (intelCache && (Date.now() - intelCache.fetchedAt) < INTEL_CACHE_TTL) {
        res.setHeader("X-Cache", "HIT");
        data = intelCache.data;
      } else if (intelCache) {
        // Cache stale — return stale immediately and refresh in background
        res.setHeader("X-Cache", "STALE");
        refreshIntelCache().catch(() => {});
        data = intelCache.data;
      } else {
        // No cache — must wait
        res.setHeader("X-Cache", "MISS");
        data = await refreshIntelCache();
      }
      // Strip admin-blocked stories before serving
      const blocked = await getBlockedLinks();
      if (blocked.length > 0) {
        const blockedSet = new Set(blocked);
        data = data.filter((item: any) => !blockedSet.has(item.link));
      }
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Pre-warm cache 15s after startup so the first visitor never waits
  setTimeout(() => refreshIntelCache().catch(() => {}), 15_000);
  // Refresh every 5 minutes in the background
  setInterval(() => refreshIntelCache().catch(() => {}), INTEL_CACHE_TTL);

  // ─── YOUTUBE FEED PROXY ───────────────────────────────────────────────────────
  // YouTube feed cache — 10 min TTL (yt-dlp is slow, no need to run it on every request)
  let youtubeCache: { data: any[]; fetchedAt: number } | null = null;
  const YOUTUBE_CACHE_TTL = 10 * 60 * 1000;
  let youtubeFetchInProgress = false;
  async function getYoutubeCached(): Promise<any[]> {
    if (youtubeCache && (Date.now() - youtubeCache.fetchedAt) < YOUTUBE_CACHE_TTL) return youtubeCache.data;
    if (youtubeFetchInProgress) return youtubeCache?.data ?? getFallbackVideos();
    youtubeFetchInProgress = true;
    try {
      const videos = await fetchYouTubeVideos(15);
      youtubeCache = { data: videos, fetchedAt: Date.now() };
      return videos;
    } finally {
      youtubeFetchInProgress = false;
    }
  }

  app.get("/api/youtube/feed", async (req, res) => {
    if (youtubeCache && (Date.now() - youtubeCache.fetchedAt) < YOUTUBE_CACHE_TTL) {
      res.setHeader("X-Cache", "HIT");
      return res.json(youtubeCache.data);
    }
    if (youtubeCache) {
      // Stale — return immediately, refresh in background
      res.setHeader("X-Cache", "STALE");
      getYoutubeCached().catch(() => {});
      return res.json(youtubeCache.data);
    }
    res.setHeader("X-Cache", "MISS");
    return res.json(await getYoutubeCached());
  });

  // Pre-warm YouTube cache 20s after startup
  setTimeout(() => getYoutubeCached().catch(() => {}), 20_000);
  // Refresh every 10 minutes in the background
  setInterval(() => getYoutubeCached().catch(() => {}), YOUTUBE_CACHE_TTL);

  // ─── RSS POLL — auto-generate articles for new videos ────────────────────────
  app.post("/api/youtube/sync", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
    try {
      const videos = await getYoutubeCached();
      const articles = await storage.getArticles();
      const existingVideoIds = new Set(articles.map((a: any) => a.videoId).filter(Boolean));
      const newVideos = videos.filter((v: any) => !existingVideoIds.has(v.id));
      const created: any[] = [];
      for (const v of newVideos) {
        const content2 = await generateArticleAI(v.title, `https://www.youtube.com/watch?v=${v.id}`);
        const article = await storage.createArticle({
          title: v.title,
          content: content2,
          summary: `Written analysis of "${v.title}" — key arguments and context from the latest DinoBane video.`,
          youtubeUrl: `https://www.youtube.com/watch?v=${v.id}`,
          videoId: v.id,
          thumbnail: v.thumbnail,
          isPublic: true,
        });
        invalidateArticlesCache();
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
      const videos = await getYoutubeCached();
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
          invalidateArticlesCache();
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
  // testMode: if true, send only to testEmail (skips the "no new videos" guard)

  async function sendWeeklyNewsletter(testMode = false, testEmail?: string) {
    if (!resend) return;
    try {
      // Fetch the YouTube RSS feed for the latest videos
      const allVideos = await fetchYouTubeVideos(15);
      // Filter to videos published in the last 7 days
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const thisWeek = allVideos.filter(v => {
        const t = v.publishedAt ? new Date(v.publishedAt).getTime() : 0;
        return t >= oneWeekAgo;
      }).slice(0, 5);

      // In test mode, use at least the 3 most recent videos if none are "this week"
      const videosToShow = (testMode && thisWeek.length === 0) ? allVideos.slice(0, 3) : thisWeek;

      // If no new videos this week, skip sending (production only)
      if (!testMode && thisWeek.length === 0) {
        console.log("[newsletter] no new videos this week — skipping");
        return;
      }

      // Get all paying members
      const allUsers = await storage.getAllUsers();
      const members = allUsers.filter(u => u.isMember && u.email);
      // In test mode override recipients to just the test email
      const recipients = testMode && testEmail ? [{ email: testEmail }] : members;
      if (recipients.length === 0) { console.log("[newsletter] no recipients"); return; }

      // Build the video cards HTML — use direct YouTube thumbnail URLs
      // (kept out of email MIME body to stay under Gmail's 102KB clip threshold)
      const videoCards = videosToShow.map((v, i) => `
        <tr>
          <td style="padding:0 0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:0;">
                  <a href="${v.url}" style="display:block;">
                    <img src="${v.thumbnail || ''}" alt="${v.title.replace(/"/g, '&quot;')}" width="100%" style="display:block;border-radius:8px 8px 0 0;max-width:100%;" />
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:11px;color:#cc2a2a;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Video ${i + 1} of ${videosToShow.length}</p>
                  <a href="${v.url}" style="font-size:16px;font-weight:700;color:#fff;text-decoration:none;line-height:1.4;display:block;margin-bottom:12px;">${v.title}</a>
                  <a href="${v.url}" style="display:inline-block;background:#cc2a2a;color:#fff;text-decoration:none;padding:8px 20px;border-radius:5px;font-size:13px;font-weight:700;">Watch Now →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join("");

      // Load hero image (logo is handled by shared logoAttachment() helper)
      const fsp = require('fs');
      const pathMod = require('path');
      const heroBuffer = (() => { try { return fsp.readFileSync(pathMod.join(process.cwd(), 'client/public/brand/email-hero.jpg')); } catch { return null; } })();

      const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header with logo -->
        <tr>
          <td style="background:#cc2a2a;padding:20px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;width:56px;">
                  <img src="cid:logo" alt="DinoBane Logo" width="56" height="56" style="display:block;border-radius:6px;" />
                </td>
                <td style="vertical-align:middle;padding-left:14px;">
                  <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:0.08em;display:block;line-height:1.1;">DINOBANE</span>
                  <span style="font-size:12px;color:rgba(255,255,255,0.75);display:block;margin-top:3px;letter-spacing:0.04em;">Weekly Dispatch — ${today}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Hero image -->
        <tr>
          <td style="padding:0;line-height:0;">
            <img src="cid:hero" alt="DinoBane" width="560" style="display:block;width:100%;max-width:560px;" />
          </td>
        </tr>
        <!-- Thank you message -->
        <tr>
          <td style="padding:28px 32px 8px;">
            <p style="margin:0 0 12px;font-size:17px;font-weight:700;color:#fff;">This week on DinoBane</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#bbb;">${testMode ? "[TEST EMAIL] " : ""}Thank you for your continued support — it genuinely means everything. Here are the ${videosToShow.length} video${videosToShow.length > 1 ? "s" : ""} I uploaded this week. Watch, share, and keep exposing the truth.</p>
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
            <p style="margin:0;font-size:12px;color:#555;">You're receiving this weekly digest because you're a DinoBane member. <a href="https://dinobane.com/#/profile" style="color:#cc2a2a;">Manage your membership</a></p>
            <p style="margin:6px 0 0;font-size:12px;"><a href="https://dinobane.com" style="color:#cc2a2a;">dinobane.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      // CID attachments — logo (shared helper) + hero; thumbnails use direct URLs to stay under 102KB
      const attachments: any[] = [...logoAttachment()];
      if (heroBuffer) attachments.push({ content: heroBuffer, filename: 'hero.jpg', contentType: 'image/jpeg', contentId: 'hero' });

      // Send to all recipients
      let sent = 0;
      for (const member of recipients) {
        try {
          await resend.emails.send({
            from: "DinoBane <noreply@dinobane.com>",
            to: member.email,
            subject: `${testMode ? "[TEST] " : ""}📺 DinoBane Weekly — ${videosToShow.length} new video${videosToShow.length > 1 ? "s" : ""} this week`,
            html,
            attachments,
          });
          sent++;
        } catch (e: any) {
          console.error(`[newsletter] failed to send to ${member.email}:`, e.message);
        }
      }
      console.log(`[newsletter] sent to ${sent}/${recipients.length} ${testMode ? "test recipients" : "members"}`);
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

  // Track online users: userId → Set of WebSocket connections
  const onlineUsers = new Map<number, Set<WebSocket>>();

  function broadcastPresence() {
    const ids = [...onlineUsers.keys()];
    broadcast({ type: "presence", onlineUserIds: ids });
  }

  wss.on("connection", (ws, req) => {
    ws.on("error", () => {});
    let userId: number | null = null;

    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        // Client sends { type: "auth", userId } on connect to register presence
        if (msg.type === "auth" && typeof msg.userId === "number") {
          userId = msg.userId;
          if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
          onlineUsers.get(userId)!.add(ws);
          broadcastPresence();
        }
      } catch {}
    });

    ws.on("close", () => {
      if (userId !== null) {
        const conns = onlineUsers.get(userId);
        if (conns) {
          conns.delete(ws);
          if (conns.size === 0) onlineUsers.delete(userId);
        }
        broadcastPresence();
      }
    });

    // Send current online list to new connection
    ws.send(JSON.stringify({ type: "presence", onlineUserIds: [...onlineUsers.keys()] }));
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// ─── ENSURE YT-DLP IS AVAILABLE (self-healing install at runtime) ───────────
let ytDlpEnsured = false;
async function ensureYtDlp(): Promise<void> {
  if (ytDlpEnsured) return;
  try {
    await execAsync("yt-dlp --version", { timeout: 5_000 });
    ytDlpEnsured = true;
    return; // already installed
  } catch {}
  // Not found — try pip install (works on Railway Nixpacks with python3)
  try {
    console.log("[youtube] yt-dlp not found, installing via pip...");
    await execAsync("pip install -U yt-dlp --quiet", { timeout: 60_000 });
    ytDlpEnsured = true;
    console.log("[youtube] yt-dlp installed successfully");
  } catch (e: any) {
    console.warn(`[youtube] pip install yt-dlp failed: ${e.message?.slice(0, 100)}`);
  }
}

// ─── YOUTUBE VIDEO FETCHER (yt-dlp primary, RSS fallback) ────────────────────
async function fetchYouTubeVideos(limit = 15): Promise<any[]> {
  const channelUrl = "https://www.youtube.com/@Dinobane-Clips/videos";

  // Ensure yt-dlp is installed (self-heals if nixpacks build didn't include it)
  await ensureYtDlp();

  // Helper: parse yt-dlp JSON output into video array
  function parseYtDlpOutput(stdout: string, methodName: string): any[] | null {
    try {
      const data = JSON.parse(stdout.trim());
      const entries = (data.entries || []) as any[];
      if (entries.length > 0) {
        console.log(`[youtube] fetched ${entries.length} videos via ${methodName}`);
        return entries.map((e: any, i: number) => ({
          id: e.id,
          title: (e.title || "DinoBane Video").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
          description: (e.description || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
          thumbnail: `https://img.youtube.com/vi/${e.id}/mqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${e.id}`,
          publishedAt: e.timestamp ? new Date(e.timestamp * 1000).toISOString()
            : new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: e.view_count ?? null,
          duration: e.duration ?? null,
        }));
      }
    } catch {}
    return null;
  }

  // yt-dlp flags shared across all attempts
  const ytdlpFlags = `--flat-playlist --dump-single-json --playlist-items 1-${limit} --no-warnings --extractor-retries 3 --socket-timeout 20`;

  // 1a. Try yt-dlp via PATH (works locally + after nixpacks install)
  try {
    const { stdout } = await execAsync(`yt-dlp ${ytdlpFlags} "${channelUrl}"`, { timeout: 45_000 });
    const result = parseYtDlpOutput(stdout, "yt-dlp (PATH)");
    if (result) return result;
  } catch (e: any) {
    console.warn(`[youtube] yt-dlp (PATH) failed: ${e.message?.slice(0, 120)}`);
  }

  // 1b. Try python3 -m yt_dlp (pip install fallback path)
  try {
    const { stdout } = await execAsync(`python3 -m yt_dlp ${ytdlpFlags} "${channelUrl}"`, { timeout: 45_000 });
    const result = parseYtDlpOutput(stdout, "yt-dlp (python3 -m)");
    if (result) return result;
  } catch (e: any) {
    console.warn(`[youtube] yt-dlp (python3 -m) failed: ${e.message?.slice(0, 120)}`);
  }

  // 1c. Try absolute path /usr/local/bin/yt-dlp
  try {
    const { stdout } = await execAsync(`/usr/local/bin/yt-dlp ${ytdlpFlags} "${channelUrl}"`, { timeout: 45_000 });
    const result = parseYtDlpOutput(stdout, "yt-dlp (/usr/local/bin)");
    if (result) return result;
  } catch (e: any) {
    console.warn(`[youtube] yt-dlp (/usr/local/bin) failed: ${e.message?.slice(0, 120)}`);
  }

  // 2. Try YouTube RSS feed directly
  try {
    const channelId = "UCEJTJU2HaQfSfKbxJcPlh7Q";
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const r = await fetch(rssUrl, { signal: AbortSignal.timeout(10_000), headers: { "User-Agent": "Mozilla/5.0" } });
    if (r.ok) {
      const xml = await r.text();
      if (xml.includes("<feed")) {
        const videos = parseYouTubeFeed(xml);
        if (videos.length > 0) {
          console.log(`[youtube] fetched ${videos.length} videos via RSS`);
          return videos;
        }
      }
    }
  } catch {}

  // 3. Static fallback (updated 2026-03-18 — newest videos first)
  console.warn("[youtube] all fetch methods failed — using static fallback");
  return getFallbackVideos();
}

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

      const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
      const description = descMatch ? descMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() : "";

      if (videoId) {
        entries.push({
          id: videoId,
          title: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
          description,
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
  // Static fallback — updated 2026-03-18 from yt-dlp. Used only if all live fetch methods fail.
  return [
    { id: "7pgalWg7Dzg", title: "This Is What Britain Could Actually Be", thumbnail: "https://img.youtube.com/vi/7pgalWg7Dzg/mqdefault.jpg", url: "https://www.youtube.com/watch?v=7pgalWg7Dzg", publishedAt: "2026-03-18T12:00:00+00:00" },
    { id: "nxKsD97dqAo", title: "This Is The Proof That Terrifies Them", thumbnail: "https://img.youtube.com/vi/nxKsD97dqAo/mqdefault.jpg", url: "https://www.youtube.com/watch?v=nxKsD97dqAo", publishedAt: "2026-03-17T12:00:00+00:00" },
    { id: "ZliV-hUKp2M", title: "They Are Getting Desperate", thumbnail: "https://img.youtube.com/vi/ZliV-hUKp2M/mqdefault.jpg", url: "https://www.youtube.com/watch?v=ZliV-hUKp2M", publishedAt: "2026-03-16T12:00:00+00:00" },
    { id: "Tyho3Qiq8eY", title: "Graham Moore - [ Unfiltered ]", thumbnail: "https://img.youtube.com/vi/Tyho3Qiq8eY/mqdefault.jpg", url: "https://www.youtube.com/watch?v=Tyho3Qiq8eY", publishedAt: "2026-03-13T20:19:50+00:00" },
    { id: "glP5aWLwd6s", title: "Inside The Mind of a Leftist", thumbnail: "https://img.youtube.com/vi/glP5aWLwd6s/mqdefault.jpg", url: "https://www.youtube.com/watch?v=glP5aWLwd6s", publishedAt: "2026-03-12T13:54:12+00:00" },
    { id: "Xfz1TaCRblA", title: "They Buried This Footage For a Reason", thumbnail: "https://img.youtube.com/vi/Xfz1TaCRblA/mqdefault.jpg", url: "https://www.youtube.com/watch?v=Xfz1TaCRblA", publishedAt: "2026-03-12T13:02:10+00:00" },
    { id: "gfZDulfXDQU", title: "We're Taking It Back", thumbnail: "https://img.youtube.com/vi/gfZDulfXDQU/mqdefault.jpg", url: "https://www.youtube.com/watch?v=gfZDulfXDQU", publishedAt: "2026-03-11T12:23:38+00:00" },
    { id: "Z1Ok0954i-8", title: "[ WARNING! ] This Video Will Make You a Patriot", thumbnail: "https://img.youtube.com/vi/Z1Ok0954i-8/mqdefault.jpg", url: "https://www.youtube.com/watch?v=Z1Ok0954i-8", publishedAt: "2026-03-11T07:11:48+00:00" },
    { id: "QFFO3EyGKUo", title: "Ben Habib Is Cooked", thumbnail: "https://img.youtube.com/vi/QFFO3EyGKUo/mqdefault.jpg", url: "https://www.youtube.com/watch?v=QFFO3EyGKUo", publishedAt: "2026-03-10T19:58:30+00:00" },
    { id: "DFaVsor8JeI", title: "The 'DEBATE' Is Over", thumbnail: "https://img.youtube.com/vi/DFaVsor8JeI/mqdefault.jpg", url: "https://www.youtube.com/watch?v=DFaVsor8JeI", publishedAt: "2026-03-10T16:53:13+00:00" },
    { id: "fxEwgChVQEs", title: "The BATTLE LINES Have Been Drawn", thumbnail: "https://img.youtube.com/vi/fxEwgChVQEs/mqdefault.jpg", url: "https://www.youtube.com/watch?v=fxEwgChVQEs", publishedAt: "2026-03-09T14:21:40+00:00" },
    { id: "8oVK_gK_aN8", title: "There Is No 'SPLIT' on The 'Right Wing'", thumbnail: "https://img.youtube.com/vi/8oVK_gK_aN8/mqdefault.jpg", url: "https://www.youtube.com/watch?v=8oVK_gK_aN8", publishedAt: "2026-03-07T14:13:31+00:00" },
    { id: "4dCSN4G0G68", title: "Nothing About This Makes Sense. We Need To Unite", thumbnail: "https://img.youtube.com/vi/4dCSN4G0G68/mqdefault.jpg", url: "https://www.youtube.com/watch?v=4dCSN4G0G68", publishedAt: "2026-03-05T14:56:36+00:00" },
    { id: "8qvL5O3faWg", title: "These Channels Are DANGEROUS", thumbnail: "https://img.youtube.com/vi/8qvL5O3faWg/mqdefault.jpg", url: "https://www.youtube.com/watch?v=8qvL5O3faWg", publishedAt: "2026-03-05T12:09:24+00:00" },
    { id: "28BGa1gqlXk", title: "This Is Why They DEMONISE The Working Class", thumbnail: "https://img.youtube.com/vi/28BGa1gqlXk/mqdefault.jpg", url: "https://www.youtube.com/watch?v=28BGa1gqlXk", publishedAt: "2026-03-04T12:00:00+00:00" },
  ];
}

// ─── AI ARTICLE GENERATION (OpenRouter) ───────────────────────────────────────
async function fetchVideoTranscript(videoUrl: string): Promise<string | null> {
  const tmpBase = `/tmp/transcript_${Date.now()}`;
  try {
    // Try auto-generated English captions first, then manual captions
    await execAsync(
      `yt-dlp --write-auto-sub --write-sub --sub-lang en --sub-format vtt --skip-download --no-playlist -o "${tmpBase}" "${videoUrl}"`,
      { timeout: 40_000 }
    );
    // Find the downloaded vtt file
    const { stdout: found } = await execAsync(`ls "${tmpBase}"*.vtt 2>/dev/null || echo ''`);
    const vttFile = found.trim().split('\n')[0];
    if (!vttFile) return null;

    const { readFileSync, unlinkSync } = await import('fs');
    const raw = readFileSync(vttFile, 'utf8');
    // Clean up temp file
    try { unlinkSync(vttFile); } catch {}

    // Parse VTT: strip headers, timestamps, tags, deduplicate lines
    const lines = raw.split('\n');
    const textLines: string[] = [];
    for (const line of lines) {
      const l = line.trim();
      if (!l) continue;
      if (l.startsWith('WEBVTT') || l.startsWith('Kind:') || l.startsWith('Language:')) continue;
      if (/^\d{2}:\d{2}/.test(l)) continue; // timestamp
      const clean = l.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      if (clean) textLines.push(clean);
    }
    // Deduplicate consecutive identical lines (VTT repeats lines as they scroll)
    const deduped: string[] = [];
    let prev = '';
    for (const l of textLines) {
      if (l !== prev) { deduped.push(l); prev = l; }
    }
    const transcript = deduped.join(' ').replace(/\s+/g, ' ').trim();
    return transcript.length > 100 ? transcript : null;
  } catch (e: any) {
    console.warn(`[articles] transcript fetch failed for ${videoUrl}: ${e.message?.slice(0, 100)}`);
    return null;
  }
}

async function generateArticleAI(title: string, url: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("[articles] OPENROUTER_API_KEY not set — skipping AI generation");
  } else {
    // Fetch the real transcript so the AI writes about the actual video content
    console.log(`[articles] Fetching transcript for: ${title}`);
    const transcript = await fetchVideoTranscript(url);
    const transcriptSection = transcript
      ? `\n\nHere is the full transcript of the video (use this as the basis for your article — write about what is actually said):\n\n"""\n${transcript.slice(0, 6000)}\n"""`
      : `\n\n(No transcript available — write based on the video title and your knowledge of UK political issues.)`;

    const prompt = `You are writing a political commentary article for DinoBane, a UK YouTube channel covering corruption, immigration, media censorship, and stories the mainstream media buries. The tone is direct, no-nonsense, pro-English, and right-leaning — like a sharp op-ed from the Spectator or Telegraph.

Video title: "${title}"
Video URL: ${url}${transcriptSection}

Requirements:
- Write a 450-500 word newspaper-style article based SPECIFICALLY on what the video covers
- Strong opinionated opening paragraph that states the argument clearly
- 3-4 substantive body paragraphs that directly reference what was said or shown in the video
- Punchy closing paragraph calling the reader to action
- Pro-English, right-leaning, specific and pointed arguments throughout

Return ONLY the article HTML using <p> tags. No title tag, no bullet points, no markdown headers, no preamble.`;

    // Model fallback chain — try in order until one succeeds
    const MODELS = [
      "google/gemini-2.0-flash-001",
      "meta-llama/llama-3.3-70b-instruct:free",
      "google/gemma-3-27b-it:free",
    ];

    for (const model of MODELS) {
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dinobane.com",
            "X-Title": "DinoBane Platform",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 900,
          }),
          signal: AbortSignal.timeout(35000),
        });
        if (!r.ok) {
          const errBody = await r.text();
          console.warn(`[articles] OpenRouter model ${model} failed: HTTP ${r.status} — ${errBody.slice(0, 200)}`);
          continue;
        }
        const data = await r.json() as any;
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content && content.length > 200) {
          console.log(`[articles] Generated with model ${model} (${content.length} chars)`);
          return content;
        }
        console.warn(`[articles] Model ${model} returned short/null content`);
      } catch (e: any) {
        console.warn(`[articles] OpenRouter model ${model} threw: ${e.message}`);
      }
    }
    console.error("[articles] All OpenRouter models failed — falling back to stub");
  }
  // Fallback stub — only reached if no API key or all models fail
  return `<p>This is a written analysis of the DinoBane video: <strong>${title}</strong>.</p><p>The video covers a topic that the mainstream media consistently ignores or misrepresents. DinoBane breaks it down with the context that establishment outlets refuse to provide.</p><p>Watch the full video here: <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>`;
}

// ─── NEWS / INTEL RSS FEED ────────────────────────────────────────────────────
// This is appended at module level — registered via registerRoutes call above
