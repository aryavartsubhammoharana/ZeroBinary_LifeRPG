# LifeRPG — API Contract

**Base URL (local dev):** `http://localhost:8000`
**Base URL (Docker Compose):** `http://localhost:8000`

## Authentication mechanism

All protected endpoints require a valid session. The session is carried automatically by the browser via an **`HttpOnly` cookie** named `access_token` that is set on login. You do not need to attach a token manually in JavaScript — the browser sends the cookie on every same-origin (or CORS-permitted cross-origin) request automatically.

If the `access_token` cookie is expired, call `POST /refresh` (which uses the `refresh_token` cookie) to get a new one, then retry the original request. See the refresh flow below.

> **Content-Type for login:** `POST /login` uses `application/x-www-form-urlencoded` (OAuth2 form format), not JSON. All other `POST`/`PATCH` request bodies are JSON.

---

## Rate limits (per IP)

| Endpoint | Limit |
|:---|:---|
| `GET /check-username` | 20 / minute |
| `POST /register` | 3 / minute |
| `POST /login` | 5 / minute |
| `POST /refresh` | 10 / minute |

Exceeding a limit returns `429 Too Many Requests` with a `Retry-After` header.

---

## Error shape

All error responses follow FastAPI's default shape:

```json
{ "detail": "Human-readable error message" }
```

Validation errors (e.g. missing fields, bad email format) return `422 Unprocessable Entity` with a `detail` array describing each invalid field.

---

## Infrastructure / Utility

### `GET /health`

Health check for deployment tooling. No authentication required.

**Response `200`**
```json
{ "status": "ok" }
```

---

## Auth

### `POST /register`

Create a new user account.

- **Auth required:** No
- **Content-Type:** `application/json`
- **Rate limit:** 3 / minute

**Request body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "username": "janedoe",
  "password": "mypassword123",
  "confirm_password": "mypassword123"
}
```

| Field | Type | Rules |
|:---|:---|:---|
| `name` | string | Required |
| `email` | string (email format) | Required. Must be a valid email. One account per email address (case-insensitive). |
| `username` | string | Required. Must be unique. |
| `password` | string | Required. Minimum 8 characters. |
| `confirm_password` | string | Required. Must exactly match `password`. |

**Response `201`**
```json
{ "message": "User created successfully" }
```

**Error responses**

| Status | `detail` |
|:---|:---|
| `400` | `"Passwords do not match"` |
| `400` | `"Password must be at least 8 characters long"` |
| `400` | `"An account with this email already exists"` |
| `400` | `"Username already taken"` |
| `422` | Pydantic validation error (e.g. invalid email format) |

---

### `POST /login`

Authenticate with email or username + password. Sets `access_token` and `refresh_token` as `HttpOnly` cookies on success.

- **Auth required:** No
- **Content-Type:** `application/x-www-form-urlencoded`
- **Rate limit:** 5 / minute

**Request body (form-encoded)**

| Field | Value |
|:---|:---|
| `username` | The user's email address **or** username |
| `password` | The user's password |

**Example (fetch)**
```js
const form = new URLSearchParams();
form.append('username', 'jane@example.com'); // or 'janedoe'
form.append('password', 'mypassword123');

