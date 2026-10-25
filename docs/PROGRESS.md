# My Trade Engine: Progress

Goal: an **automated trade journal** for my Shark Exchange trades.
It reads my trades from Shark, stores them, and shows notes, tags and stats.
It never places orders.

Last updated: 25 Oct 2026

---

## Project structure

```
my-trade-engine/
  .github/workflows/ci.yml   → CI on GitHub
  docs/PROGRESS.md           → this file
  scripts/wallet.ts          → test script: signed call to Shark
  src/
    app.ts                   → Express app (routes + middleware)
    server.ts                → starts the server (app.listen)
    config.ts                → reads and checks settings (.env)
    middleware/error.ts      → 404 + error handler
    shark/sign.ts            → HMAC-SHA256 sign function
  tests/app.test.ts          → tests for /health and 404
  .env                       → real settings and secrets (NOT in git)
  .env.example               → list of settings with fake values (in git)
```

---

## Phase 0: Foundations ✅

### 1. Scripts
- `npm run dev`: runs the app while coding (tsx, restarts when you save).
- `npm run typecheck`: checks for type errors (`tsc --noEmit`).
- `npm run build`: turns TypeScript into JavaScript in `dist/`.
- `npm start`: runs the built app (`node dist/server.js`), the production way.
- `npm test`: runs all tests (Vitest).

**Learned**
- `tsx` runs code even when it has type errors, so always run `typecheck`.
- In production: build first, then run the built code.

### 2. Config with zod (`src/config.ts`)
- All settings are read and checked in one place.
- If a setting is wrong or missing, the app stops at startup with a clear error.
- Settings:
  - `PORT`: number, default `8080`
  - `NODE_ENV`: `development` | `production` | `test`, default `development`
  - `SHARK_API_KEY`: text, required, no default
  - `SHARK_API_SECRET`: text, required, no default

**Learned**
- Everything in `process.env` is **text**, so use `z.coerce.number()` for numbers.
- The schema is only the rules; `.parse(process.env)` applies them.
- zod matches by **key name** (`PORT` in schema = `PORT` in `.env`).
- `.env` is optional; `dotenv` copies it into `process.env`.
- Secrets get **no default**: the app must crash if they're missing.

### 3. Error handling (`src/middleware/error.ts`)
- `notFound`: unknown routes return `404 { error: "Not Found" }`.
- `errorHandler`: crashes return `500 { error: "Something went wrong" }`; the real error goes to the terminal only.

**Learned**
- Order matters: routes → `notFound` → `errorHandler` (always last).
- An error handler has **4 parameters**: `(err, req, res, next)`.
- Never show real error details to users.

### 4. App / server split
- `app.ts`: builds the app and exports it.
- `server.ts`: only starts it (`app.listen`).

**Learned**
- Tests can import `app` without starting a real server.

### 5. Tests (`tests/app.test.ts`)
- Tools: **Vitest** (test runner) + **supertest** (calls routes without a server).
- `GET /health` returns 200.
- An unknown route returns 404 with `{ error: "Not Found" }`.

**Learned**
- Shape: `describe` (group) → `it` (one test) → `expect` (check).
- `toBe` for simple values, `toEqual` for objects.
- Break a test on purpose to make sure it really checks something.
- `tsconfig` has `"include": ["src"]`, so tests and scripts are not built.
- Postman is for exploring by hand; tests check automatically, every time.

### 6. CI (`.github/workflows/ci.yml`)
- Runs on every push to `main` and on pull requests.
- Steps: `npm ci` → `typecheck` → `test` → `build`.
- Uses **fake** Shark keys (`env:` block), because tests never call the real exchange.

**Learned**
- New tests run in CI automatically (nothing to change).
- New kind of check = one more `- run:` line.
- Read CI logs: which file failed, which setting, which line.

### Skipped for now (will add later)
- ⏭️ Logging (pino): add with the sync job.
- ⏭️ Graceful shutdown: add with the database.

---

## Shark API: what I've done so far

### API key
- Created a **read-only** key (no trade permission).
- IP restriction turned on (my IPv4 + IPv6).
- Key and secret live **only** in `.env`.

**Learned**
- Never paste a secret anywhere (chat, screenshots, logs).
- If a secret leaks: **delete the key and make a new one**.

### Public API (no keys)
- Tried `ticker24Hr`, `depth`, `exchangeInfo` with curl.
- Valid pairs end in `INR` or `USDT` (e.g. `BTCINR`, `BTCUSDT`). `BTCUSD` is invalid.

### Signing (`src/shark/sign.ts`)
- `sign(data, secret)` → HMAC-SHA256 → hex text.
- Checked against `openssl`: same result.

**Learned**
- HMAC proves "it's me" without ever sending the secret.
- Changing even one character changes the signature.
- `timestamp` makes every signature different, so old requests can't be reused.
- Pure function: uses only its inputs, so it's easy to test and reuse.

