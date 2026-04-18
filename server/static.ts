import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Redirect bare paths to hash-router equivalents
  app.get("/privacy", (_req, res) => res.redirect(301, "/#/privacy"));
  app.get("/terms", (_req, res) => res.redirect(301, "/#/privacy"));
  app.get("/contact", (_req, res) => res.redirect(301, "/#/contact"));
  app.get("/reset-password", (req, res) => {
    const token = req.query.token ? `?token=${req.query.token}` : '';
    return res.redirect(301, `/#/reset-password${token}`);
  });
  app.get("/login", (_req, res) => res.redirect(301, "/#/login"));
  app.get("/forgot-password", (_req, res) => res.redirect(301, "/#/forgot-password"));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
