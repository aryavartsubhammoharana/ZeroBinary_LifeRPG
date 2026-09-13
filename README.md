# LifeRPG — Authentication & Backend API

## What Is This Project?

**LifeRPG** is a gamified life-management backend. The idea is simple: real life feels boring sometimes, so we turn your daily tasks, goals, and habits into **quests** — just like an RPG game. You complete quests, earn XP, level up, and spend rewards in a shop.

This repository is the **foundation layer** of LifeRPG. It handles everything that needs to exist before the game even starts:

- Who are you? (**Authentication**)
- Is it really you? (**JWT + HttpOnly Cookie sessions**)
- Can you stay logged in? (**Refresh Token flow**)
- Can only you see your data? (**Row-level data isolation**)
- Can someone spam the login page? (**Rate limiting**)
- What quests do you have? (**Quest CRUD**)
- What's in the shop? (**Shop API**)

Without this layer, nothing else in LifeRPG can be built safely. Every other feature — progression engine, XP system, leaderboards — depends on knowing *who* is making the request and *whether they're allowed to*.

---

## Why Each Decision Was Made

### Why FastAPI?
FastAPI is fast, modern, and auto-generates interactive API docs at `/docs`. It uses Python type hints natively, so validation is automatic — if someone sends wrong data, FastAPI rejects it before it even reaches our code.

### Why HttpOnly Cookie instead of localStorage?
This is a critical security decision.

`localStorage` can be read by **any JavaScript** running on the page. If there's ever an XSS bug (malicious script injected into the page), it can steal every user's token instantly.

An `HttpOnly` cookie **cannot be read by JavaScript at all** — not by our code, not by injected malicious code. The browser sends it automatically with every request to the server. It is only readable server-side.

That is why the JWT is stored in an `HttpOnly` cookie and never touched by JavaScript.

### Why Refresh Tokens?
Access tokens expire in **30 minutes** for security. If stolen, they stop working quickly. But we don't want users to log in again every 30 minutes — that's terrible UX.

Refresh tokens solve this: they last **7 days** and are also stored in an `HttpOnly` cookie. When the access token expires, the frontend silently calls `POST /refresh`, the server issues a new access token, and the user never notices anything.

If someone steals only the access token, it expires in 30 minutes. Stealing the refresh token cookie would require direct server or device access — not just an XSS attack.

### Why Rate Limiting?
Without rate limiting, someone can write a script that tries thousands of password guesses per minute on `/login`. They will eventually crack weak passwords.

Rate limiting says: after N attempts from the same IP in 1 minute, stop and return `429 Too Many Requests`. Brute-force attacks become impractical.

### Why PostgreSQL support when SQLite is the default?
SQLite is a single-file database — great for local development, zero setup. But it only handles **one write at a time**. Under real user load (many people logging in simultaneously), writes queue up and it starts failing.

PostgreSQL handles **concurrent writes from many users at the same time** without data corruption. The switch is handled by a single environment variable — no code changes needed.

### Why simple `password == confirm_password` check?
Registration asks for the password twice to prevent typos. The check is exactly `password == confirm_password` — nothing more. No XOR or complex comparison because those add complexity without any security benefit during registration. The user is filling both fields themselves. Simple equality is correct, honest, and readable.

### Why bcrypt with `<4.0.0`?
`passlib` (our password hashing library) has a known incompatibility with `bcrypt` version 4.x and above. Using `bcrypt<4.0.0` pins to the last compatible version and prevents silent failures or 500 errors during login.

---

## Project Structure

```
LifeRPG/
├── main.py              # FastAPI app — all routes, schemas, rate limiting
├── auth.py              # Password hashing, JWT create/verify, cookie auth, refresh tokens
├── models.py            # SQLAlchemy models (User, Item, Quest, ShopItem)
├── database.py          # Database engine setup — SQLite default, PostgreSQL via env var
├── requirements.txt     # All Python dependencies
├── sql_app.db           # SQLite database file (auto-created on first run)
├── static/
│   ├── index.html       # Single-page app — Login and Register tabs, landscape card layout
│   ├── style.css        # Modern CSS — Inter font, CSS variables, gradient buttons, pill tabs
│   └── app.js           # All client-side logic — auth flow, refresh token retry, form handling
└── README.md            # This file
```

