import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.js";
import { createPoolConfig } from "./db.js";

export const prisma = new PrismaClient({ adapter: new PrismaPg(createPoolConfig()) });
