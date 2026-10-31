# QueueLess — Smart Queue Management System

> Book a token online. Track your place in line live. Skip the crowded waiting room.

QueueLess is a real-time queue management web app for clinics, hospitals, salons and service centres. Customers book a token from their phone and watch their position and estimated wait update live. Staff run the queue from an admin dashboard (Call Next / Complete / Skip), and every change appears instantly on the customer's screen via Socket.IO.

**Build constraint:** this is a **3-hour MVP** (build + test + 2–3 min demo video). Scope is intentionally tight. Five features working perfectly beat ten half-working ones.

---

## 1. Problem

- People waiting for a clinic, salon or service centre don't know how many people are ahead of them.
- They don't know when their turn will come, so they sit in crowded waiting areas.
- Staff manage the queue manually (paper slips, shouting names).

## 2. Solution

- Customer picks a service, enters name and phone, and gets a **unique token**.
- Customer sees **live**: the token being served now, people ahead, estimated wait.
- Admin sees the live queue and controls it with one-click actions.
- All state lives on the **backend/database**. The frontend never fakes or manually edits queue numbers.

---

## 2.1 Positioning and Adoption

**Target users:** small walk-in businesses. **Clinics lead the story** (strongest real-world pain); **salons / barber shops** are the second use case. The software is identical for both because everything is a "service with a queue". Seed data already covers both.

**How shops keep the queue accurate:**
1. Reception/owner keeps the Admin Dashboard open on a tablet or phone.
2. Customers join via QR poster at the counter or via the booking page.
3. Staff only perform 3 actions: **Call Next**, **Complete**, **Add Walk-in** (Skip/Cancel when needed).
4. Walk-ins are added by staff so online and offline customers share one queue.

**Honest limitation:** QueueLess still needs staff to click. We reduce the effort to a few taps; we do not remove it. Future scope: SMS/WhatsApp alerts, stale-queue reminders, arrival check-in.

**Product rule:** QueueLess never promises an appointment time. It shows an **estimated** wait, because consultation and service durations vary.

---

## 3. MVP Scope

### In scope (build exactly this)

| # | Screen | Route | Purpose |
|---|--------|-------|---------|
| 1 | Customer Booking | `/` | Select service, enter name + phone, generate token |
| 2 | Live Token Tracking | `/token/:tokenId` | Big token number, now serving, people ahead, ETA, live status |
| 3 | Admin Dashboard | `/admin` | Stats, Call Next / Complete / Skip, live queue list |
| 4 | Live Queue Display *(optional, only if time remains)* | `/display` | Read-only "Now Serving" screen for a waiting-room TV |
| 5 | Shop QR Poster | `/qr/:serviceId` | Printable QR code that opens the booking page with that service preselected |

**Also in scope (adoption features — they make the queue trustworthy):**
- **Add Walk-in Customer** (admin): people already sitting in the shop must exist in the queue, otherwise positions and ETAs are wrong.
- **Open / Closed toggle** and a **daily token limit** per service.
- **QR entry point:** QR only deep-links to the booking page. No separate "arrival check-in" status in the MVP.
- **"Estimate, not a promise" wording** wherever waiting time is shown.

### Out of scope (do NOT build)

Authentication/login, payments, SMS/WhatsApp/email notifications, multiple organizations/tenants, user accounts, analytics charts beyond the stat cards, i18n, dark mode, PWA/offline, file uploads.

> If a feature is not listed under "In scope", do not build it.

---

## 4. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| QR code | qrcode.react |
| Routing | React Router v6 |
| HTTP client | Axios (or fetch) |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO (server + client) |
| Validation | Zod or express-validator |
| Dev tooling | nodemon, concurrently (optional), dotenv, cors |

---

## 5. Project Structure

