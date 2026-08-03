-- Security hardening: lock down privileged profile columns and make the
-- AI message quota real (atomic increment + monthly rollover).
--
-- Background:
--   * "Users can update own profile" had USING but no WITH CHECK and no column
--     restrictions, so any signed-in user could set their own subscription_tier
--     to 'team' or reset ai_messages_used_this_month from the browser.
--   * "Users can update own projects" likewise allowed rewriting user_id,
--     handing a project to another account.
--   * The counter was never incremented (chat-assistant wrote through an
--     unauthenticated client, so RLS silently matched zero rows) and nothing
--     ever reset it, so "20 messages per month" was never enforced.

-- ---------------------------------------------------------------------------
-- 1. Track which month the usage counter belongs to
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS ai_usage_period_start DATE;

UPDATE public.user_profiles
   SET ai_usage_period_start = date_trunc('month', now() AT TIME ZONE 'utc')::date
 WHERE ai_usage_period_start IS NULL;

-- ---------------------------------------------------------------------------
-- 2. Helpers
-- ---------------------------------------------------------------------------

-- Role from the request JWT ('anon', 'authenticated', 'service_role', ...).
CREATE OR REPLACE FUNCTION public.current_jwt_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_claims text := current_setting('request.jwt.claims', true);
BEGIN
  IF v_claims IS NULL OR v_claims = '' THEN
    RETURN coalesce(current_setting('request.jwt.claim.role', true), '');
  END IF;
  RETURN coalesce(v_claims::jsonb ->> 'role', '');
EXCEPTION
  WHEN others THEN
    RETURN '';
END;
$$;

-- Single source of truth for tier limits. Accepts both 'pro' and 'professional'
-- because the frontend currently spells the paid tier both ways.
CREATE OR REPLACE FUNCTION public.ai_message_limit(_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(_tier, 'free'))
           WHEN 'team'         THEN 2147483647
           WHEN 'enterprise'   THEN 2147483647
           WHEN 'professional' THEN 500
           WHEN 'pro'          THEN 500
           ELSE 20
         END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Block account holders from editing billing / usage columns
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_user_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Edge functions (service role) and consume_ai_message() may write freely.
  IF public.current_jwt_role() = 'service_role'
     OR coalesce(current_setting('app.allow_usage_update', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.ai_messages_used_this_month IS DISTINCT FROM OLD.ai_messages_used_this_month
     OR NEW.ai_usage_period_start IS DISTINCT FROM OLD.ai_usage_period_start THEN
    RAISE EXCEPTION 'Subscription and AI usage fields cannot be modified by the account holder'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_profile_columns ON public.user_profiles;
CREATE TRIGGER guard_user_profile_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_user_profile_columns();

-- ---------------------------------------------------------------------------
-- 4. Add the missing WITH CHECK clauses
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Atomic quota consumption with monthly rollover
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.consume_ai_message(_user_id uuid)
RETURNS TABLE (allowed boolean, used integer, monthly_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start date := date_trunc('month', now() AT TIME ZONE 'utc')::date;
  v_used  integer;
  v_tier  text;
  v_period date;
  v_limit integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user id is required' USING ERRCODE = '22004';
  END IF;

  PERFORM set_config('app.allow_usage_update', 'on', true);

  INSERT INTO public.user_profiles (id)
  VALUES (_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Row lock serialises concurrent messages from the same user, so two
  -- parallel requests cannot both consume the last allowed message.
  SELECT ai_messages_used_this_month, subscription_tier, ai_usage_period_start
    INTO v_used, v_tier, v_period
    FROM public.user_profiles
   WHERE id = _user_id
     FOR UPDATE;

  v_limit := public.ai_message_limit(v_tier);

  -- Lazy monthly reset: no cron needed, the first message of a new month
  -- rolls the counter over.
  IF v_period IS DISTINCT FROM v_period_start THEN
    v_used := 0;
    UPDATE public.user_profiles
       SET ai_messages_used_this_month = 0,
           ai_usage_period_start = v_period_start
     WHERE id = _user_id;
  END IF;

  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, v_used, v_limit;
    RETURN;
  END IF;

  UPDATE public.user_profiles
     SET ai_messages_used_this_month = ai_messages_used_this_month + 1
   WHERE id = _user_id
  RETURNING ai_messages_used_this_month INTO v_used;

  RETURN QUERY SELECT true, v_used, v_limit;
END;
$$;

-- Only edge functions may consume quota; a client must not be able to burn
-- (or bypass) another account's allowance.
REVOKE ALL ON FUNCTION public.consume_ai_message(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ai_message(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.consume_ai_message(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_message(uuid) TO service_role;
