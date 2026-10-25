import "dotenv/config";
import { z } from "zod";

// Rules for every setting the app needs
const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SHARK_API_KEY: z.string().min(1),
  SHARK_API_SECRET: z.string().min(1),
});

// Check process.env against the rules (throws if something is wrong)
export const config = envSchema.parse(process.env);