---

## Tech Stack

| Layer | Technology | Why |
|:---|:---|:---|
| Web Framework | FastAPI | Fast, typed, auto-generates docs |
| ASGI Server | Uvicorn | Production-ready Python server |
| ORM | SQLAlchemy | Works with SQLite and PostgreSQL without code changes |
| Database (dev) | SQLite | Zero setup, single file |
| Database (prod) | PostgreSQL | Concurrent writes, production-grade |
| Password Hashing | passlib + bcrypt | Industry-standard, one-way irreversible hashing |
| Authentication | PyJWT | JWT encoding and decoding |
| Rate Limiting | slowapi | Per-IP request throttling |
| Form Parsing | python-multipart | Required for OAuth2 form-based login |
| Frontend | Vanilla HTML/CSS/JS | No framework dependency, ships as static files |

---

## Authentication Flow — Full Detail

### Registration Flow

1. User fills in: Full Name, Email, Username, Password, Confirm Password.
2. As the user types the username, the frontend calls `GET /check-username` with a 500ms debounce and shows live availability (available / taken).
3. On form submit:
   - Frontend checks `password === confirmPassword` locally. If not equal, shows error immediately without hitting the server.
   - `POST /register` is called with all fields as JSON.
   - Backend normalizes email to lowercase (`strip().lower()`) to prevent duplicate accounts with different casing.
   - Backend checks for duplicate email — rejects if already registered.
   - Backend checks for duplicate username — rejects if already taken.
   - Password is hashed with bcrypt and stored. Plain password is never saved.
   - Response: `201 Created` with `{"message": "User created successfully"}`.
4. User is automatically switched to the Login tab with the email pre-filled.

### Login Flow

1. User enters Email or Username + Password.
2. `POST /login` is called as an OAuth2 form (`application/x-www-form-urlencoded`).
3. Backend looks up user by email (case-insensitive) or username.
4. Verifies the entered password against the stored bcrypt hash.
5. If valid:
   - Creates an **access token** (JWT, `sub = username`, expires in 30 minutes).
   - Creates a **refresh token** (JWT, `sub = username`, `typ = "refresh"`, expires in 7 days).
   - Both are set as `HttpOnly`, `SameSite=Lax`, `Path=/` cookies on the response.
6. Browser stores both cookies automatically. JavaScript never sees or reads them.
7. Frontend calls `GET /me` to load the user profile and shows the app.

### Session Check on Page Load

1. On every page load, `app.js` calls `GET /me`.
2. Browser automatically sends the `access_token` cookie.
3. If valid: user is shown the app and their data is loaded.
4. If `401 Unauthorized`: frontend calls `POST /refresh`. If refresh succeeds (new access token cookie is set), frontend retries `GET /me`.
5. If refresh also fails: user is shown the login form.

### Refresh Token Flow

1. Access token expires after 30 minutes.
2. Any authenticated request returns `401`.
3. Frontend's `fetchWithRefresh()` helper catches the 401, calls `POST /refresh`.
4. Backend reads the `refresh_token` cookie, decodes it, verifies `typ == "refresh"` claim.
5. Looks up the user by `sub` claim (username).
6. Issues a new `access_token` cookie with a fresh 30-minute window.
7. Original request is retried automatically — user never sees an interruption.

### Logout Flow

1. User clicks Logout.
2. `POST /logout` is called.
3. Server deletes both `access_token` and `refresh_token` cookies server-side.
4. Frontend resets the UI to the auth form and clears all displayed data.

---

## Rate Limiting

Rate limits are applied **per IP address** using `slowapi`. When a limit is exceeded, the server returns `HTTP 429 Too Many Requests` with a `Retry-After` header.

| Endpoint | Limit | Reason |
|:---|:---|:---|
| `POST /login` | 5 per minute | Prevents brute-force password attacks |
| `POST /register` | 3 per minute | Prevents mass account creation and spam |
| `POST /refresh` | 10 per minute | Prevents refresh token flooding |

---