```
queueless/
├── README.md
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                 # Express + HTTP server + Socket.IO bootstrap
│       ├── config/db.js             # Mongoose connection
│       ├── models/
│       │   ├── Service.js
│       │   ├── Token.js
│       │   └── Counter.js           # atomic token number counter
│       ├── routes/
│       │   ├── services.routes.js
│       │   ├── tokens.routes.js
│       │   ├── queue.routes.js
│       │   └── admin.routes.js
│       ├── controllers/
│       │   ├── services.controller.js
│       │   ├── tokens.controller.js
│       │   ├── queue.controller.js
│       │   └── admin.controller.js
│       ├── services/
│       │   └── queue.service.js     # ALL business logic lives here
│       ├── sockets/
│       │   └── socket.js            # io instance, rooms, emit helpers
│       ├── middleware/
│       │   ├── errorHandler.js
│       │   └── validate.js
│       └── seed.js                  # seeds demo services
└── client/
    ├── package.json
    ├── .env.example
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx                  # routes
        ├── api/client.js            # axios instance + API functions
        ├── lib/socket.js            # single shared socket.io-client instance
        ├── hooks/
        │   ├── useQueue.js          # fetch + live-subscribe to a service queue
        │   └── useToken.js          # fetch + live-subscribe to one token
        ├── pages/
        │   ├── BookingPage.jsx
        │   ├── TokenPage.jsx
        │   ├── AdminPage.jsx
        │   ├── QrPage.jsx           # printable shop QR poster
        │   └── DisplayPage.jsx      # optional
        └── components/
            ├── Navbar.jsx
            ├── ServiceCard.jsx
            ├── TokenBadge.jsx       # big animated token number
            ├── StatCard.jsx
            ├── StatusPill.jsx
            ├── QueueList.jsx
            ├── QueueRow.jsx
            ├── ConnectionIndicator.jsx
            ├── Skeleton.jsx
            ├── EmptyState.jsx
            ├── WalkInModal.jsx
            └── Toast.jsx
```

---

## 6. Data Models (Mongoose)

### Service
```js
{
  name: String,              // "General Consultation"
  prefix: String,            // "A"  (used to build token code "A-007")
  avgServiceMinutes: Number, // default 5, used for ETA
  isActive: Boolean,         // default true
  isOpen: Boolean,           // default true; admin can close online booking
  maxTokensPerDay: Number    // default 50; 0 = unlimited
}
```

### Token
```js
{
  service: ObjectId,         // ref Service
  dateKey: String,           // "YYYY-MM-DD" (server local date) — queue resets daily
  tokenNumber: Number,       // 1, 2, 3 ... per service per day
  tokenCode: String,         // "A-007"
  customerName: String,
  phone: String,             // 10 digits (optional for walk-ins)
  source: String,            // 'online' | 'walkin' (default 'online')
  status: String,            // 'waiting' | 'serving' | 'completed' | 'skipped' | 'cancelled'
  calledAt: Date,            // set when status -> serving
  completedAt: Date,         // set when completed / skipped / cancelled
  createdAt: Date,           // timestamps: true
  updatedAt: Date
}
```

**Indexes**
- `{ service: 1, dateKey: 1, tokenNumber: 1 }` — **unique**.
- `{ service: 1, dateKey: 1, status: 1 }` — for queue queries.
- `{ service: 1, dateKey: 1 }` — **unique partial index where `status: 'serving'`**. This guarantees at most one serving token per service per day at the database level.

### Counter
```js
{ _id: "<serviceId>:<dateKey>", seq: Number }
```
Generate `tokenNumber` with an atomic `findOneAndUpdate({_id}, {$inc:{seq:1}}, {new:true, upsert:true})`. Never use `count() + 1` (race conditions).

### Seed data (`npm run seed`)

| Name | Prefix | avgServiceMinutes |
|------|--------|-------------------|
| General Consultation | A | 5 |
| Dental Checkup | B | 10 |
| Salon — Haircut | C | 15 |
| Service Centre — Repair | D | 20 |

---

## 7. Business Rules

### 7.1 Status transitions (enforced on the backend)

```
waiting ──► serving ──► completed
   │           │
   │           └──────► skipped
   ├──────────────────► skipped
   └──────────────────► cancelled
```

| From | Allowed to |
|------|-----------|
| `waiting` | `serving`, `skipped`, `cancelled` |
| `serving` | `completed`, `skipped` |
| `completed`, `skipped`, `cancelled` | *(terminal — no transitions)* |

Any invalid transition returns **409 Conflict** with a clear message. Never silently ignore it.

