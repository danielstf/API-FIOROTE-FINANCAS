import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
  JWT_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  RESEND_FROM_EMAIL: z.string().email(),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  APP_URL: z.string().url().default("http://localhost:3333"),
  MERCADO_PAGO_ACCESS_TOKEN: z.string(),
  MERCADO_PAGO_WEBHOOK_SECRET: z.string().optional().default(""),
  PREMIUM_PRICE: z.coerce.number().positive().default(19.9),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables");

  throw new Error("Invalid environment variables.");
}

export const env = _env.data;
