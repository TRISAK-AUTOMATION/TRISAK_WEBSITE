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
| GET | `/api/admin/brands`, `/api/admin/categories`, `/api/admin/series` | List all (active + inactive) |
| GET | `/api/admin/brands/:id`, `/api/admin/categories/:id`, `/api/admin/series/:id` | Fetch one, for prefilling an edit form |
| POST/PUT | same paths | Create / update. Series accepts `imageUrl`; all three accept `isActive` |
| PATCH | `.../:id/status` | `{ isActive }` — quick on/off toggle (the green dot in the list page) |
| POST | `.../:id/reorder` | `{ direction: "up" \| "down" }` — swaps `sort_order` with the neighboring row. Series reorders within its own brand+category; brands/categories reorder globally. No-ops quietly at the first/last position. |
| DELETE | same paths | Blocked with a 409 and a clear message if any product still references it |
| POST | `/api/admin/upload` | Upload a product image (`multipart/form-data`, field name `image`) → `{ url, filename }` |
| GET | `/api/admin/products` | List all products (admin view) |
| GET | `/api/admin/products/:id` | Full product record for editing |
| POST | `/api/admin/products` | Create a product (with images/specs/documents/related in one payload) |
| PUT | `/api/admin/products/:id` | Update a product (replaces all child rows) |
| DELETE | `/api/admin/products/:id` | Delete a product |

All admin routes except `/login` require `Authorization: Bearer <token>`. Sessions are mirrored to `server/.sessions.json` (gitignored) so they survive a dev-server restart (`npm run dev` uses `node --watch`, which restarts on every file save) — but there's still no multi-instance support. If you ever see an unexpected "Unauthorized" in the admin UI, it now auto-clears the stale token and redirects to `/admin/login` instead of getting stuck; just log in again.

**Image uploads:** the admin form uploads files directly (drag-and-drop style click-to-upload) instead of asking for a URL. Files land in `server/uploads/` on disk and are served at `http://<host>:<port>/uploads/<filename>`. Accepted types: jpg, png, webp, gif, svg — max 5 MB. The `server/uploads/` folder is gitignored (except a `.gitkeep` placeholder) so uploaded files aren't committed to source control; back that folder up separately if you deploy this for real, since nothing else persists those files.

**"Active" status:** a brand/category/series toggled off (`is_active = false`) disappears from every public endpoint immediately — it just won't show anywhere on the live site — while staying visible (and re-enable-able) in the admin list. Products don't have their own status toggle; a product effectively disappears if its brand, category, or series is turned off.

## Admin UI (CMS-style, matches the reference screenshots)

`/admin/login` → `/admin` (dashboard with counts) → sidebar navigation:

- **หน้าแรก (Home)** → `/admin/home` — edit the Home page's Hero text, the 3 "Our Strength" blocks, and the closing CTA. This one has a **real, working** ภาษาไทย/English tab switch (unlike the display-only language selector elsewhere — see below): each tab shows that language's fields, and Save writes both languages at once. Backed by a `home_content` table with an `_en`/`_th` column per field; if you run this against an existing database, apply `migrations/003_add_home_content.sql` first.
- **สินค้า (Product)**
  - **แบรนด์ (Brand)** → `/admin/brands` — list with image thumbnail, sort arrows, status dot, edit/delete
  - **หมวดหมู่ (Category)** → `/admin/categories` — same shape, plus a category image
  - **ซีรีย์ (Series)** → `/admin/series` — same shape, plus Brand/Category columns; this is where you create a new Series (there's also a "+ add new" shortcut right next to the Series dropdown on the product form)
  - **รายการ (List)** → `/admin/products` — the full product list
- **การตั้งค่า (Settings)**
  - **เว็บไซต์ (Website)** → `/admin/settings/website` — logo, favicon, contact details
  - **ป๊อปอัพ (Pop-up)** → `/admin/popups` — a single image-only welcome pop-up for the Home page: upload/replace/delete the image and toggle it on/off, no text, buttons, or links. Shows on *every* Home page load — refresh, navigating away and back, or a brand-new browser session — as long as it's enabled and has an image; there's deliberately no `localStorage`/`sessionStorage`/cookie tracking whether it's been seen, so closing it (× button) only dismisses that one view. Backed by a single-row `popup_settings` table (image_url, is_active); if you run this against an existing database, apply `migrations/014_simplify_popup.sql` (drops the earlier multi-popup `popups` table from `013_add_popups.sql`, if you'd applied that one — the two migrations supersede each other, so only 014 is needed on a fresh setup).

