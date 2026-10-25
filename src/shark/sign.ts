import { createHmac } from "node:crypto";

export function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}
