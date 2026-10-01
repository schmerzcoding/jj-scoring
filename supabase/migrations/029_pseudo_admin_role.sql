-- Step 1 of 2 — run this ALONE in Supabase SQL Editor, then run 030.
-- PostgreSQL cannot use new enum values in the same transaction they are added.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pseudo_admin';
