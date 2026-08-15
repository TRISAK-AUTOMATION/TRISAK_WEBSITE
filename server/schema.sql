-- TRISAK GROUP — database schema
-- Run: psql -d trisak -f schema.sql
--
-- Product catalog hierarchy: BRAND -> CATEGORY -> SERIES -> PRODUCT
-- Each PRODUCT can have many images, specs, documents, and related products.

DROP TABLE IF EXISTS contact_submissions CASCADE;
DROP TABLE IF EXISTS related_products CASCADE;
DROP TABLE IF EXISTS product_documents CASCADE;
DROP TABLE IF EXISTS product_specs CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS series CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS solutions CASCADE;
DROP TABLE IF EXISTS industries CASCADE;

CREATE TABLE brands (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  slug         VARCHAR(100) NOT NULL UNIQUE,
  logo_url     VARCHAR(255),
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE categories (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  slug         VARCHAR(100) NOT NULL UNIQUE,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- A series belongs to one brand + one category (e.g. OMRON / PLC & HMI / "NX Series")
CREATE TABLE series (
  id           SERIAL PRIMARY KEY,
  brand_id     INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,
  slug         VARCHAR(150) NOT NULL,
  tagline      VARCHAR(255),
  description  TEXT,
  image_url    VARCHAR(255),
  is_new       BOOLEAN NOT NULL DEFAULT false,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (brand_id, category_id, slug)
);

CREATE TABLE products (
  id                 SERIAL PRIMARY KEY,
  name               VARCHAR(150) NOT NULL,
  slug               VARCHAR(150) NOT NULL UNIQUE,
  brand_id           INTEGER NOT NULL REFERENCES brands(id),
  category_id        INTEGER NOT NULL REFERENCES categories(id),
  series_id          INTEGER REFERENCES series(id),
  model              VARCHAR(100),
  short_description  VARCHAR(255),
  description        TEXT,
  features           TEXT[],
  image_url          VARCHAR(255),
  is_new             BOOLEAN NOT NULL DEFAULT false,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_images (
  id           SERIAL PRIMARY KEY,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url    VARCHAR(255) NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE product_specs (
  id           SERIAL PRIMARY KEY,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label        VARCHAR(150) NOT NULL,
  value        VARCHAR(255) NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE product_documents (
  id           SERIAL PRIMARY KEY,
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label        VARCHAR(150) NOT NULL,
  file_url     VARCHAR(255) NOT NULL,
  doc_type     VARCHAR(20) NOT NULL DEFAULT 'pdf', -- pdf | doc | link
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE related_products (
  product_id          INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, related_product_id)
);

CREATE TABLE solutions (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  slug         VARCHAR(100) NOT NULL UNIQUE,
  summary      TEXT,
  services     TEXT[],
  benefits     TEXT[],
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE industries (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE contact_submissions (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  company        VARCHAR(150),
  email          VARCHAR(150) NOT NULL,
  phone          VARCHAR(50),
  interested_in  VARCHAR(50),
  message        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO brands (name, slug, sort_order) VALUES
  ('OMRON', 'omron', 1),
  ('YASKAWA', 'yaskawa', 2),
  ('NITTO', 'nitto', 3);

INSERT INTO categories (name, slug, sort_order) VALUES
  ('PLC & HMI', 'plc-hmi', 1),
  ('Inverter', 'inverter', 2),
  ('Servo & Motion', 'servo-motion', 3),
  ('Industrial Robot', 'industrial-robot', 4),
  ('Sensors', 'sensors', 5),
  ('Safety', 'safety', 6),
  ('I/O & Industrial PC', 'io-industrial-pc', 7),
  ('Electrical Components', 'electrical-components', 8),
  ('Enclosures', 'enclosures', 9);

INSERT INTO solutions (name, slug, summary, services, benefits, sort_order) VALUES
(
  'HMI & PLC Solutions', 'hmi-plc-solutions',
  'Control system design and integration built around industrial PLC and HMI platforms.',
  ARRAY['System architecture & panel design', 'PLC / HMI programming', 'SCADA integration', 'Commissioning & on-site support'],
  ARRAY['Faster changeovers', 'Centralised visibility of the line', 'Lower long-term maintenance cost'],
  1
),
(
  'Drive & Motion Control', 'drive-motion-control',
  'Precision drive and motion engineering for demanding production processes.',
  ARRAY['Inverter & servo sizing', 'Motion sequencing & tuning', 'Retrofits of legacy drive systems', 'Preventive maintenance'],
  ARRAY['Higher process accuracy', 'Reduced energy consumption', 'Extended equipment lifespan'],
  2
),
(
  'Robotic Solutions', 'robotic-solutions',
  'Robotic cell design and integration for handling, assembly, and process automation.',
  ARRAY['Cell layout & simulation', 'Robot programming & integration', 'End-of-arm tooling', 'Safety system design'],
  ARRAY['Consistent product quality', 'Reduced labour dependency', 'Scalable production capacity'],
  3
),
(
  'Smart Factory', 'smart-factory',
  'Connected-factory solutions that bring data, control, and visibility onto one platform.',
  ARRAY['IIoT & data acquisition', 'Production monitoring dashboards', 'System integration across lines', 'Digital transformation roadmap'],
  ARRAY['Real-time production insight', 'Data-driven decision making', 'A foundation for future scale-up'],
  4
);

INSERT INTO industries (name, sort_order) VALUES
  ('Manufacturing', 1),
  ('Automotive', 2),
  ('Food & Beverage', 3),
  ('Chemical & Petrochemical', 4),
  ('Pharmaceutical', 5),
  ('Water & Wastewater', 6),
  ('Power & Electrical', 7),
  ('Building & Infrastructure', 8);

-- ---- Demo product catalog: OMRON / PLC & HMI / NX Series ----
INSERT INTO series (brand_id, category_id, name, slug, tagline, description, is_new, sort_order)
SELECT b.id, c.id, 'NX Series', 'nx-series',
       'Next Generation Machine Automation Controller',
       'The NX Series brings machine control, motion, and safety together on a single high-speed backplane.',
       true, 1
FROM brands b, categories c WHERE b.slug = 'omron' AND c.slug = 'plc-hmi';

INSERT INTO products (name, slug, brand_id, category_id, series_id, model, short_description, description, features, is_new, sort_order)
SELECT 'NX1P2', 'omron-nx1p2', b.id, c.id, s.id, 'NX1P2',
       'Machine Automation Controller',
       'NX1P2 is the CPU module of the NX Series, delivering high-performance control with a compact footprint. It integrates motion, I/O, and safety control while supporting EtherCAT for high-speed, deterministic communication across the machine.',
       ARRAY['High Performance', 'Built-in Safety', 'Scalable System', 'Easy Maintenance', 'EtherCAT'],
       true, 1
FROM brands b, categories c, series s
WHERE b.slug = 'omron' AND c.slug = 'plc-hmi' AND s.slug = 'nx-series';

INSERT INTO products (name, slug, brand_id, category_id, series_id, model, short_description, is_new, sort_order)
SELECT 'NX102', 'omron-nx102', b.id, c.id, s.id, 'NX102', 'Machine Automation Controller', false, 2
FROM brands b, categories c, series s WHERE b.slug = 'omron' AND c.slug = 'plc-hmi' AND s.slug = 'nx-series';

INSERT INTO products (name, slug, brand_id, category_id, series_id, model, short_description, is_new, sort_order)
SELECT 'NX701', 'omron-nx701', b.id, c.id, s.id, 'NX701', 'Machine Automation Controller', false, 3
FROM brands b, categories c, series s WHERE b.slug = 'omron' AND c.slug = 'plc-hmi' AND s.slug = 'nx-series';

INSERT INTO products (name, slug, brand_id, category_id, series_id, model, short_description, is_new, sort_order)
SELECT 'NX-ECC201', 'omron-nx-ecc201', b.id, c.id, s.id, 'NX-ECC201', 'EtherCAT Coupler Unit', false, 4
FROM brands b, categories c, series s WHERE b.slug = 'omron' AND c.slug = 'plc-hmi' AND s.slug = 'nx-series';

INSERT INTO products (name, slug, brand_id, category_id, series_id, model, short_description, is_new, sort_order)
SELECT 'NX-AD2203', 'omron-nx-ad2203', b.id, c.id, s.id, 'NX-AD2203', 'Analog Input Unit', false, 5
FROM brands b, categories c, series s WHERE b.slug = 'omron' AND c.slug = 'plc-hmi' AND s.slug = 'nx-series';

-- specs, docs, images, related products for the flagship NX1P2
INSERT INTO product_specs (product_id, label, value, sort_order)
SELECT p.id, spec.label, spec.value, spec.sort_order
FROM products p,
  (VALUES
    ('Program Capacity', '512 KB', 1),
    ('I/O Points', 'Up to 2,048', 2),
    ('Communication', 'EtherCAT, EtherNet/IP', 3),
    ('Motion Control', 'Up to 16 axes', 4),
    ('Operating Temperature', '0 to 55°C', 5),
    ('Safety Rating', 'Category 4, PLe', 6)
  ) AS spec(label, value, sort_order)
WHERE p.slug = 'omron-nx1p2';

INSERT INTO product_documents (product_id, label, file_url, doc_type, sort_order)
SELECT p.id, doc.label, doc.file_url, doc.doc_type, doc.sort_order
FROM products p,
  (VALUES
    ('Datasheet (PDF)', '#', 'pdf', 1),
    ('Catalog (PDF)', '#', 'pdf', 2),
    ('User Manual (PDF)', '#', 'pdf', 3),
    ('Technical Guide (PDF)', '#', 'pdf', 4)
  ) AS doc(label, file_url, doc_type, sort_order)
WHERE p.slug = 'omron-nx1p2';

INSERT INTO related_products (product_id, related_product_id)
SELECT a.id, b.id
FROM products a, products b
WHERE a.slug = 'omron-nx1p2'
  AND b.slug IN ('omron-nx102', 'omron-nx701', 'omron-nx-ecc201', 'omron-nx-ad2203');
