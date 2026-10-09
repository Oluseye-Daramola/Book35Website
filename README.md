# Book35

**Book35** is an appointment booking platform for small businesses such as salons, barbers, consultants and clinics.

Business owners (**providers**) publish when they're free. Their customers book a slot from a simple public link,
with no account or app needed. The provider confirms the booking, and the customer gets an email.

🌐 **Live site:** <https://book35website-1.onrender.com>

---

## What it does

**For providers**

- Sign up and set up a business profile: services offered, location, slogan, bio and photo
- Add availability windows (e.g. _Saturday 10 Oct, 09:00–12:00, 30-minute slots_) and block individual slots
- Share a personal booking link, e.g. `https://book35website-1.onrender.com/book/glow-salon`
- Manage bookings from a dashboard: confirm, cancel, mark as completed, filter and search

**For customers**

- Open the provider's link, see the free slots for the next two weeks, and book in under a minute
- Get an email when the booking is confirmed or cancelled

**Behind the scenes**

- No double-bookings: every booking is checked against the provider's availability and existing appointments
- Secure logins with hashed passwords and JWTs, input validation, and rate limiting

---

## How it fits together

```text
┌──────────────────────┐   HTTPS + JSON    ┌──────────────────────┐   Mongoose   ┌───────────┐
│  Frontend (Book35F)  │ ────────────────► │  Backend (Book35B)   │ ───────────► │  MongoDB  │
│  React + Vite        │ ◄──────────────── │  Node.js + Express   │ ◄─────────── │           │
│  Render static site  │   JWT in header   │  Render web service  │              └───────────┘
└──────────────────────┘                   └──────────┬───────────┘
                                                      │ HTTPS
                                                      ▼
                                             ┌──────────────────┐
                                             │  Brevo (emails)  │
                                             └──────────────────┘
```

| Folder                | What it is                                                                     | Tech                                                  | Docs                                 |
| --------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------------------ |
| [`Book35F/`](Book35F) | Frontend: landing page, sign-up/login, provider dashboard, public booking page | React 19, Vite, React Router 7, Tailwind CSS 4        | [Frontend README](Book35F/README.md) |
| [`Book35B/`](Book35B) | Backend: REST API, authentication, booking logic, emails                       | Node.js, Express 5, MongoDB/Mongoose, JWT, Joi, Brevo | [Backend README](Book35B/README.md)  |

---

## Quick start (run it locally)

**You'll need:** Node.js 18+, a MongoDB connection string (e.g. a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster), and optionally a [Brevo](https://www.brevo.com/) account for emails.

### 1. Clone

```bash
git clone https://github.com/Oluseye-Daramola/Book35Website.git
cd Book35Website
```

### 2. Start the backend

```bash
cd Book35B
npm install
```

Create `Book35B/.env`:

```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=any-long-random-string
# Optional, for emails:
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=your-verified-sender@example.com
```

```bash
npm run dev       # → http://localhost:5000  (check http://localhost:5000/api/health)
```

### 3. Start the frontend (in a second terminal)

```bash
cd Book35F
npm install
```

Create `Book35F/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev       # → http://localhost:5173
```

> ⚠️ **One local-only change is needed:** the backend's CORS only allows the live site. To let
> `http://localhost:5173` call your local backend, temporarily set the CORS `origin` in
> [`Book35B/app.js`](Book35B/app.js) to `http://localhost:5173`. Don't commit that change.

### 4. Try it out

1. Go to <http://localhost:5173/signup> and create a provider account.
2. In the dashboard, add your services in **Edit profile**, then add an availability window for a future date.
3. Copy your booking link and open it in a private/incognito window, as a customer would.
4. Book a slot, then go back to the dashboard and **confirm** it.

---

## Deployment

Both apps are hosted on [Render](https://render.com):

| App      | Render type | Root directory | Build                          | Start / publish |
| -------- | ----------- | -------------- | ------------------------------ | --------------- |
| Backend  | Web Service | `Book35B`      | `npm install`                  | `npm start`     |
| Frontend | Static Site | `Book35F`      | `npm install && npm run build` | publish `dist`  |

- **Backend:** set the environment variables listed in the backend README.
- **Frontend:** set `VITE_API_URL` to the backend URL + `/api`, and add a rewrite rule `/*` → `/index.html`.

See the [backend](Book35B/README.md#deployment) and [frontend](Book35F/README.md#deployment) READMEs for details.

---

## Repository layout

```text
Book35Website/
├── Book35B/          # Backend API  → see Book35B/README.md
├── Book35F/          # Frontend app → see Book35F/README.md
└── README.md         # You are here
```

Each app has its own `package.json`, `node_modules` and `.env`. Run `npm` commands inside the app's folder, not the root.

---

## Project status

**Working:** provider accounts, profile editing, availability and slot blocking, public booking pages, booking management, and email notifications (welcome, confirmation, cancellation).

**Planned / next steps:**

- Automated tests (backend: Jest + Supertest)
- Read the CORS origin from an environment variable instead of hard-coding it
- Scheduled reminder emails
- Let customers choose a service when booking, plus priced services in the UI
- Rescheduling, SMS notifications, payments, calendar sync

---

## Authors

Built by **Capstone Group 35** as part of TS Academy.
Oluseye Daramola - Group Leader
Ibrahim Habeeb
Wusu Oluwadamilola
Olaiya Michael
Oguntade Sileola Marvellous
Tayo Olagunju
Emem Sampson
Oyewole Stephen Olamide

## License

Created for learning and development purposes.