### First signed call (`scripts/wallet.ts`)
- `GET /v1/wallet/futures-wallet/details?marginAsset=INR` → **200** ✅
- `GET /v1/wallet/funding-wallet/details?marginAsset=INR` → **200** ✅

**How a signed GET works**
```
1. query     = "marginAsset=INR&timestamp=1730..."   (URLSearchParams)
2. signature = sign(query, SHARK_API_SECRET)
3. url       = BASE_URL + path + "?" + query          (SAME query!)
4. fetch(url, headers: { api-key, signature })
5. data      = await res.json()
```

**Learned**
- The query you sign must be **exactly** the same as the one in the URL.
- GET has no body, so data goes in the URL query.
- `res` is the envelope; `await res.json()` reads the message.
- Status codes: **401** = auth problem, **400** = bad request, **500** = Shark's problem.

---

## Shark notes (things NOT in the docs)

- Error response shape: `{ "error": "<code>", "message": "...", "details": "..." }`
- `2003`: "Wallet not found" (e.g. asking for the USDT wallet when you only have INR).
- `2402`: "Invalid contract pair".
- `401` without keys: "Invalid or expired JWT".
- Rate limits from response headers:
  - `x-rate-limit-cap-10s: 10`: **10 requests per 10 seconds**
  - `x-rate-limit-cap-1m: 60`: 60 requests per minute
- Ticker and depth have extra fields not in the docs: `ps`, `st`.
- Prices come back as **text** (`"7736376"`), not numbers.

---

## Roadmap

Each step gives something you can **see**.

### Step 1: Shark client ⬅️ current
- `src/shark/client.ts`: `sharkGet(path, params)`, one function for all private calls.
- Throw a clear error when Shark says no (use Shark's `details`).
- ✅ Result: any Shark endpoint in 1 line.

### Step 2: See your real trades
- Fetch **closed positions** (`/v1/positions/CLOSED`).
- Fetch **trade history** (fills) and **transaction history** (fees, funding).
- Look at real data in a script and understand every field.
- ✅ Result: you know exactly what Shark gives you.

### Step 3: Database
- Postgres in Docker.
- Tables: `positions`, `fills`, `transactions`.
- Add graceful shutdown (skipped in Phase 0).
- ✅ Result: a place to store data.

### Step 4: Sync
- A sync job copies Shark data into the database.
- Running it twice must **not** create duplicates.
- Add logging (pino) (skipped in Phase 0).
- ✅ Result: all trades saved locally.

### Step 5: Journal trades (the core)
- Raw data → **one entry per trade**: symbol, side, entry, exit, size, fees, funding, **net P&L**, duration.
- **Tests** for the P&L math.
- ✅ Result: a correct list of your trades.

### Step 6: Journal notes
- Per trade: **notes**, **setup**, **tags**, **mistakes**, **rating**.
- ✅ Result: a real journal, not just numbers.

### Step 7: Stats
- Win rate, average win / loss, best / worst trade.
- P&L by symbol, by tag, by day of week.
- ✅ Result: insight into how you trade.

### Step 8: Automatic
- Sync every few minutes on a schedule.
- Later: Shark's private live stream, so a closed trade appears within seconds.
- ✅ Result: the journal fills itself.

### Step 9: Run it 24/7 (deploy)
- Move the app from the laptop to a small server (see below).
- ✅ Result: it runs even when the laptop is off.

### Step 10: UI
- A simple web page: trades, stats, add notes.

---

## Running 24/7: notes

**Problem**
- On the laptop, the app stops when the laptop sleeps or shuts down.

**Good news: the journal does NOT need to be on 100% of the time**
- Shark keeps the full trade history.
- If the app is off for a day, the next sync asks: "give me everything since my last saved trade".
- Nothing is lost; it just shows up a bit later.
- (Only live, within-seconds updates need the app to be on.)

**Options**
| Option | Cost | Notes |
|---|---|---|
| Laptop | free | stops when it sleeps; fine while building |
| Small VPS (Hetzner, DigitalOcean, AWS Lightsail) | ~$5/month | **fixed IP** ✅, you manage it, full control |
| Platform (Railway, Render, Fly.io) | free–$5/month | easy deploys, but the outgoing IP usually **changes** ❌ |
| Raspberry Pi at home | one-time | home IP may change |

**Why the fixed IP matters**
- The Shark API key only accepts calls from **trusted IPs**.
- The server's IP must be added to the key.
- If the IP changes, every call fails with 401.
- So a **VPS with a fixed IP** is the best fit.

**What "always on" needs (production style)**
- **Docker**: the same app runs the same way everywhere.
- **Auto restart**: if the app crashes, it starts again (Docker `restart: always`).
- **Health check**: something pings `/health`; if it fails, alert me.
- **Catch-up sync** on startup: fetch anything missed while it was down.
- **Logs** saved somewhere so I can see what happened at 3am.
- **Backups** of the database.
- **Alerts** (e.g. Telegram / email) when sync fails.
