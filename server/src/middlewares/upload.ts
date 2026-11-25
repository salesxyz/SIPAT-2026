import multer from "multer";
import { env } from "../config/env.js";

export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: env.MAX_FILES_PER_REQUEST, fields: 5 },
  fileFilter: (_req, file, cb) => {
    // Filtro rápido; a validação real do conteúdo é feita com sharp em services/images.ts
    cb(null, /^image\//.test(file.mimetype));
  },
}).array("photos", env.MAX_FILES_PER_REQUEST);
