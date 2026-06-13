ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS projects_user_is_demo_idx ON public.projects (user_id, is_demo);