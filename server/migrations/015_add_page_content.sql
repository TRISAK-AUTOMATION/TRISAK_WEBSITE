-- Migration 015 — adds admin-editable content for three more public
-- pages, following the exact same pattern as `home_content`
-- (migration 003): one singleton row per page, `_en`/`_th` columns
-- per field, admin edits via a language-tab form, and the public
-- page falls back to its built-in translation text until a field is
-- actually edited.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/015_add_page_content.sql

CREATE TABLE IF NOT EXISTS about_content (
  id                  SERIAL PRIMARY KEY,
  hero_meta_en        VARCHAR(255),
  hero_meta_th        VARCHAR(255),
  hero_title_en       VARCHAR(255),
  hero_title_th       VARCHAR(255),
  hero_sub_en         TEXT,
  hero_sub_th         TEXT,
  intro_eyebrow_en    VARCHAR(255),
  intro_eyebrow_th    VARCHAR(255),
  intro_title_en      VARCHAR(255),
  intro_title_th      VARCHAR(255),
  intro_lede_en       TEXT,
  intro_lede_th       TEXT,
  intro_body_en       TEXT,
  intro_body_th       TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products_page_content (
  id                    SERIAL PRIMARY KEY,
  hero_meta_en          VARCHAR(255),
  hero_meta_th          VARCHAR(255),
  hero_title_en         VARCHAR(255),
  hero_title_th         VARCHAR(255),
  hero_sub_en           TEXT,
  hero_sub_th           TEXT,
  brands_eyebrow_en     VARCHAR(255),
  brands_eyebrow_th     VARCHAR(255),
  categories_eyebrow_en VARCHAR(255),
  categories_eyebrow_th VARCHAR(255),
  cta_title_en          VARCHAR(255),
  cta_title_th          VARCHAR(255),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contacts_page_content (
  id                      SERIAL PRIMARY KEY,
  hero_meta_en            VARCHAR(255),
  hero_meta_th            VARCHAR(255),
  hero_title_en           VARCHAR(255),
  hero_title_th           VARCHAR(255),
  hero_sub_en             TEXT,
  hero_sub_th             TEXT,
  info_eyebrow_en         VARCHAR(255),
  info_eyebrow_th         VARCHAR(255),
  info_title_en           VARCHAR(255),
  info_title_th           VARCHAR(255),
  head_office_label_en    VARCHAR(255),
  head_office_label_th    VARCHAR(255),
  head_office_address_en  TEXT,
  head_office_address_th  TEXT,
  head_office_phone       VARCHAR(50),
  head_office_email       VARCHAR(150),
  warehouse_label_en      VARCHAR(255),
  warehouse_label_th      VARCHAR(255),
  warehouse_address_en    TEXT,
  warehouse_address_th    TEXT,
  warehouse_phone         VARCHAR(50),
  warehouse_email         VARCHAR(150),
  map_eyebrow_en          VARCHAR(255),
  map_eyebrow_th          VARCHAR(255),
  map_title_en            VARCHAR(255),
  map_title_th            VARCHAR(255),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
