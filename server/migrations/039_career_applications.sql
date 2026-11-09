-- Migration 039 — job applications sent from the "สมัครงานตำแหน่งนี้" popup on
-- the Career page, listed in Admin > ตำแหน่งงาน > คำขอสมัครงาน.
--
--   job_id / job_title  the position applied for; job_title is a snapshot so the
--                       application still reads correctly after the job is
--                       renamed or deleted (job_id then becomes NULL).
--   resume_file         server-generated file name inside server/private/resumes
--                       (NOT under the public /uploads folder — résumés are only
--                       downloadable through the admin API). resume_name is the
--                       applicant's original file name, display only.
--   status              new | reviewing | interview | hired | rejected
--
-- Safe to run more than once.
--
-- Usage:
--   psql -U postgres -d trisak -f migrations/039_career_applications.sql

CREATE TABLE IF NOT EXISTS career_applications (
  id            SERIAL PRIMARY KEY,
  job_id        INTEGER REFERENCES career_jobs(id) ON DELETE SET NULL,
  job_title     VARCHAR(200),
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(50)  NOT NULL,
  email         VARCHAR(150) NOT NULL,
  message       TEXT,
  resume_file   VARCHAR(100),
  resume_name   VARCHAR(200),
  resume_size   INTEGER,
  status        VARCHAR(20)  NOT NULL DEFAULT 'new',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS career_applications_created_idx ON career_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS career_applications_job_idx ON career_applications (job_id);
