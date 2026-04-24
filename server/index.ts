import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { runMigrationsAndSeed } from "./storage";
import { pool } from "./db";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Global JSON/urlencoded body limit. Vault media uploads go via the Cloudflare
// Worker directly to R2 (no JSON body), but community chat embeds small
// attachments as base64 dataURLs inside /api/messages JSON. Base64 adds ~37%
// overhead on top of the client-side 2 MB image cap — 8 MB gives comfortable
// headroom without reintroducing the original 100 MB exposure. The Stripe
// webhook registers its own raw-body parser in routes.ts before this
// middleware runs.
app.use(
  express.json({
    limit: "8mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: "8mb" }));
app.use(cookieParser());

// ─── SECURITY HEADERS (defence in depth; TLS is handled by Cloudflare) ───────
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// ─── DB-BACKED PERSISTENT SESSIONS ───────────────────────────────────────────
// Sessions survive server restarts — cookie lives 30 days, data stored in PG.
function genSid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

async function ensureSessionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid  TEXT PRIMARY KEY,
      user_id INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  // Purge sessions older than 30 days
  await pool.query(`DELETE FROM sessions WHERE last_seen < now() - interval '30 days'`);
}

// In-memory write-through cache — avoids a DB hit on every request
const sessionCache = new Map<string, { userId?: number }>();

app.use(async (req: any, res: any, next: any) => {
  // Static assets and non-API paths don't need a DB-backed session — skip the
  // session check entirely for those. Saves a DB round trip per asset.
  if (!req.path.startsWith("/api")) return next();

  const COOKIE_MAX_AGE = 30 * 24 * 3600; // 30 days
  let sid = req.cookies?.dinobane_sid;

  // Validate or create session
  if (!sid || (!sessionCache.has(sid) && !(await pool.query("SELECT sid FROM sessions WHERE sid=$1", [sid])).rows.length)) {
    sid = genSid();
    sessionCache.set(sid, {});
    await pool.query("INSERT INTO sessions (sid) VALUES ($1) ON CONFLICT (sid) DO NOTHING", [sid]);
    res.setHeader("Set-Cookie", `dinobane_sid=${sid}; Path=/; HttpOnly; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`);
  }

  // Warm cache from DB if cold start
  if (!sessionCache.has(sid)) {
    const row = await pool.query("SELECT user_id FROM sessions WHERE sid=$1", [sid]);
    sessionCache.set(sid, { userId: row.rows[0]?.user_id ?? undefined });
  }

  const store = sessionCache.get(sid)!;

  req.session = {
    get userId() { return store.userId; },
    set userId(v: number | undefined) {
      store.userId = v;
      // Fire-and-forget DB write
      pool.query("UPDATE sessions SET user_id=$1, last_seen=now() WHERE sid=$2", [v ?? null, sid]).catch(() => {});
    },
    save(cb?: (err?: any) => void) {
      // Session is written synchronously on userId set — save() is a no-op for compatibility
      if (cb) cb();
    },
    destroy(cb: () => void) {
      sessionCache.delete(sid);
      pool.query("DELETE FROM sessions WHERE sid=$1", [sid]).catch(() => {});
      if (cb) cb();
    },
  };
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      // Only include the response body for 5xx errors, and truncate to 200
      // chars. Full bodies were being written to stdout on every request,
      // which meant session/password-reset tokens were ending up in log
      // storage.
      if (res.statusCode >= 500 && capturedJsonResponse) {
        const snippet = JSON.stringify(capturedJsonResponse).slice(0, 200);
        logLine += ` :: ${snippet}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Run DB migrations and seed on every startup
  try {
    await runMigrationsAndSeed();
    await ensureSessionsTable();
  } catch (err: any) {
    console.error("[db] Migration/seed failed — server will still start:", err.message);
  }

  await registerRoutes(httpServer, app);

  // ── AUTO-PURGE: delete non-member accounts older than 24h, runs every 6 hours ──
  async function purgeStaleAccounts() {
    try {
      const { storage } = await import("./storage");
      const users = await storage.getAllUsers();
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const stale = users.filter(u => !u.isMember && new Date(u.createdAt).getTime() < cutoff);
      for (const u of stale) {
        await storage.deleteUser(u.id);
        console.log(`[auto-purge] removed stale non-member: ${u.email} (userId ${u.id})`);
      }
      if (stale.length > 0) console.log(`[auto-purge] removed ${stale.length} stale account(s)`);
    } catch (e: any) {
      console.error("[auto-purge] failed:", e.message);
    }
  }
  // Run once on startup, then every 6 hours
  purgeStaleAccounts();
  setInterval(purgeStaleAccounts, 6 * 60 * 60 * 1000);
  // ── END AUTO-PURGE ─────────────────────────────────────────────────────────────────────

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