### 7.2 Booking
- `customerName`: required, 2–50 chars, trimmed.
- `phone`: required, exactly 10 digits (`/^[6-9]\d{9}$/` for Indian mobiles).
- `serviceId`: must exist and be `isActive`.
- **Duplicate guard:** if the same phone already has a `waiting` or `serving` token for the same service today, return **409** with `code: "DUPLICATE_ACTIVE_TOKEN"` and include the existing `tokenId` so the UI can offer "Go to my token".
- Token number = atomic counter for `(service, dateKey)`. `tokenCode = prefix + "-" + zero-padded 3 digits`.

### 7.2a Walk-in customers (admin only)
- Admin adds a walk-in with `customerName` (required) and `phone` (optional, validated if given).
- Uses the same atomic counter, so the token joins the **same queue** at the end. `source = 'walkin'`.
- Walk-ins **skip** the duplicate-phone check and **bypass** the Closed state and the daily limit (the person is already physically there).
- Walk-ins appear in the queue, position and ETA calculations exactly like online tokens, with a small "Walk-in" badge in the admin list.

### 7.2b Open / Closed and daily limit (online booking only)
- If `service.isOpen === false` → `POST /tokens` returns **409** `QUEUE_CLOSED` ("Booking is closed for today.").
- If today's token count for the service has reached `maxTokensPerDay` (and it's not 0) → **409** `DAILY_LIMIT_REACHED`.
- Closing the queue does **not** affect tokens already issued; staff can keep calling them.

### 7.3 Call Next
- Picks the **waiting token with the lowest `tokenNumber`** for that service today.
- If a token is already `serving` → **409** `"Complete or skip the current token first."`
- If no one is waiting → **404** `"No customers waiting."`
- Sets `status = serving`, `calledAt = now`.

### 7.4 Complete / Skip / Cancel
- **Complete**: only from `serving`. Sets `completedAt`.
- **Skip**: from `serving` or `waiting`. Sets `completedAt`.
- **Cancel**: from `waiting` only (customer or admin). Sets `completedAt`.

### 7.5 Position and waiting time (calculated server-side from real data)

For a `waiting` token T in service S today:

```
waitingAhead = count(tokens where service=S, today, status='waiting', tokenNumber < T.tokenNumber)
servingAhead = exists(token where service=S, today, status='serving') ? 1 : 0
peopleAhead  = waitingAhead + servingAhead
position     = waitingAhead + 1                 // position among waiting customers
etaMinutes   = peopleAhead * service.avgServiceMinutes
```

- If T is `serving` → `peopleAhead = 0`, `etaMinutes = 0`, message "It's your turn".
- If T is terminal (`completed` / `skipped` / `cancelled`) → no position/ETA.
- **"Next" state:** when `waitingAhead === 0` and T is `waiting`, the customer is next in line → trigger the "Your turn is next" notification.

**Estimate, not a promise:** ETA is `peopleAhead × avgServiceMinutes`. The UI must always label it as *estimated* and never present it as a guaranteed time.

*Stretch (only if time remains):* replace the fixed `avgServiceMinutes` with a rolling average of the last 10 completed tokens (`completedAt - calledAt`), falling back to the configured value.

---

## 8. REST API

Base URL: `/api`. All responses are JSON.

**Error format (always):**
```json
{ "error": { "code": "INVALID_TRANSITION", "message": "Only a serving token can be completed." } }
```
Codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `DUPLICATE_ACTIVE_TOKEN` (409), `QUEUE_CLOSED` (409), `DAILY_LIMIT_REACHED` (409), `INVALID_TRANSITION` (409), `ALREADY_SERVING` (409), `QUEUE_EMPTY` (404), `SERVER_ERROR` (500).

