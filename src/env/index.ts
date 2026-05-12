import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
  JWT_SECRET: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables");

  throw new Error("Invalid environment variables.");
}

export const env = _env.data;
