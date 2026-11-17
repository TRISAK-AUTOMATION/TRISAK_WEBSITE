-- Migration 054 — per-person admin accounts (replaces the single shared
-- ADMIN_PASSWORD).
--
--   admin_users       one row per person: username (sign-in name, stored
--                     lower-case), display name, optional email (also
--                     accepted at sign-in), scrypt password hash, role.
--                     superadmin = can manage users; admin = everything else.
--   activity_log.actor  who made the change (display name), shown on the
--                     Dashboard's "Recent Activity".
--
-- Migrating: while admin_users is empty, signing in with the existing
-- ADMIN_PASSWORD (any username you choose) creates the first superadmin with
-- that username and password; from then on only real accounts can sign in.
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak_website -f migrations/054_admin_users.sql

CREATE TABLE IF NOT EXISTS admin_users (
  id             SERIAL PRIMARY KEY,
  username       VARCHAR(60)  NOT NULL UNIQUE,
  display_name   VARCHAR(120),
  email          VARCHAR(150),
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- email is optional, but two accounts can't share one
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email
  ON admin_users (lower(email)) WHERE email IS NOT NULL;

ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS actor VARCHAR(120);
