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

  // ─── INTEL / NEWS RSS FEED ──────────────────────────────────────────────────
  app.get("/api/intel/feed", async (req, res) => {
    const FEEDS = [
      { name: "Guido Fawkes",     url: "https://order-order.com/feed/" },
      { name: "Spiked Online",    url: "https://www.spiked-online.com/feed/" },
      { name: "GB News",          url: "https://www.gbnews.com/feed" },
      { name: "The Spectator",    url: "https://www.spectator.co.uk/feed/" },
      { name: "ZeroHedge",        url: "https://feeds.feedburner.com/zerohedge/feed" },
      { name: "Breitbart London", url: "https://www.breitbart.com/london/feed/" },
      { name: "Daily Mail",       url: "https://www.dailymail.co.uk/articles.rss" },
      { name: "The Telegraph",    url: "https://www.telegraph.co.uk/rss.xml" },
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