## API Endpoints — Full Reference

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/` | Serves the frontend single-page application |
| `GET` | `/check-username?username=...` | Returns `{"available": true/false}` for username availability |
| `POST` | `/register` | Creates a new user account |
| `POST` | `/login` | Authenticates user and sets HttpOnly session cookies |
| `POST` | `/logout` | Clears both access and refresh token cookies |
| `POST` | `/refresh` | Issues a new access token using the refresh token cookie |

---

### Protected Endpoints (Auth Required via HttpOnly Cookie)

#### Profile

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/me` | Returns the current user's `id`, `name`, `email`, `username` |

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe"
}
```

---

#### Items

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/items` | Lists all items owned by the logged-in user only |
| `POST` | `/items` | Creates a new item owned by the logged-in user |

**Request body for `POST /items`:**
```json
{
  "title": "My first item"
}
```

**Response:**
```json
{
  "id": 1,
  "title": "My first item"
}
```

---

#### Quests

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/quests` | Lists all quests owned by the logged-in user |
| `POST` | `/quests` | Creates a new quest |
| `PATCH` | `/quests/{id}` | Updates title, description, or xp_reward of a quest |
| `DELETE` | `/quests/{id}` | Deletes a quest permanently |
| `POST` | `/quests/{id}/complete` | Marks a quest as completed and returns XP reward |

**Request body for `POST /quests`:**
```json
{
  "title": "Exercise for 30 minutes",
  "description": "Go for a run or hit the gym",
  "xp_reward": 50
}
```
`description` and `xp_reward` are optional — they default to `""` and `0`.

**Request body for `PATCH /quests/{id}` (all fields optional):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "xp_reward": 100
}
```
Only the fields you send will be updated. Any field left out stays unchanged.

**Response for `POST /quests` and `PATCH /quests/{id}`:**
```json
{
  "id": 3,
  "title": "Exercise for 30 minutes",
  "description": "Go for a run or hit the gym",
  "xp_reward": 50,
  "completed": false
}
```

**Response for `POST /quests/{id}/complete`:**
```json
{
  "message": "Quest completed",
  "xp_reward": 50,
  "quest_id": 3
}
```

> **Progression Engine Hook**: This endpoint is the integration point for the XP/leveling system. Once ready, `quest.xp_reward` is awarded to the user's profile here. The route and auth are already in place — only the XP logic needs to be added.

`DELETE /quests/{id}` returns `204 No Content` on success.

---