Each list page has search, a "+ เพิ่ม" (Add) button, and a paginated table (`ลำดับ` order / `รูปภาพ` image / `ชื่อ` name / `จัดเรียง` reorder arrows / `อัพเดท` last-updated / `จัดการ` actions — green dot to toggle visibility, edit, delete).

Each edit page (Brand/Category/Series/Product) has two tabs (**ข้อมูล** data / **อัพโหลด** upload-image), a sticky ยกเลิก/บันทึก (Cancel/Save) bar, and a right-hand sidebar panel for Language (display-only on these — Brand/Category/Series/Product names are still single-value, not per-language; only the Home editor above is genuinely bilingual so far), Brand/Category selects (Series only), and the Status toggle.

The admin UI is Thai-labeled and English-content by design — the *interface chrome* (buttons, table headers, breadcrumbs) matches the reference screenshots in Thai, but brand/category/series **names you type in are stored as a single value**, not per-language. The public site's own EN/TH toggle (see below) still works for all the static page copy; it just can't yet show a different catalog name per language. Ask if you'd like real bilingual name fields added (`name_th` / `name_en` columns) — that's a schema change I can do as a follow-up.

## Category page layout (sidebar + series cards + unlimited subcategory nesting)

Clicking a "Browse by Brand" tile skips straight to that brand's first top-level category. The Category page shows a left sidebar listing sibling categories at the current level (click one to switch), and the main area shows:
- **Subcategory tiles**, if the current category has any (click one to drill deeper — `หมวดหมู่ใหญ่ → หมวดหมู่ย่อย → ย่อยต่อ → ...`, to any depth)
- **Series cards** and standalone products that are attached *directly* to the current category (name, tagline, up to 5 products as direct links, "View all" if there are more)

Both can appear together — adding a subcategory to a category that already has products attached directly doesn't hide those products.

Route: `/products/:brandSlug/:categorySlug` for the top level, then `/products/:brandSlug/:categorySlug/cat/<id>/<id>/...` as you drill down (the id chain has no fixed depth limit). Series and product detail pages are unaffected — they always link via the product's *own* category slug, whatever depth it's actually at, so nothing else in the catalog needed to change.

**Admin:** the Category list (`/admin/categories`) shows the full tree with `- ` / `-- ` indentation per depth; the Category edit page has a "หมวดหมู่แม่" (Parent Category) dropdown — pick "— ไม่มี (หมวดหมู่ใหญ่) —" for a top-level category, or any existing category to nest under it. The dropdown won't offer a category's own descendants as a parent choice (and the API rejects it too, if you script around the UI), so you can't create a loop. Deleting a category that still has subcategories under it is blocked with a clear message, same as the existing "still has products" protection.

If you're upgrading an existing database, run `migrations/002_add_category_parent.sql` (adds the one new column, keeps all your data).

All seed content in the database comes from the structure given in the brief (brands: OMRON, YASKAWA, NITTO; categories: PLC & HMI, Inverter, Servo & Motion, Industrial Robot, Sensors, Safety, I/O & Industrial PC, Electrical Components, Enclosures; solutions: HMI & PLC, Drive & Motion, Robotic, Smart Factory), plus a demo OMRON / PLC & HMI / NX Series product line to exercise the full catalog flow end-to-end.

## Language toggle (EN / TH)

The site ships with an EN/TH switch in the header. UI copy lives in `client/src/i18n/translations.js` — edit the `th:` block there to change Thai wording. Product/brand/category/series data pulled from the database is English-only (no translation columns in the schema yet); ask if you want `_th` columns added.
