import pg from "pg";
import { env } from "../config/env.js";

/** Supabase exige TLS; o certificado do pooler não é validável pela cadeia padrão. */
export function createPoolConfig(max = 10): pg.PoolConfig {
  const url = new URL(env.DATABASE_URL);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  return {
    connectionString: env.DATABASE_URL.replace(/[?&]sslmode=[^&]*/g, ""),
    max,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  };
}

export function createPool(max = 10): pg.Pool {
  return new pg.Pool(createPoolConfig(max));
}