fetch('/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: form,
  credentials: 'include',
});
```

**Response `200`**
```json
{ "message": "Login successful" }
```

**Cookies set on success**

| Cookie | `HttpOnly` | Expiry |
|:---|:---|:---|
| `access_token` | Yes | 30 minutes |
| `refresh_token` | Yes | 7 days |

**Error responses**

| Status | `detail` |
|:---|:---|
| `401` | `"Incorrect username/email or password"` |

---

### `POST /logout`

Clears both session cookies server-side. Call this regardless of whether the access token has already expired.

- **Auth required:** No (works even with an expired token)
- **Content-Type:** none

**Response `200`**
```json
{ "message": "Logged out successfully" }
```

---

### `POST /refresh`

Exchange the `refresh_token` cookie for a new `access_token` cookie. Call this automatically when any authenticated request returns `401`, then retry the original request.

- **Auth required:** No (uses `refresh_token` cookie, not `access_token`)
- **Content-Type:** none
- **Rate limit:** 10 / minute

**Response `200`** — sets a new `access_token` cookie (30-minute expiry)
```json
{ "message": "Token refreshed" }
```

**Error responses**

| Status | `detail` |
|:---|:---|
| `401` | `"No refresh token"` |
| `401` | `"Invalid token type"` |
| `401` | `"Invalid or expired refresh token"` |
| `401` | `"User not found"` |

**Recommended frontend pattern**
```js
async function fetchWithRefresh(url, options = {}) {
  let res = await fetch(url, { ...options, credentials: 'include' });
  if (res.status === 401) {
    const refreshed = await fetch('/refresh', { method: 'POST', credentials: 'include' });
    if (refreshed.ok) {
      res = await fetch(url, { ...options, credentials: 'include' });
    }
  }
  return res;
}
```

---

### `GET /check-username`

Check if a username is already taken. Use this for live availability feedback during registration (debounce by ~500ms).

- **Auth required:** No
- **Rate limit:** 20 / minute

**Query parameter**

| Param | Type | Description |
|:---|:---|:---|
| `username` | string | The username to check |

**Example:** `GET /check-username?username=janedoe`

**Response `200`**
```json
{ "available": true }
```
or
```json
{ "available": false }
```

If `username` is blank, also returns `{ "available": false, "detail": "Username cannot be empty" }`.

---

### `GET /me`

Returns the currently authenticated user's profile.

- **Auth required:** ✅ Yes

**Response `200`**
```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "username": "janedoe"
}
```

**Error responses**

| Status | Meaning |
|:---|:---|
| `401` | Not authenticated or token expired. Refresh and retry. |

---

## Items

A simple owned-resource collection. Each item belongs to the authenticated user only.

### `GET /items`

List all items owned by the current user.

- **Auth required:** ✅ Yes

**Response `200`** — array (empty array if no items)
```json
[
  { "id": 1, "title": "My first item" },
  { "id": 2, "title": "Another item" }
]
```

---

### `POST /items`

Create a new item owned by the current user.

- **Auth required:** ✅ Yes
- **Content-Type:** `application/json`

**Request body**
```json
{ "title": "My new item" }
```

**Response `201`**
```json
{ "id": 3, "title": "My new item" }
```

---

## Quests

Quests belong to the authenticated user. Users cannot see or modify each other's quests. Attempting to access another user's quest ID returns `404`, not `403`.

### `GET /quests`

List all quests owned by the current user.

- **Auth required:** ✅ Yes

**Response `200`** — array
```json
[
  {
    "id": 1,
    "title": "Exercise for 30 minutes",
    "description": "Go for a run or hit the gym",
    "xp_reward": 50,
    "completed": false
  }
]
```

---

### `POST /quests`

Create a new quest.

- **Auth required:** ✅ Yes
- **Content-Type:** `application/json`

**Request body**

| Field | Type | Required | Default |
|:---|:---|:---|:---|
| `title` | string | ✅ Yes | — |
| `description` | string | No | `""` |
| `xp_reward` | integer | No | `0` |

```json
{
  "title": "Read for 20 minutes",
  "description": "Any book counts",
  "xp_reward": 30
}
```

**Response `201`**
```json
{
  "id": 2,
  "title": "Read for 20 minutes",
  "description": "Any book counts",
  "xp_reward": 30,
  "completed": false
}
```

---

### `PATCH /quests/{quest_id}`

Update a quest's title, description, or XP reward. All fields are optional — send only the fields you want to change.

- **Auth required:** ✅ Yes
- **Content-Type:** `application/json`

**Path parameter:** `quest_id` (integer)

**Request body** (all fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "xp_reward": 100
}
```

**Response `200`**
```json
{
  "id": 2,
  "title": "Updated title",
  "description": "Updated description",
  "xp_reward": 100,
  "completed": false
}
```

**Error responses**

| Status | `detail` |
|:---|:---|
| `404` | `"Quest not found"` (including if the quest belongs to another user) |

---

### `DELETE /quests/{quest_id}`

Permanently delete a quest.

- **Auth required:** ✅ Yes

**Path parameter:** `quest_id` (integer)

**Response `204`** — no body

**Error responses**

| Status | `detail` |
|:---|:---|
| `404` | `"Quest not found"` |

---

### `POST /quests/{quest_id}/complete`

Mark a quest as completed. A quest can only be completed once.

> **Note for frontend:** The `xp_reward` field in the response is the amount of XP that *will* be awarded once the progression engine is integrated. It is not yet deducted/awarded from a balance in the current backend — treat it as informational for now.

- **Auth required:** ✅ Yes

**Path parameter:** `quest_id` (integer)

**Response `200`**
```json
{
  "message": "Quest completed",
  "xp_reward": 50,
  "quest_id": 1
}
```

**Error responses**

| Status | `detail` |
|:---|:---|
| `400` | `"Quest already completed"` |
| `404` | `"Quest not found"` |

---

## Shop

The shop catalogue is global (not per-user). All authenticated users see the same items. Purchases are auth-guarded.

> **Note for frontend:** Currency deduction is not yet implemented. `POST /shop/purchase` validates the item exists and returns a success response, but no balance is checked or updated. Wire up UI affordances for currency when the progression engine is integrated.

### `GET /shop`

List all items available in the shop.

- **Auth required:** ✅ Yes

**Response `200`** — array
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

---

### `POST /shop/purchase`

Purchase a shop item.

- **Auth required:** ✅ Yes
- **Content-Type:** `application/json`

**Request body**
```json
{ "item_id": 1 }
```

**Response `200`**
```json
{
  "message": "Purchased 'Double XP Potion'",
  "cost": 200,
  "item_id": 1
}
```

**Error responses**

| Status | `detail` |
|:---|:---|
| `404` | `"Shop item not found"` |

---

## Common error codes reference

| HTTP Status | Meaning |
|:---|:---|
| `400` | Bad request — validation failed (see `detail` for reason) |
| `401` | Unauthenticated — no valid session cookie, or token expired |
| `404` | Resource not found (or belongs to another user) |
| `422` | Unprocessable entity — request body failed Pydantic schema validation |
| `429` | Rate limit exceeded — back off and retry after `Retry-After` seconds |
| `500` | Internal server error |
