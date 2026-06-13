
DROP POLICY IF EXISTS "Anyone can view archetypes" ON public.morphology_archetypes;
DROP POLICY IF EXISTS "Authenticated users can insert archetypes" ON public.morphology_archetypes;
DROP POLICY IF EXISTS "Authenticated users can update archetypes" ON public.morphology_archetypes;

REVOKE ALL ON public.morphology_archetypes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.morphology_archetypes FROM authenticated;
GRANT SELECT ON public.morphology_archetypes TO authenticated;
GRANT ALL ON public.morphology_archetypes TO service_role;

CREATE POLICY "Authenticated users can view archetypes"
  ON public.morphology_archetypes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
