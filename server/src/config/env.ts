import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  PUBLIC_URL: z.string().optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET precisa ter ao menos 16 caracteres"),
  ADMIN_NAME: z.string().default("Administrador"),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  STORAGE_DRIVER: z.enum(["supabase", "local"]).default("supabase"),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().default("sipat-photos"),
  LOCAL_STORAGE_DIR: z.string().default("./storage-data"),
  MAX_UPLOAD_MB: z.coerce.number().default(15),
  MAX_FILES_PER_REQUEST: z.coerce.number().default(10),
  WEB_DIST: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const msg = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Variáveis de ambiente inválidas:\n${msg}`);
}

export const env = parsed.data;

if (env.STORAGE_DRIVER === "supabase" && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error("STORAGE_DRIVER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
}
if (env.NODE_ENV === "production" && /troque|changeme/i.test(env.JWT_SECRET)) {
  throw new Error("Defina um JWT_SECRET real em produção");
}
