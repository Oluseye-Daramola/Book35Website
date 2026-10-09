# Book35 — Frontend

The web app for **Book35**, an appointment booking platform for small businesses.

- **Providers** sign up, manage their profile and availability, and handle bookings from a dashboard.
- **Customers** open a provider's booking link (e.g. `/book/glow-salon`), pick a free time slot, and book. No account is needed.

Built with **React 19**, **Vite**, and **React Router 7**.
It talks to the Book35 REST API in [`../Book35B`](../Book35B/README.md).

Live site: <https://book35website-1.onrender.com>

---

## Getting started

**Requirements:** Node.js 18+ and the [backend](../Book35B/README.md) running locally or deployed.

```bash
cd Book35F
npm install

# Create a .env file (see below), then:
npm run dev
```

Open <http://localhost:5173>.

### Environment variables

Create `Book35F/.env`. It is in `.gitignore`, so don't commit it.

```env
VITE_API_URL=http://localhost:5000/api
```

| Variable | What it's for |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API, **including `/api`**. Use your deployed backend URL + `/api` in production. |

Vite reads `.env` only when it starts, so restart `npm run dev` after changing it.

> **Running both apps locally?** The backend's CORS currently only allows the production site.
> To call your local backend from `http://localhost:5173`, temporarily set the CORS `origin` in
> `Book35B/app.js` to `http://localhost:5173` (see the backend README).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Pages and routes

| Route | Page | Who | What it does |
| --- | --- | --- | --- |
| `/` | `LandingPage` | Everyone | Introduces Book35 for providers and customers |
| `/signup` | `SignUp` | Providers | Create an account |
| `/login` | `Login` | Providers | Log in |
| `/provider` | `ProviderDashboard` | Providers (🔒 logged in) | The provider's dashboard (see below) |
| `/book/:slug` | `BookingPage` | Customers | A provider's public booking page |

`/provider` is wrapped in `ProtectedRoute`: visitors who aren't logged in are sent to `/login`.

### Provider dashboard

- **Bookings:** see all appointments, filter by status, search, and **confirm**, **cancel** or **complete** them. Confirming or cancelling emails the customer.
- **Availability:** add, edit and delete time windows (e.g. 10 Oct, 09:00–12:00, 30-minute slots), block or unblock individual slots, and copy the public booking link to share.
- **Edit profile:** business name, location, services offered, slogan, bio, phone and a profile photo (max 1 MB).

### Customer booking page

`/book/:slug` loads the provider's profile and their free slots for the next 14 days. The customer picks a slot, enters their **name**, **email** and the **purpose** of the visit (sent to the API as `notes`), and books. If someone else took the slot a moment earlier, the page shows an error and refreshes the slots. The booking starts as **pending** until the provider confirms it.

---

## Project structure

```text
Book35F/
├── public/                  # Favicons and app icons (served as-is)
├── src/
│   ├── assets/              # Logos and images imported in code
│   ├── components/          # Reusable UI pieces
│   │   ├── BookingForm.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Header.jsx
│   │   ├── Input.jsx
│   │   ├── Logo.jsx
│   │   ├── Modal.jsx
│   │   ├── NavBar.jsx
│   │   ├── TimeSlot.jsx
│   │   └── TopBar.jsx
│   ├── context/
│   │   └── AuthContext.jsx  # Logged-in provider + token, shared app-wide
│   ├── pages/               # One component per route (+ DesignDemo)
│   ├── styles/              # CSS files (see "Styling")
│   ├── utils/
│   │   ├── ProtectedRoute.jsx  # Redirects to /login if not logged in
│   │   └── formatters.js       # Date and time formatting helpers
│   ├── api.js               # Every call to the backend lives here
│   ├── App.jsx              # Routes
│   └── main.jsx             # Entry point
├── index.html
├── vite.config.js           # React + Tailwind plugins
└── package.json
```

---

## How it works

### Talking to the backend: `src/api.js`

All requests go through `apiRequest()`, which:

- prefixes the path with `VITE_API_URL`,
- sends and parses JSON,
- adds `Authorization: Bearer <token>` when a token is passed,
- throws an `Error` with the server's message (and `error.status`) when a request fails.

Each endpoint has a named helper, e.g. `loginProvider()`, `getProviderAppointments()`, `createPublicAppointment()`.
**Add new API calls here instead of calling `fetch` directly from components.**

### Login state: `src/context/AuthContext.jsx`

- After login or sign-up, the provider and their JWT are saved in `localStorage` (key: `appointmentBookingAuth`), so they stay logged in after a page refresh.
- Use the `useAuth()` hook to get `user`, `token`, `logout()` and so on.
- If the API returns `401` (token expired), the dashboard calls `logout()` and the user is sent back to `/login`.

---

## Styling

| File | Purpose |
| --- | --- |
| `styles/DesignToken.css` | All design variables: colours, spacing, fonts, shadows. **Use these instead of hard-coded values.** |
| `styles/Global.css` | CSS reset and default element styles |
| `styles/Components.css` | Styles for the shared components |
| `styles/*.css` (others) | Styles for each page |

- Shared components in `components/` are styled with **plain CSS**. Please don't restyle them with Tailwind.
- **Tailwind CSS 4** is available for page layouts and small utilities (`flex`, `gap-4`, `mt-5`, …).
- Icons come from [`react-icons`](https://react-icons.github.io/react-icons/).
- **Tip:** give fixed-size images or icons that sit in a flex row next to text `flex-shrink: 0` (Tailwind: `shrink-0`), otherwise long text can squash them.

### Design demo

`pages/DesignDemo.jsx` shows every component in all of its states. Its route is currently **turned off**.
To view it, uncomment the `DesignDemo` import and the `/designDemo` route in `App.jsx`, then visit <http://localhost:5173/designDemo>. Comment them out again before deploying.

---

## Team conventions

1. **Use named exports, not default exports:**
   ```jsx
   export const BookingPage = () => { … };      // ✅
   import { BookingPage } from './pages/BookingPage';
   ```
2. Put all backend calls in `api.js`.
3. Use the variables in `DesignToken.css` for colours and spacing.
4. Don't change the shared components' styling to Tailwind. Use Tailwind for page layout only.
5. Run `npm run lint` before pushing.

---

## Deployment

The frontend is deployed on **Render** as a Static Site.

| Setting | Value |
| --- | --- |
| Root directory | `Book35F` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |
| Environment | `VITE_API_URL` = deployed backend URL + `/api` |
| Redirects/Rewrites | Rewrite `/*` → `/index.html`, so routes like `/book/glow-salon` work when opened directly or refreshed |

`VITE_API_URL` is baked into the build, so **redeploy after changing it**.