### Public / customer

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/health` | — | `{ ok: true }` |
| GET | `/services` | — | List active services, each with `waitingCount`, `nowServing` code, `isOpen` |
| POST | `/tokens` | `{ customerName, phone, serviceId }` | Create token. Returns `201` with token + position + ETA |
| GET | `/tokens/:id` | — | Token details + live `peopleAhead`, `position`, `etaMinutes`, `nowServing` |
| PATCH | `/tokens/:id/cancel` | — | Customer cancels own waiting token |

### Admin

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/admin/queue/:serviceId` | — | Full snapshot (see below) |
| POST | `/admin/queue/:serviceId/next` | — | Call next waiting token |
| POST | `/admin/queue/:serviceId/walkin` | `{ customerName, phone? }` | Add a walk-in customer to the queue (201) |
| PATCH | `/admin/services/:serviceId/open` | `{ isOpen: boolean }` | Open or close online booking |
| PATCH | `/admin/tokens/:id/complete` | — | Complete the serving token |
| PATCH | `/admin/tokens/:id/skip` | — | Skip a serving/waiting token |
| PATCH | `/admin/tokens/:id/cancel` | — | Cancel a waiting token |
| POST | `/admin/queue/:serviceId/reset` | — | **Demo helper:** delete today's tokens + counter for that service |

### Queue snapshot shape
```json
{
  "service": { "_id": "...", "name": "General Consultation", "prefix": "A", "avgServiceMinutes": 5 },
  "stats": { "totalToday": 12, "waiting": 6, "completed": 4, "skipped": 1, "cancelled": 0, "serving": 1 },
  "nowServing": { "_id": "...", "tokenCode": "A-005", "customerName": "Ravi", "calledAt": "..." },
  "waiting": [
    { "_id": "...", "tokenCode": "A-006", "customerName": "Priya", "phone": "98XXXXXX01", "position": 1, "etaMinutes": 5, "createdAt": "..." }
  ],
  "history": [ { "tokenCode": "A-004", "customerName": "Amit", "status": "completed" } ]
}
```
`history` = last 10 terminal tokens today (newest first).

---

## 9. Socket.IO

Single Socket.IO server attached to the same HTTP server as Express. CORS origin from env.

### Rooms
| Room | Joined by |
|------|-----------|
| `service:<serviceId>` | Admin dashboard, display screen, and every customer tracking a token in that service |
| `token:<tokenId>` | The customer who owns that token |

### Client → Server
| Event | Payload | Action |
|-------|---------|--------|
| `join:service` | `{ serviceId }` | Join `service:<id>` |
| `join:token` | `{ tokenId }` | Join `token:<id>` |

### Server → Client
| Event | Room | Payload | When |
|-------|------|---------|------|
| `queue:updated` | `service:<id>` | `{ serviceId }` | After **every** mutation (book, walk-in, next, complete, skip, cancel, open/close, reset) |
| `token:notify` | `token:<id>` | `{ tokenId, type, message }` | Targeted alerts: `type` = `NEXT` (you're next), `CALLED` (it's your turn), `SKIPPED`, `COMPLETED`, `CANCELLED` |

### Rules
1. **Mutate DB first, then emit.** Never emit before the write succeeds.
2. `queue:updated` is a lightweight "something changed" signal. Clients react by **re-fetching** from the REST API (`GET /admin/queue/:serviceId` or `GET /tokens/:id`). This keeps the database as the single source of truth and avoids client/server drift.
3. After every mutation, the server also checks the **new first waiting token** and emits `token:notify { type: 'NEXT' }` to it ("You're next — please be ready").
4. When a token is called, emit `token:notify { type: 'CALLED' }` to that token's room.
5. On reconnect, the client re-joins its rooms and re-fetches data.

---

## 10. UI / UX Specification

### 10.1 Design system
- **Font:** Inter (Google Fonts), fallback `system-ui`.
- **Palette**
  - Primary: indigo-600 (`#4F46E5`), hover indigo-700
  - Serving / success: emerald-500
  - Waiting: amber-500
  - Skipped / danger: rose-500
  - Completed: slate-400
  - Background: slate-50, cards white, text slate-900 / slate-500
- **Cards:** `rounded-2xl`, `shadow-sm` with `border border-slate-200`, generous padding (`p-6`).
- **Buttons:** `rounded-xl`, height 44px+, clear disabled state, loading spinner inside the button while a request is in flight.
- **Spacing:** 4/8px scale only. Max content width `max-w-5xl`, centered.
- **Responsive:** mobile-first. Booking and Token pages must look excellent at 375px width. Admin must work at tablet width and up.

