import { env } from "../config/env.js";
import { LocalStorage } from "./local.js";
import { SupabaseStorage } from "./supabase.js";
import type { StorageDriver } from "./types.js";

export const storage: StorageDriver = env.STORAGE_DRIVER === "local" ? new LocalStorage() : new SupabaseStorage();
export type { StorageDriver };