#### Shop

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/shop` | Lists all items in the global shop catalogue |
| `POST` | `/shop/purchase` | Purchases a shop item |

**Response for `GET /shop`:**
```json
[
  {
    "id": 1,
    "name": "Double XP Potion",
    "description": "Doubles XP earned for 1 hour",
    "cost": 200
  }
]
```

**Request body for `POST /shop/purchase`:**
```json
{
  "item_id": 1
}
```

**Response:**
```json
{
  "message": "Purchased 'Double XP Potion'",
  "cost": 200,
  "item_id": 1
}
```

> **Shop Note**: Shop items are a global catalogue managed directly in the `shop_items` database table (admin adds items). The purchase endpoint validates the item exists and requires authentication. Currency deduction will be wired once the progression engine tracks the user's currency balance.

---

## Data Models

### User
| Column | Type | Description |
|:---|:---|:---|
| `id` | Integer | Primary key, auto-incremented |
| `name` | String | Full display name entered at registration |
| `email` | String | Unique, stored as lowercase. One account per email. |
| `username` | String | Unique handle. Used as the JWT `sub` claim. |
| `hashed_password` | String | bcrypt hash. Plain password is never stored anywhere. |

### Item
| Column | Type | Description |
|:---|:---|:---|
| `id` | Integer | Primary key |
| `title` | String | Label for the item |
| `owner_id` | Integer | Foreign key → `users.id`. Only the owner can see this item. |

### Quest
| Column | Type | Description |
|:---|:---|:---|
| `id` | Integer | Primary key |
| `title` | String | Name of the quest |
| `description` | String | Optional details about what the quest involves |
| `xp_reward` | Integer | XP awarded to the user when the quest is completed |
| `completed` | Boolean | `false` by default. Set to `true` via `/complete` endpoint. |
| `owner_id` | Integer | Foreign key → `users.id`. Only the owner can see or interact with this quest. |

### ShopItem
| Column | Type | Description |
|:---|:---|:---|
| `id` | Integer | Primary key |
| `name` | String | Display name shown in the shop |
| `description` | String | Optional description of what the item does |
| `cost` | Integer | Price in game currency units |

---

## Data Ownership & Security

Every data-returning or data-modifying endpoint filters by the authenticated user's ID:

```python
db.query(models.Quest).filter(models.Quest.owner_id == current_user.id)
```

This means:
- User A can **never** see, edit, or delete User B's quests or items — even if they guess the ID.
- If a user tries to access `PATCH /quests/99` but quest 99 belongs to someone else, the server returns `404 Not Found` — not `403 Forbidden` — so the existence of the resource is not even revealed.
- Shop items are the only shared resource (global catalogue), but purchasing still requires authentication.

---

## BaaS Fallback Architecture

`auth.py` has a dual-mode design. By default it uses custom JWT logic. If you set `USE_BAAS=true` as an environment variable, it switches to an external BaaS provider (Firebase, Supabase, etc.). The BaaS path currently raises `NotImplementedError` as a placeholder — it is ready to be wired up without touching any route code.

---

## Database Configuration

### Default — SQLite (Local Development)

Zero setup. Just run the server. The file `sql_app.db` is created automatically in the project directory.

### Production — PostgreSQL

Set the `DATABASE_URL` environment variable before starting the server.

**PowerShell:**
```powershell
$env:DATABASE_URL = "postgresql://username:password@localhost:5432/liferpg"
```

**Linux / macOS:**
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/liferpg"
```

SQLAlchemy automatically routes all queries to PostgreSQL. The SQLite-specific `connect_args={"check_same_thread": False}` is applied only when SQLite is detected and is skipped automatically for PostgreSQL.

---

## How to Run

### Step 1 — Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 2 — (Optional) Set Environment Variables
```powershell
$env:JWT_SECRET_KEY = "your_very_long_random_secret_key_here"
$env:DATABASE_URL   = "postgresql://user:pass@localhost:5432/liferpg"
```
If `JWT_SECRET_KEY` is not set, a development fallback key is used. **Never use the fallback key in production.**

### Step 3 — Start the Server
```powershell
python -m uvicorn main:app --reload
```

### Step 4 — Open in Browser

| URL | What it opens |
|:---|:---|
| `http://localhost:8000` | Frontend login/register UI |
| `http://localhost:8000/docs` | Swagger interactive API docs |
| `http://localhost:8000/redoc` | ReDoc API reference |

---

## Environment Variables Reference

| Variable | Default | Description |
|:---|:---|:---|
| `JWT_SECRET_KEY` | `fallback_secret_key_for_dev_only` | Secret used to sign and verify JWTs. Use a long, random string in production. |
| `DATABASE_URL` | *(not set — uses SQLite)* | Full PostgreSQL connection string. If not set, SQLite is used automatically. |
| `USE_BAAS` | `false` | Set to `true` to route auth through a BaaS provider (Firebase/Supabase stub). |

---

## Database Reset (SQLite)

To wipe all data during development:
```powershell
python -c "import sqlite3; conn = sqlite3.connect('sql_app.db'); cur = conn.cursor(); cur.executescript('DELETE FROM quests; DELETE FROM items; DELETE FROM users; DELETE FROM shop_items;'); conn.commit(); conn.close(); print('All data cleared.')"
```

---

## Frontend — How It Works

The entire frontend is three static files served by FastAPI:

### `index.html`
A single HTML page with two top-level views:
- **Auth container**: A landscape-oriented card with Login and Register tabs. Register has a 2-column layout for a clean horizontal form.
- **App container**: Shown after successful login. Displays the user's name, username, email, items list, and item creation form.