### 10.2 Animations (Framer Motion — keep them tasteful)
- Page entrance fade/slide-up (`opacity 0→1`, `y 12→0`).
- Token number and "people ahead" count: animate on change (scale pulse or number tick).
- Queue list: `AnimatePresence` + `layout` so rows slide when someone is called/removed.
- "Your turn is next" banner: gentle pulsing ring.
- Do not add decorative animations that slow the demo.

### 10.3 Page: Customer Booking (`/`)
- Hero: product name, one-line value proposition.
- **Service selection:** grid of `ServiceCard`s (icon, name, "N waiting", "~X min per customer"). Selected card has an indigo ring.
- Form: Name, Phone (numeric keyboard, `maxLength=10`), with inline validation errors.
- Primary button: **Generate Token** (disabled until valid; spinner while submitting).
- On success → save `tokenId` in `localStorage` (`queueless:lastTokenId`) and navigate to `/token/:id`.
- On `DUPLICATE_ACTIVE_TOKEN` → show a message with a **View my token** button.
- Loading: skeleton service cards. Error: friendly retry card if `/services` fails.
- **QR deep link:** `/?service=<serviceId>` preselects that service card (QR poster points here).
- **Closed / full services:** card is greyed out with a "Booking closed" or "Fully booked today" label and cannot be selected. Handle `QUEUE_CLOSED` and `DAILY_LIMIT_REACHED` errors with a friendly message.
- If a saved active `lastTokenId` exists, show a small "Resume your token" banner.

### 10.4 Page: Live Token Tracking (`/token/:tokenId`)
- Giant token code (e.g. `A-007`) in a gradient card, with a `StatusPill`.
- Three info tiles: **Now Serving**, **People Ahead**, **Estimated Wait** (`~15 min`).
- Small helper text under the wait tile: *"Estimated time. Actual wait may vary."* Never show it as an exact appointment time.
- Progress bar showing how close the customer is (based on peopleAhead vs. the initial position, or a simple 3-state stepper: Waiting → Next → Serving).
- Status-specific states:
  - `waiting`: normal view.
  - **Next in line:** highlighted banner "You're next — please head to the counter".
  - `serving`: green full-width banner "It's your turn! Please proceed."
  - `completed`: thank-you state with a "Book another token" button.
  - `skipped`: amber state "Your token was skipped" + "Book again".
  - `cancelled`: neutral state.
- **Cancel token** button (waiting only) with a confirm step.
- `ConnectionIndicator` (green dot "Live" / grey "Reconnecting…").
- Toast on `token:notify` events. Optionally call `navigator.vibrate(200)` when it's your turn.
- 404 token → friendly "Token not found" page.

### 10.5 Page: Admin Dashboard (`/admin`)
- Top bar: service selector (dropdown/tabs), connection indicator.
- **Stat cards (4):** Total Today, Waiting, Completed, Currently Serving (token code).
- **Now Serving panel (hero):**
  - Shows the serving token (code, name, phone, time elapsed).
  - Buttons: **Complete** (emerald) and **Skip** (rose), enabled only when someone is serving.
  - **Call Next** (indigo, large) enabled only when nobody is serving AND at least one person is waiting. Show tooltip/helper text explaining why it's disabled.
- **Add Walk-in** button (secondary) opens `WalkInModal`: name (required), phone (optional). On success the new token shows in the list immediately via the live update.
- **Open / Closed toggle** for the selected service with a clear label ("Accepting online bookings" / "Booking closed").
- *Stretch:* if the serving token's elapsed time is more than 2× `avgServiceMinutes`, show a subtle amber hint "Still in service?".
- **Waiting list:** `QueueList` of `QueueRow`s (token code, name, masked phone, position, ETA, time waiting, per-row Cancel/Skip actions).
- **Recently finished:** compact list of the last 10 terminal tokens with status pills.
- **Reset today's queue** button inside a small "Demo tools" section, with a confirm dialog.
- Empty state: "No customers waiting — enjoy the quiet moment."
- All action buttons show loading state, and errors surface as toasts.

