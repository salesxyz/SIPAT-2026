import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { apiNotFound, errorHandler } from "./middlewares/error.js";
import { apiLimiter } from "./middlewares/rateLimit.js";
import { api } from "./routes/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // Render/Supabase ficam atrás de proxy: necessário para rate limit por IP real
  app.disable("x-powered-by");

  const imgSrc = ["'self'", "data:", "blob:"];
  if (env.SUPABASE_URL) imgSrc.push(new URL(env.SUPABASE_URL).origin);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc,
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          mediaSrc: ["'self'", "blob:"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  // helmet não define Permissions-Policy; a câmera precisa estar liberada para o próprio site
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
    next();
  });
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "100kb" }));

  app.use("/api", apiLimiter, api, apiNotFound);

  const dist = env.WEB_DIST ? path.resolve(env.WEB_DIST) : path.resolve(here, "../../web/dist");
  if (fs.existsSync(path.join(dist, "index.html"))) {
    app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y" }));
    app.use(express.static(dist, { maxAge: "1h", index: false }));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }

  app.use(errorHandler);
  return app;
}
