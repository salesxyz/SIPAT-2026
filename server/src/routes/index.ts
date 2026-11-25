import { Router } from "express";
import * as albums from "../controllers/albums.js";
import * as auth from "../controllers/auth.js";
import { dashboard } from "../controllers/dashboard.js";
import * as events from "../controllers/events.js";
import { serveFile } from "../controllers/files.js";
import * as photos from "../controllers/photos.js";
import * as pub from "../controllers/public.js";
import * as settings from "../controllers/settings.js";
import { requireAdmin } from "../middlewares/auth.js";
import { loginLimiter, uploadLimiter } from "../middlewares/rateLimit.js";
import { photoUpload } from "../middlewares/upload.js";
import { asyncHandler as h } from "../lib/errors.js";

export const api = Router();

api.get("/health", (_req, res) => res.json({ ok: true }));

// ---- Público (sem login) ----
api.get("/settings", h(settings.publicSettings));
api.get("/public/events", h(pub.listPublicEvents));
api.get("/public/events/:token", h(pub.loadEvent), h(pub.eventInfo));
api.get("/public/events/:token/photos", h(pub.loadEvent), h(pub.listEventPhotos));
api.get("/public/events/:token/photos/:photoId/download", h(pub.loadEvent), h(pub.downloadEventPhoto));
api.post("/public/events/:token/upload", uploadLimiter, pub.loadEvent, pub.requireActiveEvent, photoUpload, h(pub.uploadPhotos));
api.get("/files/:token", h(serveFile));

// ---- Autenticação ----
api.post("/auth/login", loginLimiter, h(auth.login));
api.post("/auth/logout", auth.logout);
api.get("/auth/me", requireAdmin, auth.me);
api.post("/auth/password", requireAdmin, h(auth.changePassword));

// ---- Admin ----
const admin = Router();
admin.use(requireAdmin);
admin.get("/dashboard", h(dashboard));
admin.get("/events", h(events.listEvents));
admin.post("/events", h(events.createEvent));
admin.get("/events/:id", h(events.getEvent));
admin.patch("/events/:id", h(events.updateEvent));
admin.delete("/events/:id", h(events.deleteEvent));
admin.post("/events/:id/regenerate-token", h(events.regenerateToken));
admin.get("/events/:id/qrcode.png", h(events.eventQr));
admin.get("/events/:id/albums", h(albums.listAlbums));
admin.post("/events/:id/albums", h(albums.createAlbum));
admin.patch("/albums/:id", h(albums.updateAlbum));
admin.delete("/albums/:id", h(albums.deleteAlbum));
admin.get("/albums/:id/zip", h(albums.albumZip));
admin.get("/photos", h(photos.listPhotos));
admin.post("/photos/bulk-delete", h(photos.bulkDelete));
admin.delete("/photos/:id", h(photos.deletePhoto));
admin.get("/photos/:id/download", h(photos.downloadPhoto));
admin.put("/settings", h(settings.updateSettings));
admin.post("/maintenance/retention", h(settings.runRetentionNow));
api.use("/admin", admin);
