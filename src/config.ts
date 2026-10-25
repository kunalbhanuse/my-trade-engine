import "dotenv/config";
import { z } from "zod";

// Rules for every setting the app needs
const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Check process.env against the rules (throws if something is wrong)
export const config = envSchema.parse(process.env);
