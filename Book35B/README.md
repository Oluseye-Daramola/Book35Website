# Book35 — Backend API

The REST API behind **Book35**, an appointment booking platform for small businesses
(salons, barbers, consultants, clinics, and so on).

- **Providers** (business owners) sign up, set up their profile, and publish the times they are available.
- **Customers** don't need an account. They open a provider's public booking page, pick a free time slot, and book it.
- The provider then **confirms**, **cancels**, or **completes** each booking, and the customer is notified by email.

Built with **Node.js**, **Express 5**, and **MongoDB (Mongoose)**.
The frontend lives in [`../Book35F`](../Book35F/README.md).

---

## Contents

- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Data models](#data-models)
- [API reference](#api-reference)
- [Emails](#emails)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Known limitations and next steps](#known-limitations-and-next-steps)

---

## How it works

```text
 PROVIDER (logged in)                          CUSTOMER (no account)
 ────────────────────                          ─────────────────────
 1. Register / log in  ──► gets a JWT
 2. Edit profile (services, slogan, photo)
 3. Create availability windows
    e.g. 10 Oct, 09:00–12:00, 30-min slots
                                               4. Opens /book/<provider-slug>
                                               5. Sees the free slots
                                               6. Books one  ──► status: pending
 7. Confirms it  ──► status: confirmed  ──────► confirmation email
    (or cancels  ──► status: cancelled  ──────► cancellation email)
 8. After the appointment: complete it ──► status: completed
```

**Appointment statuses**

```text
pending ──► confirmed ──► completed
   │            │
   └────────────┴──► cancelled
```

- Only a `pending` appointment can be confirmed.
- Only a `confirmed` appointment can be completed, and only once its start time has passed.
- Any appointment that isn't already `completed` or `cancelled` can be cancelled.

**How double-booking is prevented**

When a customer books, the server checks that the requested time:

1. falls inside one of the provider's availability windows,
2. lines up exactly with one of that window's slots (e.g. 09:00, 09:30, 10:00 for 30-minute slots),
3. hasn't been blocked by the provider, and
4. doesn't overlap another `pending` or `confirmed` appointment.

If the slot was taken a moment earlier, the API responds with `409 Conflict`.

---

## Tech stack

| Area       | Choice                                                               |
| ---------- | -------------------------------------------------------------------- |
| Runtime    | Node.js 18+ (uses the built-in `fetch`)                              |
| Framework  | Express 5                                                            |
| Database   | MongoDB with Mongoose                                                |
| Auth       | JSON Web Tokens (`jsonwebtoken`), passwords hashed with `bcryptjs`   |
| Validation | Joi schemas + simple custom validators                               |
| Security   | Helmet, CORS, hpp, express-rate-limit                                |
| Email      | [Brevo](https://www.brevo.com/) HTTP API                             |
| Logging    | Morgan (HTTP requests) + a small console logger (`Config/logger.js`) |

---

## Getting started

**Requirements:** Node.js 18 or newer, a MongoDB database (e.g. a free MongoDB Atlas cluster), and a Brevo account if you want emails to send.

```bash
# 1. Clone the repository
git clone https://github.com/Oluseye-Daramola/Book35Website.git
cd Book35Website/Book35B

# 2. Install dependencies
npm install

# 3. Create a .env file (see "Environment variables" below)

# 4. Start the server
npm run dev     # development, restarts on file changes (nodemon)
npm start       # production
```

When it's running you'll see:

```text
MongoDB connected: <your-cluster-host>
Server running on http://localhost:5000
```

Check it's up by opening <http://localhost:5000/api/health>.

> **Running with the frontend locally?** CORS currently only allows the production frontend
> (`https://book35website-1.onrender.com`). To use the frontend on `http://localhost:5173`, temporarily
> change the `origin` in [`app.js`](app.js) to `http://localhost:5173`, and don't commit that change.

---

## Environment variables

Create a file called `.env` in the `Book35B` folder. It is already in `.gitignore`, so **never commit it**.

```env
# Required
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=a-long-random-secret-string

# Optional
PORT=5000
JWT_EXPIRES_IN=7d

# Emails (required for emails to send)
BREVO_API_KEY=xkeysib-...
SENDER_EMAIL=your-verified-sender@example.com
SENDER_NAME=Book35
APP_TIMEZONE=Africa/Lagos
```

| Variable         | Required?  | Default               | What it's for                                                                                                 |
| ---------------- | ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `MONGO_URI`      | **Yes**    | –                     | MongoDB connection string. The server won't start without it.                                                 |
| `JWT_SECRET`     | **Yes**    | –                     | Secret used to sign login tokens. The server won't start without it.                                          |
| `PORT`           | No         | `5000`                | Port the server listens on. Render sets this automatically.                                                   |
| `JWT_EXPIRES_IN` | No         | `7d`                  | How long a login lasts (e.g. `1h`, `7d`).                                                                     |
| `BREVO_API_KEY`  | For emails | –                     | Brevo → _SMTP & API_ → _API Keys_.                                                                            |
| `SENDER_EMAIL`   | For emails | –                     | The "from" address. It must be a **verified sender** in Brevo.                                                |
| `SENDER_NAME`    | No         | `Appointment Booking` | Name shown as the email sender.                                                                               |
| `APP_TIMEZONE`   | No         | `Africa/Lagos`        | Timezone used to show appointment times in emails.                                                            |
| `CLIENT_URL`     | No         | –                     | Frontend URL. Read in `Config/env.js` but not used yet (see [next steps](#known-limitations-and-next-steps)). |

---

## Project structure

```text
Book35B/
├── Config/
│   ├── db.js                 # Connects to MongoDB
│   ├── env.js                # Loads .env and checks required variables
│   └── logger.js             # Small timestamped console logger
├── Controllers/              # What happens when a request arrives
│   ├── authController.js         # register, login
│   ├── providerController.js     # view / edit own profile
│   ├── serviceController.js      # priced services (CRUD)
│   ├── availabilityController.js # availability windows and slots
│   ├── appointmentController.js  # provider's appointments: confirm / cancel / complete
│   └── publicController.js       # public booking page + customer booking
├── Middleware/
│   ├── auth.js               # Checks the "Authorization: Bearer <token>" header
│   ├── errorHandler.js       # Turns errors into consistent JSON responses
│   ├── rateLimiter.js        # Request limits per IP
│   └── validate.js           # Runs Joi schemas against the request body
├── Models/                   # Mongoose schemas (database shape)
│   ├── Provider.js
│   ├── Service.js
│   ├── Availability.js
│   └── Appointment.js
├── Routes/                   # URL → middleware → controller
│   ├── authRoutes.js         # /api/auth
│   ├── providerRoutes.js     # /api/providers
│   ├── serviceRoutes.js      # /api/services
│   ├── availabilityRoutes.js # /api/availability
│   ├── appointmentRoutes.js  # /api/appointments
│   └── publicRoutes.js       # /api/public
├── Services/                 # Reusable business logic
│   ├── appointmentService.js
│   ├── authService.js
│   ├── availabilityService.js
│   └── emailService.js       # Sends emails through Brevo
├── Utils/
│   ├── apiError.js           # Error class with an HTTP status code
│   ├── generateSlots.js      # Splits availability windows into bookable slots
│   ├── generateToken.js      # Creates JWTs
│   └── timeUtils.js          # Date helpers
├── Validations/              # Request validation rules, one file per resource
├── Tests/                    # testEmail.js + placeholders for future tests
├── app.js                    # Builds the Express app: middleware, routes, error handling
├── server.js                 # Entry point: loads env, connects to MongoDB, starts the server
└── package.json
```

**How a request flows through the code**

```text
Request ─► app.js (helmet, cors, json, hpp, morgan)
        ─► Routes/   (which URL?)
        ─► Middleware/ (rate limit → auth → validation)
        ─► Controllers/ (do the work, using Models/ and Services/)
        ─► JSON response
        (any error ─► Middleware/errorHandler.js)
```

---

## Data models

### Provider

A business owner who uses the dashboard.

| Field                                | Notes                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `name`, `businessName`               | Required                                                                                                               |
| `email`                              | Required, unique, used to log in                                                                                       |
| `password`                           | Hashed with bcrypt and never returned in responses                                                                     |
| `slug`                               | Unique, generated from `businessName` (e.g. `glow-salon`, or `glow-salon-2` if taken). Used in the public booking URL. |
| `phone`, `location`, `slogan`, `bio` | Optional profile details                                                                                               |
| `services`                           | List of service names offered, e.g. `["Haircut", "Braids"]`. Customers pick one of these when booking.                 |
| `avatar`                             | Profile photo as a base64 data URL (max ~1 MB image)                                                                   |
| `isActive`                           | Deactivated providers can't log in and don't appear publicly                                                           |

### Availability

A **one-off block of time on a specific date** (not a weekly repeating schedule).

| Field                  | Notes                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `startTime`, `endTime` | Full date-times, e.g. `2026-10-10T09:00` to `2026-10-10T12:00`. Windows can't overlap each other. |
| `slotDuration`         | Minutes per appointment: `10`, `15`, `20`, `30`, `45` or `60` (default `30`)                      |
| `blockedSlots`         | Start times of individual slots the provider has switched off                                     |

### Appointment

A customer's booking.

| Field                                            | Notes                                                           |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `provider`                                       | The provider being booked                                       |
| `serviceName`                                    | Optional, one of the provider's `services`                      |
| `customerName`, `customerEmail`, `customerPhone` | Customer details (phone optional)                               |
| `startTime`, `endTime`                           | `endTime` is set by the server from the window's `slotDuration` |
| `status`                                         | `pending` · `confirmed` · `cancelled` · `completed`             |
| `notes`, `completedAt`                           | Optional                                                        |

### Service

A priced service with a duration (`name`, `description`, `durationMinutes`, `priceMinorUnits`, `currency`, `isActive`).
Prices are stored in the smallest currency unit (e.g. kobo or cents), so `500000` = ₦5,000.00.

> The current frontend uses the simpler `services` list on the Provider instead. The `/api/services`
> endpoints are ready for when priced services are added to the UI.

---

## API reference

**Base URL:** `http://localhost:5000/api` locally, or your Render backend URL + `/api` in production.

**Authentication:** routes marked 🔒 need the token from register/login in this header:

```http
Authorization: Bearer <token>
```

**Response format**

```jsonc
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "Validation failed", "errors": ["A valid email is required"] }
```

| Status | Meaning                                                             |
| ------ | ------------------------------------------------------------------- |
| `400`  | Invalid input                                                       |
| `401`  | Missing/invalid token, or wrong email or password                   |
| `403`  | Not your resource, or account deactivated                           |
| `404`  | Not found                                                           |
| `409`  | Conflict (slot already booked, overlapping window, duplicate email) |
| `429`  | Too many requests (rate limit)                                      |
| `500`  | Server error                                                        |

### Overview

| Method | Endpoint                           | Auth | Description                                   |
| ------ | ---------------------------------- | ---- | --------------------------------------------- |
| GET    | `/health`                          | –    | Check the API is running                      |
| POST   | `/auth/register`                   | –    | Create a provider account                     |
| POST   | `/auth/login`                      | –    | Log in and get a token                        |
| GET    | `/providers/me`                    | 🔒   | Get your profile                              |
| PUT    | `/providers/me`                    | 🔒   | Update your profile                           |
| GET    | `/availability`                    | 🔒   | List your windows (with their slots)          |
| POST   | `/availability`                    | 🔒   | Create a window                               |
| PUT    | `/availability/:id`                | 🔒   | Change a window                               |
| DELETE | `/availability/:id`                | 🔒   | Delete a window                               |
| GET    | `/availability/:id/slots`          | 🔒   | Every slot in a window and its status         |
| PATCH  | `/availability/:id/slots`          | 🔒   | Block or unblock one slot                     |
| GET    | `/appointments`                    | 🔒   | List your appointments (soonest first)        |
| GET    | `/appointments/:id`                | 🔒   | Get one appointment                           |
| PATCH  | `/appointments/:id/confirm`        | 🔒   | `pending` → `confirmed` (emails the customer) |
| PATCH  | `/appointments/:id/cancel`         | 🔒   | → `cancelled` (emails the customer)           |
| PATCH  | `/appointments/:id/complete`       | 🔒   | `confirmed` → `completed`                     |
| GET    | `/services`                        | 🔒   | List your priced services                     |
| POST   | `/services`                        | 🔒   | Create a service                              |
| PUT    | `/services/:id`                    | 🔒   | Update a service                              |
| DELETE | `/services/:id`                    | 🔒   | Delete a service                              |
| GET    | `/public/providers/:slug`          | –    | Public provider profile                       |
| GET    | `/public/providers/:slug/services` | –    | A provider's active priced services           |
| GET    | `/public/providers/:slug/slots`    | –    | Free slots to book                            |
| POST   | `/public/appointments`             | –    | Book an appointment (customer)                |

### Examples

#### Register — `POST /api/auth/register`

```json
{
  "name": "Ada Obi",
  "businessName": "Glow Salon",
  "email": "ada@example.com",
  "password": "password123",
  "phone": "+2348012345678",
  "bio": "Hair and beauty in Lekki"
}
```

`name`, `businessName`, `email` and `password` (minimum 8 characters) are required. Returns `201`:

```json
{
  "success": true,
  "data": {
    "provider": {
      "id": "…",
      "name": "Ada Obi",
      "businessName": "Glow Salon",
      "slug": "glow-salon",
      "email": "ada@example.com"
    },
    "token": "eyJhbGciOi…"
  }
}
```

A welcome email is sent in the background. If it fails, sign-up still succeeds.

#### Log in — `POST /api/auth/login`

```json
{ "email": "ada@example.com", "password": "password123" }
```

Returns the same shape as register.

#### Update profile — `PUT /api/providers/me` 🔒

Send only the fields you want to change:

```json
{
  "location": "Lekki, Lagos",
  "services": ["Haircut", "Braids", "Manicure"],
  "slogan": "Look good, feel good",
  "avatar": "data:image/jpeg;base64,…"
}
```

Updatable fields: `name`, `businessName`, `location`, `services`, `slogan`, `avatar`, `bio`, `phone`.

#### Create availability — `POST /api/availability` 🔒

```json
{
  "startTime": "2026-10-10T09:00:00+01:00",
  "endTime": "2026-10-10T12:00:00+01:00",
  "slotDuration": 30
}
```

This creates six 30-minute slots: 09:00, 09:30 … 11:30. Returns `409` if it overlaps one of your existing windows.

#### Block or unblock a slot — `PATCH /api/availability/:id/slots` 🔒

```json
{ "startTime": "2026-10-10T10:00:00+01:00", "cancelled": true }
```

Use `"cancelled": false` to make the slot bookable again. You can't block a slot a customer has already booked (`409`). Cancel the booking first.

#### Get free slots — `GET /api/public/providers/:slug/slots`

Optional query parameters `from` and `to` (ISO dates). Defaults to the next 14 days, maximum range 31 days.

```http
GET /api/public/providers/glow-salon/slots?from=2026-10-10T00:00:00Z&to=2026-10-17T00:00:00Z
```

Only future slots that aren't booked or blocked are returned.

#### Book an appointment — `POST /api/public/appointments`

```json
{
  "provider": "665f1c2e9b1e8a3d4c5b6a71",
  "serviceName": "Haircut",
  "customerName": "Tolu Bello",
  "customerEmail": "tolu@example.com",
  "customerPhone": "+2348098765432",
  "startTime": "2026-10-10T09:30:00+01:00",
  "notes": "First visit"
}
```

- `provider` is the provider's `_id` (from `GET /public/providers/:slug`).
- `startTime` must be one of the slots returned by the slots endpoint, in the future.
- `serviceName`, `customerPhone` and `notes` are optional. If `serviceName` is given, it must be one of the provider's `services`.
- Don't send `endTime`. The server works it out.

Returns `201` with the new appointment (`status: "pending"`), or `409` if someone else just took the slot.

---

## Emails

Emails are sent by [`Services/emailService.js`](Services/emailService.js) through **Brevo's HTTP API**.
HTTP is used instead of SMTP because Render's free tier blocks SMTP ports.

| Email             | Sent when                                                               | To       |
| ----------------- | ----------------------------------------------------------------------- | -------- |
| Welcome           | A provider registers                                                    | Provider |
| Booking confirmed | The provider confirms an appointment                                    | Customer |
| Booking cancelled | The provider cancels an appointment                                     | Customer |
| Reminder          | _Not triggered yet:_ `sendReminder()` exists for a future scheduled job | Customer |

If an email fails, it is logged and the action (sign-up, confirm, cancel) still succeeds.

**Brevo setup checklist**

1. Create an API key: Brevo → _SMTP & API_ → _API Keys_ → put it in `BREVO_API_KEY`.
2. Verify your sender address: Brevo → _Senders, Domains & Dedicated IPs_ → put it in `SENDER_EMAIL`.
3. **Turn off IP blocking:** Brevo → _Security_ → [_Authorised IPs_](https://app.brevo.com/security/authorised_ips).
   Otherwise Brevo rejects requests from new IP addresses with `401 unrecognised IP address`. Home internet and Render both change IPs often, so allowing a single IP is not enough.
4. Send yourself a test email (edit the recipient in the file first):

   ```bash
   node Tests/testEmail.js
   # Sent! { success: true, messageId: '<…@smtp-relay.mailin.fr>' }
   ```

The free Brevo plan allows **300 emails per day**. New emails sometimes land in **Spam** or **Promotions**.

---

## Security

- Passwords are hashed with **bcrypt** and never returned by the API.
- Protected routes need a valid **JWT**, and providers can only see and change **their own** availability and appointments.
- Request bodies are validated before they reach the controllers.
- **Helmet** sets secure HTTP headers. **hpp** blocks repeated query parameters. **CORS** only allows the frontend's origin.
- Request bodies are limited to **2 MB** (enough for a 1 MB profile photo).
- Secrets live in `.env`, which is never committed.
- **Rate limits** (per IP):

| Route                       | Limit                |
| --------------------------- | -------------------- |
| `POST /auth/login`          | 10 requests / 15 min |
| `POST /auth/register`       | 5 requests / hour    |
| `POST /public/appointments` | 30 requests / 5 min  |

---

## Testing

There is no automated test suite yet. `npm test` is still the npm placeholder, and the files in `Tests/` (except `testEmail.js`) are empty placeholders.

For now you can test manually:

- **Emails:** `node Tests/testEmail.js` (see [Emails](#emails)).
- **API:** use Postman, Insomnia, or the VS Code _Thunder Client_ extension. A typical run-through:
  1. `POST /api/auth/register` → copy the `token`
  2. `PUT /api/providers/me` with some `services`
  3. `POST /api/availability` for a future date
  4. `GET /api/public/providers/<slug>/slots`
  5. `POST /api/public/appointments` using one of those slots
  6. `GET /api/appointments` → `PATCH /api/appointments/<id>/confirm`

---

## Deployment

The backend is deployed on **Render** as a Web Service.

| Setting        | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Root directory | `Book35B`                                                                                       |
| Build command  | `npm install`                                                                                   |
| Start command  | `npm start`                                                                                     |
| Environment    | Add the variables from [Environment variables](#environment-variables) (Render provides `PORT`) |

The production frontend (`https://book35website-1.onrender.com`) is the only origin CORS allows.
If the frontend URL changes, update `origin` in [`app.js`](app.js).

---

## Known limitations and next steps

- **CORS origin is hard-coded** in `app.js`. It should come from `CLIENT_URL` so local and production work without editing code.
- **No automated tests yet.** Add Jest + Supertest and fill in the `Tests/` files.
- **Reminder emails** need a scheduled job (e.g. a cron job) to call `sendReminder()`.
- **Installed but not enabled:** `express-mongo-sanitize` and `compression` are installed but not used in `app.js`, and `generalLimiter` is defined in `rateLimiter.js` but not applied.
- **Debug routes:** each router has a `GET /test` route left over from development. Remove these before a final release.
- **Not built yet:** customer rescheduling, priced services in the UI, SMS notifications, payments, calendar sync.

---

## License

Created for learning and development purposes.