### 10.6 Page: Live Display (`/display?service=<id>`) *(optional)*
- Full-screen, large type: **NOW SERVING** token code, plus the next 5 waiting codes. No buttons. Auto-updates via socket.

### 10.7 Page: Shop QR Poster (`/qr/:serviceId`)
- Printable, minimal page: shop/service name, big QR code (`qrcode.react`) encoding `<CLIENT_URL>/?service=<serviceId>`, text "Scan to join the queue".
- A "Print" button (`window.print()`) with print-friendly CSS (hide navbar/buttons).
- Linked from the admin dashboard ("Get QR poster").

---

## 11. Frontend Implementation Notes

- `lib/socket.js`: create **one** `io(VITE_API_URL)` instance with `autoConnect` and reconnection.
- `useQueue(serviceId)`: fetches snapshot, joins `service:<id>`, listens to `queue:updated` → re-fetches. Cleans up listeners on unmount.
- `useToken(tokenId)`: fetches token, joins `service:<serviceId>` and `token:<id>`, listens to `queue:updated` (refetch) and `token:notify` (toast).
- Re-join rooms on socket `connect` event (covers reconnects).
- Debounce/ignore overlapping refetches (use a simple "latest request wins" guard).
- Never compute queue position or ETA on the client. Display what the server returns.
- Every page handles three states: **loading**, **error**, **empty**.

## 12. Backend Implementation Notes

- Keep controllers thin. All queue rules (transitions, call next, position/ETA) live in `services/queue.service.js` so they can be tested independently.
- `dateKey` is generated by one helper (`todayKey()`) used everywhere.
- Validate every request body/param (including `ObjectId` validity → 400, not a crash).
- Central `errorHandler` maps custom errors to the error format above. Never leak stack traces.
- Use `helmet` (optional) and `cors` with `CLIENT_ORIGIN`.
- Log each mutation (`console.log`) in dev: helpful for the demo video.

---

## 13. Environment Variables

**`server/.env.example`**
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/queueless
CLIENT_ORIGIN=http://localhost:5173
```

**`client/.env.example`**
```
VITE_API_URL=http://localhost:5000
```

---

## 14. Getting Started

```bash
# 1. Install
cd server && npm install
cd ../client && npm install

# 2. Configure env
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Seed demo services
cd server && npm run seed

# 4. Run (two terminals)
cd server && npm run dev      # http://localhost:5000
cd client && npm run dev      # http://localhost:5173
```

**Server scripts:** `dev` (nodemon src/index.js), `start` (node src/index.js), `seed` (node src/seed.js)
**Client scripts:** `dev`, `build`, `preview`

---

## 15. Implementation Order (180-minute plan)

| Time | Task | Done when |
|------|------|-----------|
| 0–15 | Scaffold both apps, install deps, connect MongoDB, seed services | `GET /api/services` returns data; client renders |
| 15–55 | **Frontend UI** with mock-free layout: design system, Navbar, Booking page, Token page, Admin page (can call real APIs as they come online) | All 3 pages look polished at mobile + desktop |
| 55–100 | **Backend + queue logic**: models, counter, `queue.service.js`, all REST endpoints (incl. walk-in and open/close), validation, errors | curl flow in §16 passes |
| 100–125 | **Socket.IO**: server rooms + emits, client hooks, notifications | Two browser windows sync instantly |
| 125–145 | **Testing + polish**: loading/empty/error states, responsive fixes, edge cases | Checklist in §16 passes |
| 145–165 | **Record demo video** (2–3 min) | Video exported |
| 165–180 | **Final check**: README, repo, video, submission | Everything submitted |

> **Priority rule:** if time runs short, cut in this order → Live Display page → stale-service hint → QR poster polish → animations → stretch ETA average → Reset button polish. **Never** cut: booking, walk-in, call next/complete/skip, live sync, validation.

---

## 16. Testing

### 16.1 API smoke test (curl)
```bash
# list services, copy a service _id
curl localhost:5000/api/services

# book two tokens
curl -X POST localhost:5000/api/tokens -H "Content-Type: application/json" \
  -d '{"customerName":"Ravi","phone":"9876543210","serviceId":"<SERVICE_ID>"}'
