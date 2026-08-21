import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { pool } from "./db";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const ONE_YEAR_SECONDS = 31536000;
  const ONE_HOUR_SECONDS = 3600;

  app.use(
    express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        const rel = filePath.slice(distPath.length).replaceAll(path.sep, "/");
        if (rel.startsWith("/assets/")) {
          // Vite fingerprints these filenames; safe to cache for a year.
          res.setHeader("Cache-Control", `public, max-age=${ONE_YEAR_SECONDS}, immutable`);
        } else {
          // Public brand/media files can change without a filename change.
          res.setHeader("Cache-Control", `public, max-age=${ONE_HOUR_SECONDS}`);
        }
      },
    }),
  );

  // The Rings Of Power map (static standalone page in client/public/rings-of-power)
  app.get("/rings-of-power", (_req, res) => res.redirect(301, "/rings-of-power/index.html"));
  app.get("/rings-of-power/", (_req, res) => res.redirect(301, "/rings-of-power/index.html"));

  // Redirect bare paths to hash-router equivalents
  app.get("/privacy", (_req, res) => res.redirect(301, "/app/#/privacy"));
  app.get("/terms", (_req, res) => res.redirect(301, "/app/#/privacy"));
  app.get("/contact", (_req, res) => res.redirect(301, "/app/#/contact"));
  app.get("/reset-password", (req, res) => {
    const token = req.query.token ? `?token=${req.query.token}` : '';
    return res.redirect(301, `/app/#/reset-password${token}`);
  });
  app.get("/login", (_req, res) => res.redirect(301, "/app/#/login"));
  app.get("/forgot-password", (_req, res) => res.redirect(301, "/app/#/forgot-password"));

  // Landing page gate: the landing page is only for new or signed-out visitors.
  // The session middleware only runs on /api/* paths, so check the session
  // cookie here directly. Members get the app; everyone else gets landing.html.
  app.get("/", async (req, res) => {
    try {
      const sid = req.cookies?.dinobane_sid;
      if (sid) {
        const row = await pool.query("SELECT user_id FROM sessions WHERE sid=$1", [sid]);
        if (row.rows[0]?.user_id) {
          res.setHeader("Cache-Control", "no-cache");
          return res.sendFile(path.resolve(distPath, "index.html"));
        }
      }
    } catch {
      // any error → fall through to the landing page
    }
    res.setHeader("Cache-Control", "no-cache");
    return res.sendFile(path.resolve(distPath, "landing.html"));
  });

  // The member app — always served, never gated. Deep links look like /app/app/#/news.
  app.get("/app", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    return res.sendFile(path.resolve(distPath, "index.html"));
  });

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
