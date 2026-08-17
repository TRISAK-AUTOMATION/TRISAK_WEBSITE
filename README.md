# TRISAK GROUP — Corporate Website

Full-stack implementation: **React (Vite)** front end + **Node.js / Express** API + **PostgreSQL** database.

Structure follows the front-end spec: Home, History, Products, Automation Solution, Contacts — shared Header/Footer, one file per page.

## Folder layout

```
trisak-website/
├── client/                     # React front end (Vite)
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # routes
│       ├── styles/
│       │   └── index.css       # design tokens + global styles
│       ├── api/
│       │   └── client.js       # fetch wrapper to the API
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── Footer.jsx
│       │   ├── SectionLabel.jsx
│       │   └── SignalLine.jsx  # signature schematic-line motif
│       └── pages/
│           ├── Home.jsx
│           ├── History.jsx
│           ├── Products.jsx
│           ├── AutomationSolution.jsx
│           └── Contacts.jsx
│
├── server/                     # Express API
│   ├── src/
│   │   ├── index.js            # app entry
│   │   ├── config/
│   │   │   └── db.js           # PostgreSQL pool
│   │   ├── controllers/
│   │   │   ├── productsController.js
│   │   │   └── contactController.js
│   │   └── routes/
│   │       ├── products.js
│   │       └── contact.js
│   ├── schema.sql              # DB schema + seed data
│   └── .env.example
│
└── README.md
```

## Design direction

Industrial / technology / premium / clean, per the brief. Dark steel background, safety-orange signal accent for calls to action, a cyan "signal" accent for data/tech moments. Condensed display type for headings (engineering nameplate feel), clean grotesque for body copy, mono face for specs/labels. The signature element is an animated **signal line** — a schematic wiring trace that connects sections, echoing the PLC/control-loop world TRISAK operates in and the "Engineering Process" flow from the brief.

## Setup

### 1. Database

```bash
createdb trisak
psql -d trisak -f server/schema.sql
```

### 2. API server

```bash
cd server
cp .env.example .env      # set DATABASE_URL, PORT
npm install
npm run dev                # http://localhost:4000
```

### 3. Client

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

The client calls the API at `VITE_API_URL` (defaults to `http://localhost:4000/api`) — set this in `client/.env` if different.

## Product catalog structure

The catalog follows a 5-level drill-down: **Products Overview → Brand → Category → Series → Product Detail**, matching the flow OMRON / PLC & HMI / NX Series / NX1P2. A product that doesn't belong to a series is still reachable — it just skips the series level in the URL.

| Page | Route | Component |
|---|---|---|
| 01 Products Overview | `/products` | `pages/products/ProductsOverview.jsx` |
| 02 Brand | `/products/:brandSlug` | `pages/products/BrandPage.jsx` — auto-forwards into the brand's first category (see below) |
| 03 Category | `/products/:brandSlug/:categorySlug` | `pages/products/CategoryPage.jsx` — sidebar of categories + series cards |
| 04 Series | `/products/:brandSlug/:categorySlug/:seriesSlug` | `pages/products/SeriesPage.jsx` (via `BrandCategoryChild.jsx` resolver) |
| 05 Product Detail | `/products/:brandSlug/:categorySlug/:seriesSlug/:productSlug` (or without the series segment) | `pages/products/ProductDetail.jsx` |

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/brands` | List authorized brands |
| GET | `/api/brands/:brandSlug` | One brand |
| GET | `/api/brands/:brandSlug/categories` | Categories that have products under that brand |
| GET | `/api/categories` | List all categories |
| GET | `/api/categories/:categorySlug` | One category |
| GET | `/api/series?brand=&category=` | List series, optionally filtered |
| GET | `/api/series/:brandSlug/:categorySlug/:seriesSlug` | One series |
| GET | `/api/products?brand=&category=&series=&q=` | List products, filterable |
| GET | `/api/products/featured` | Featured products for the overview page |
| GET | `/api/products/detail/:slug` | Full product detail — images, specs, documents, related products |
| GET | `/api/solutions` | The 4 automation-solution pillars |
| GET | `/api/industries` | Industries served |
| POST | `/api/contact` | Submit a contact / inquiry form |

### Admin (protected)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/admin/login` | `{ password }` → `{ token }`. Password comes from `ADMIN_PASSWORD` in `server/.env` |
| POST | `/api/admin/logout` | Invalidate the current token |
| GET/POST | `/api/admin/brands`, `/api/admin/categories`, `/api/admin/series` | Lightweight taxonomy management |
| POST | `/api/admin/upload` | Upload a product image (`multipart/form-data`, field name `image`) → `{ url, filename }` |
| GET | `/api/admin/products` | List all products (admin view) |
| GET | `/api/admin/products/:id` | Full product record for editing |
| POST | `/api/admin/products` | Create a product (with images/specs/documents/related in one payload) |
| PUT | `/api/admin/products/:id` | Update a product (replaces all child rows) |
| DELETE | `/api/admin/products/:id` | Delete a product |

All admin routes except `/login` require `Authorization: Bearer <token>`. Sessions are mirrored to `server/.sessions.json` (gitignored) so they survive a dev-server restart (`npm run dev` uses `node --watch`, which restarts on every file save) — but there's still no multi-instance support. If you ever see an unexpected "Unauthorized" in the admin UI, it now auto-clears the stale token and redirects to `/admin/login` instead of getting stuck; just log in again.

**Image uploads:** the admin form uploads files directly (drag-and-drop style click-to-upload) instead of asking for a URL. Files land in `server/uploads/` on disk and are served at `http://<host>:<port>/uploads/<filename>`. Accepted types: jpg, png, webp, gif, svg — max 5 MB. The `server/uploads/` folder is gitignored (except a `.gitkeep` placeholder) so uploaded files aren't committed to source control; back that folder up separately if you deploy this for real, since nothing else persists those files.

**Admin UI:** `/admin/login` → `/admin/products` (list, edit, delete) → `/admin/products/new` or `/admin/products/:id/edit` (full form: basics, features, images, specs, documents, related products) → **`/admin/catalog`** (add new Brands, Categories, and Series — this is where you create a Series before it can be picked in the product form's Series dropdown). The admin UI is English-only by design (internal tool); the public-facing pages support the EN/TH toggle described below.

## Category page layout (sidebar + series cards)

Clicking a "Browse by Brand" tile skips straight to that brand's first category — the Category page shows a left sidebar listing every category that has products under the current brand (click one to switch), and the main area shows a card per series (name, tagline, and up to 5 of its products as direct links, with a "View all" link to the full series page if there are more). Products that don't belong to any series get their own simple card in the same grid. This mirrors the reference layout you shared, restyled in the site's own white/navy theme instead of copying the source site's look.

All seed content in the database comes from the structure given in the brief (brands: OMRON, YASKAWA, NITTO; categories: PLC & HMI, Inverter, Servo & Motion, Industrial Robot, Sensors, Safety, I/O & Industrial PC, Electrical Components, Enclosures; solutions: HMI & PLC, Drive & Motion, Robotic, Smart Factory), plus a demo OMRON / PLC & HMI / NX Series product line to exercise the full catalog flow end-to-end.

## Language toggle (EN / TH)

The site ships with an EN/TH switch in the header. UI copy lives in `client/src/i18n/translations.js` — edit the `th:` block there to change Thai wording. Product/brand/category/series data pulled from the database is English-only (no translation columns in the schema yet); ask if you want `_th` columns added.