curl -X POST localhost:5000/api/tokens -H "Content-Type: application/json" \
  -d '{"customerName":"Priya","phone":"9876543211","serviceId":"<SERVICE_ID>"}'

# call next -> complete -> call next
curl -X POST  localhost:5000/api/admin/queue/<SERVICE_ID>/next
curl -X PATCH localhost:5000/api/admin/tokens/<TOKEN_ID>/complete
curl -X POST  localhost:5000/api/admin/queue/<SERVICE_ID>/next
```

### 16.2 Manual checklist

**Booking**
- [ ] Empty name / invalid phone shows inline errors, no request sent
- [ ] Valid booking returns a unique token code and redirects
- [ ] Same phone + same service while active → duplicate message with "View my token"
- [ ] Two quick submissions never produce the same token number

**Queue logic**
- [ ] Call Next picks the lowest waiting token number
- [ ] Call Next while someone is serving → blocked (UI disabled + API 409)
- [ ] Call Next on empty queue → friendly message
- [ ] Complete only works on a serving token; Skip works on serving/waiting
- [ ] Completed/skipped/cancelled tokens cannot change status again (409)
- [ ] People ahead and ETA recalculate correctly after each action

**Walk-ins and shop controls**
- [ ] Add walk-in (name only) → appears in the queue with a Walk-in badge
- [ ] An online customer's position and ETA increase correctly after walk-ins are added
- [ ] Walk-in works even when the service is Closed or the daily limit is reached
- [ ] Closing a service blocks new online bookings (card greyed out; API returns `QUEUE_CLOSED`)
- [ ] Daily limit reached → `DAILY_LIMIT_REACHED` message shown
- [ ] `/qr/:serviceId` renders a QR; scanning it opens `/?service=<id>` with that service preselected
- [ ] Wait time is always labelled "estimated"

**Real-time (use two browser windows: admin + customer, ideally a phone-sized window)**
- [ ] New booking appears on the admin list without refresh
- [ ] Call Next updates the customer's Now Serving, People Ahead and ETA instantly
- [ ] The next-in-line customer gets the "You're next" banner/toast
- [ ] The called customer gets the "It's your turn" state
- [ ] Customer cancel → admin list updates instantly
- [ ] Stop and restart the server → clients reconnect and re-sync

**UI**
- [ ] Loading skeletons, empty states and error states exist on every page
- [ ] No layout break at 375px, 768px, 1280px
- [ ] No console errors

---

## 17. Demo Video Script (2–3 minutes)

Use **two windows side by side**: admin dashboard (left) and a phone-sized customer window (right). Reset the queue before recording and pre-book 2–3 tokens so the queue isn't empty.

| Time | What to show / say |
|------|--------------------|
| 0:00–0:25 | Introduce QueueLess and the real-world problem (long, uncertain waits in clinics/salons) |
| 0:25–0:50 | The solution and target users: clinics first, salons and service centres next. Mention that staff only need a few taps (Call Next, Complete, Add Walk-in) and a QR poster at the counter |
| 0:50–1:40 | **Live demo:** (1) customer books a token → (2) it appears on admin → (3) admin clicks **Call Next** → (4) customer screen updates instantly → (5) position and wait time change → (6) admin clicks **Complete** |
| 1:40–2:15 | Tech and architecture: React + Tailwind, Node/Express, MongoDB as the source of truth, Socket.IO for live sync |
| 2:15–2:40 | Impact and future scope: SMS/WhatsApp alerts, multiple branches, analytics, AI-based wait prediction |

---

## 18. Deployment (optional, only after everything works)

- **Database:** MongoDB Atlas (free tier). Whitelist `0.0.0.0/0` for the demo.
- **Backend:** Render or Railway (needs a persistent Node server for WebSockets — do **not** use serverless functions for Socket.IO). Set `MONGODB_URI`, `CLIENT_ORIGIN`, `PORT`.
- **Frontend:** Vercel or Netlify. Set `VITE_API_URL` to the deployed backend URL. Add an SPA fallback rewrite to `index.html`.
- Verify CORS and the WebSocket connection from the deployed frontend before recording the video.

---

## 19. Definition of Done

- [ ] Customer can book a token and track it live
- [ ] Admin can Call Next, Complete, Skip and Cancel with correct backend validation
- [ ] Admin can add walk-ins and open/close online booking; QR poster works
- [ ] Wait time is always shown as an estimate, never a guarantee
- [ ] Position and ETA come from real server data
- [ ] Admin and customer screens sync in real time with no manual refresh
- [ ] Loading, empty and error states handled everywhere
- [ ] UI is consistent, responsive and polished
- [ ] README, seed script and `.env.example` files are present
- [ ] Demo video recorded

---

## 20. Instructions for the AI Coding Agent (Antigravity)

1. **Follow this README exactly.** Do not add features outside §3 "In scope."
2. **Do not add** authentication, payments, SMS, multi-tenant support, or extra pages.
3. **Build in the order of §15.** Keep the app runnable after every step.
4. The database is the source of truth. The client never invents queue numbers, positions or ETAs.
5. Put business logic in `server/src/services/queue.service.js`; keep controllers and routes thin.
6. Use the exact API paths, Socket.IO event names, status values and error format defined above.
7. Keep code simple and readable: no over-engineering, no unnecessary abstractions or dependencies.
8. After each major step, tell me what was built and how to verify it.
9. If something in this README is ambiguous, choose the simplest option that satisfies the demo workflow in §17 and note the assumption.

---

## 21. Security & Authentication

QueueLess enforces role-based access control (RBAC), security headers, and rate limiting to secure all administrative actions while preserving public customer booking and live token tracking without requiring logins.

### 21.1 Roles & Permissions

| Role | Description | Allowed Actions |
|------|-------------|-----------------|
| `owner` | Clinic/Shop Owner | Full access: View queues, Call Next, Complete, Skip, Cancel, Add Walk-in, Open/Close bookings, Reset queue |
| `staff` | Receptionist / Staff | Day-to-day operations: View queues, Call Next, Complete, Skip, Cancel, Add Walk-in |
| *(public)* | Customer / Waiting Room Display | Book token, view own token status & ETA, view public waiting room TV screen |

### 21.2 Protected vs. Public Endpoints

| Endpoint | Method | Access | Requirement |
|----------|--------|--------|-------------|
| `/api/auth/login` | POST | Public | Max 5 failed attempts per 15 min |
| `/api/auth/me` | GET | `owner`, `staff` | Bearer JWT |
| `/api/admin/queue/:serviceId` | GET | `owner`, `staff` | Bearer JWT |
| `/api/admin/queue/:serviceId/next` | POST | `owner`, `staff` | Bearer JWT |
| `/api/admin/queue/:serviceId/walkin` | POST | `owner`, `staff` | Bearer JWT |
| `/api/admin/tokens/:id/complete` | PATCH | `owner`, `staff` | Bearer JWT |
| `/api/admin/tokens/:id/skip` | PATCH | `owner`, `staff` | Bearer JWT |
| `/api/admin/tokens/:id/cancel` | PATCH | `owner`, `staff` | Bearer JWT |
| `/api/admin/services/:serviceId/open` | PATCH | `owner` only | Bearer JWT (`role: owner`) |
| `/api/admin/queue/:serviceId/reset` | POST | `owner` only | Bearer JWT (`role: owner`, disabled in prod unless `ENABLE_DEMO_RESET=true`) |
| `/api/services` | GET | Public | None |
| `/api/tokens` | POST | Public | None |
| `/api/tokens/:id` | GET | Public | Exposes own token + Now Serving code (no third-party PII) |
| `/api/tokens/:id/cancel` | PATCH | Public | Cancels own waiting token |

### 21.3 Security Environment Variables

```env
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=8h
OWNER_EMAIL=owner@queueless.com
OWNER_PASSWORD=OwnerSecurePass123!
STAFF_EMAIL=staff@queueless.com
STAFF_PASSWORD=StaffSecurePass123!
ENABLE_DEMO_RESET=true
```

### 21.4 How to Seed Users

Run the seed script from the server directory:
```bash
cd server && npm run seed
```
This reads credentials from the environment variables, hashes passwords with bcrypt (cost 10+), and provisions the default `owner` and `staff` accounts alongside the demo services.

---

## License

MIT