### `style.css`
Modern design system:
- CSS custom properties (variables) for consistent colours and spacing.
- Google Font *Inter* for clean, readable typography.
- Pill-style tab switcher for Login / Register.
- Gradient submit buttons with hover transitions.
- Landscape card at `500px` width.
- Visual status indicators for username availability (`✓ available` / `✗ taken`) and password match (`✓ match` / `✗ mismatch`).

### `app.js`
All client logic, no framework:

| Function | What it does |
|:---|:---|
| `checkAuth()` | Calls `/me` on page load. On 401, tries `/refresh`, then retries `/me`. |
| `fetchWithRefresh(url, options)` | Shared wrapper for all authenticated API calls. Catches 401 → refresh → retry once. |
| `tryRefresh()` | Calls `POST /refresh`. Returns `true` if a new access token was issued. |
| `handleLogin()` | Submits credentials as OAuth2 form data to `POST /login`. |
| `handleRegister()` | Validates passwords match locally, then calls `POST /register`. |
| `checkUsernameAvailability()` | Debounced (500ms) call to `/check-username` on every keystroke in username field. |
| `updatePasswordMatchStatus()` | Live `password === confirmPassword` check with a visual indicator below the confirm field. |
| `logout()` | Calls `POST /logout`, clears all UI state. |
| `fetchItems()` | Loads user's items using `fetchWithRefresh`. |
| `createItem()` | Creates a new item using `fetchWithRefresh`. |

**No `localStorage` is used anywhere.** No token ever touches JavaScript. All session state lives in `HttpOnly` cookies managed transparently by the browser.

---

## Progression Engine & Gamification Layer (v1.2 Update)

The foundation has been enhanced with a complete **RPG Progression Engine, Core Attribute System, Daily Login Streak Track, Real-World Rewards Bazaar, and Interactive Cyber-RPG Dashboard**, while strictly preserving 100% of previous code intact.

### 1. API Changes & Architecture

The application now supports a clean, modular extension layer mounted via `extended_main.py` without modifying original core files:

| Endpoint | Method | Purpose |
|:---|:---|:---|
| `/api/profile` | `GET` | Character sheet: Level, XP bar, Gold, Streaks, and 4 Core Attributes (STR, INT, VIT, WIL) |
| `/api/profile/claim-daily-login` | `POST` | Claim daily login streak bonus with 7-day cyclical rewards and milestone unlocks |
| `/api/profile/achievements` | `GET` | View player milestone badges and unlocked achievements |
| `/api/quests/{id}/claim` | `POST` | Complete quest: awards XP + streak bonus + Gold + Attribute gains (+STR for gym, +INT for study) |
| `/api/quests/history` | `GET` | Immutable audit log of completed quests and attribute points earned |
| `/api/quests/summary` | `GET` | Metrics on active vs completed quests and total XP |
| `/api/shop/catalog` | `GET` | Virtual shop catalogue with live affordability checks |
| `/api/shop/{id}/buy` | `POST` | Purchase potions/gear with Gold, deducting coins and adding to inventory |
| `/api/inventory` | `GET` | View owned items and stack quantities |
| `/api/inventory/{id}/use` | `POST` | Consume potions/scrolls for instant XP boosts |
| `/api/rewards/custom` | `GET`, `POST` | Create and browse custom real-world rewards (e.g. Cheat Day Pizza) |
| `/api/rewards/custom/{id}/redeem` | `POST` | Spend Gold to redeem real-life rewards |
| `/api/leaderboard` | `GET` | Global player rankings sorted by Level and XP |
| `/demo` | `GET` | Interactive tactile Cyber-RPG dashboard |

---

### 2. Database Connection & PostgreSQL Integration

The backend is connected to **PostgreSQL 18** (with SQLite fallback for lightweight development):
- **Server:** PostgreSQL 18.4 on `localhost:5432`
- **Database:** `liferpg_db`
- **Configuration:** Managed via `.env` with `DATABASE_URL=postgresql://...`
- **Active Relational Tables:**
  1. `users` — Authentication credentials and hashed passwords.
  2. `user_profiles` — Level, cumulative XP, Gold coins, Quest streak, and **Core Attributes** (`strength`, `knowledge`, `vitality`, `willpower`), plus `login_streak` and `last_login_date`.
  3. `quests` — Player goals and daily tasks.
  4. `quest_history` — Immutable audit trail of completed quests, timestamps, and stat gains.
  5. `custom_rewards` — Player-defined real-world rewards and redemption counts.
  6. `shop_items` — In-game shop catalog (Health Potions, Focus Elixirs, Habit Swords, Dragon Armor).
  7. `inventory_items` — Purchased gear and consumables owned by users.
  8. `achievements` — Unlocked player milestone badges (*First Blood*, *Iron Body*, *Grand Scholar*, *Committed Devotee*).
  9. `items` — Original user item repository.

