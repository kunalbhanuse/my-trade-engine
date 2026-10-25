import { describe, it, expect } from "vitest";

import request from "supertest";
import app from "../src/app.js";

describe("GET /health", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
  });
});

describe("unknown route", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/boo");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not Found" });
  });
});