The database catalog is automatically initialized and seeded on startup using `seed.py`.

---

### 3. Networking & HTTP Diagnostics

Network communication has been verified using an automated diagnostic probe ([`test_networking.py`](file:///d:/sih/Hackathons/life_rpg/ZeroBinary_LifeRPG/test_networking.py)):
- **Health Latency:** `GET /health` averages **~41ms** with persistent keep-alive connections.
- **CORS Preflight:** `OPTIONS` requests properly return `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Credentials: true`, and all standard REST methods (`GET, POST, PATCH, DELETE, OPTIONS`).
- **Cookie Security:** JWT sessions are delivered via `HttpOnly`, `SameSite=lax` (or `none` in prod), and `Path=/` cookies, preventing XSS token exfiltration.
- **Session Continuity:** Tested silent token refreshing via `POST /refresh` and seamless retry.

---

### 4. Added RPG Features

#### A. Dynamic Attribute Engine
Tasks translate directly into virtual player stats:
- **Gym & Workout Quests** $\rightarrow$ Increase **Strength (STR)**.
- **Study & Reading Quests** $\rightarrow$ Increase **Knowledge (INT)**.
- **Cardio & Movement Quests** $\rightarrow$ Increase **Vitality (VIT)**.
- **Habits & Discipline Quests** $\rightarrow$ Increase **Willpower (WIL)**.
*Includes intelligent keyword auto-detection and manual dropdown tagging.*

#### B. Daily Login Streak System
A 7-day cyclical bonus track that rewards consecutive daily check-ins:
- **Day 1:** +25 XP, +15 Gold
- **Day 2:** +35 XP, +20 Gold
- **Day 3:** +50 XP, +30 Gold (*Unlocks "Committed Devotee" badge*)
- **Day 4:** +70 XP, +45 Gold
- **Day 5:** +95 XP, +60 Gold
- **Day 6:** +125 XP, +80 Gold
- **Day 7:** **Weekly Jackpot!** +250 XP, +150 Gold, +1 Free Health Potion (*Unlocks "Unbroken Loyalty" badge*)
*Features double-claim prevention and automated streak resets on skipped days.*

#### C. Real-World Rewards Bazaar
Bridging virtual productivity with real-world dopamine:
- Players create custom rewards (e.g., *"1 Hour Gaming"*, *"Cheat Meal Pizza"*).
- Spending earned virtual Gold deducts from the coin balance and increments lifetime redemptions.

#### D. Alive, Tactile Web Dashboard (`/demo`)
- **Web Audio API Synthesizer:** 8-bit chimes for quest claims, coin clinks, and level-up fanfares (with mute toggle).
- **Canvas Particle Burst:** Multi-colored confetti explosions upon claiming rewards.
- **Celebration Modal:** Dynamic victory popup displaying exact XP, Gold, Attribute gains, and Level-Up fanfare.
- **7-Day Streak Calendar Track:** Visual progress indicators with milestone icons.

---

### 5. Automated Test Suite (18/18 Tests Passing)

Run the full test suite in under 7 seconds:
```bash
.\.venv\Scripts\pytest.exe -v
```
All 18 tests pass covering authentication, row-level data isolation, quest CRUD, attribute progression (gym $\rightarrow$ strength, study $\rightarrow$ knowledge), custom rewards, and daily login streaks.

---

## 👥 Contributors

- **Aryavart Subham Moharana** ([@aryavartsubhammoharana](https://github.com/aryavartsubhammoharana))
- **Saswata Pattanaik** ([@saswata_pattanaik](https://github.com/saswata_pattanaik))

