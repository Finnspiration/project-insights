-- Normalize the morphology column to flat strings and rebuild every DNA code.
--
-- The `morphology` jsonb column has held two shapes:
--   flat    {"complexity": "complex", ...}                  -- morphology wizard
--   object  {"complexity": {"selectedValue": "complex", ...}} -- weather-map live
--                                                              editor, demo seeder
--
-- Writers that indexed the column directly turned the object shape into
-- "[object Object]-[object Object]-…" DNA codes, and every writer joined the
-- dimensions in whatever order Object.keys() happened to return, so identical
-- assessments could end up with different codes.
--
-- Application code now normalizes through supabase/functions/_shared/morphology.ts.
-- This migration brings the stored rows in line with it. It is idempotent:
-- re-running it leaves already-normalized rows untouched.

-- Dimension order — must match MORPHOLOGY_DIMENSION_KEYS in
-- supabase/functions/_shared/morphology.ts. The DNA code depends on it.
CREATE OR REPLACE FUNCTION public.morphology_dimension_keys()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ARRAY[
    'complexity', 'stakeholder', 'knowledge', 'cultural',
    'temporal', 'organizational', 'challenge', 'development',
    'resources', 'change', 'information', 'risk'
  ]::text[];
$$;

-- Flattens either shape into {"dimension": "value"}, dropping unknown keys,
-- non-string values and blanks. Mirrors normalizeMorphology().
CREATE OR REPLACE FUNCTION public.normalize_morphology(_morphology jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_result jsonb := '{}'::jsonb;
  v_key    text;
  v_raw    jsonb;
  v_value  text;
BEGIN
  IF _morphology IS NULL OR jsonb_typeof(_morphology) <> 'object' THEN
    RETURN NULL;
  END IF;

  FOREACH v_key IN ARRAY public.morphology_dimension_keys() LOOP
    v_raw := _morphology -> v_key;

    -- Historic key spellings, mirroring KEY_ALIASES in morphology.ts.
    IF v_raw IS NULL AND v_key = 'challenge' THEN
      v_raw := _morphology -> 'primary';
    ELSIF v_raw IS NULL AND v_key = 'resources' THEN
      v_raw := _morphology -> 'resource';
    END IF;

    IF v_raw IS NULL THEN
      CONTINUE;
    END IF;

    v_value := CASE jsonb_typeof(v_raw)
                 WHEN 'string' THEN v_raw #>> '{}'
                 WHEN 'object' THEN CASE
                                      WHEN jsonb_typeof(v_raw -> 'selectedValue') = 'string'
                                        THEN v_raw #>> '{selectedValue}'
                                      ELSE NULL
                                    END
                 ELSE NULL
               END;

    v_value := nullif(btrim(coalesce(v_value, '')), '');

    IF v_value IS NOT NULL THEN
      v_result := v_result || jsonb_build_object(v_key, v_value);
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

-- Dimension values in canonical order, joined by '-'. Mirrors generateDnaCode().
CREATE OR REPLACE FUNCTION public.morphology_dna_code(_morphology jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT coalesce(
    string_agg(value, '-' ORDER BY ordinality),
    ''
  )
  FROM unnest(public.morphology_dimension_keys()) WITH ORDINALITY AS k(key, ordinality)
  CROSS JOIN LATERAL (
    SELECT public.normalize_morphology(_morphology) ->> k.key AS value
  ) v
  WHERE v.value IS NOT NULL;
$$;

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------

UPDATE public.projects
   SET morphology = public.normalize_morphology(morphology)
 WHERE morphology IS NOT NULL
   AND public.normalize_morphology(morphology) IS DISTINCT FROM morphology;

UPDATE public.projects
   SET dna_code = nullif(public.morphology_dna_code(morphology), '')
 WHERE morphology IS NOT NULL
   AND dna_code IS DISTINCT FROM nullif(public.morphology_dna_code(morphology), '');

-- Any dna_code left over from a project whose morphology was cleared.
UPDATE public.projects
   SET dna_code = NULL
 WHERE morphology IS NULL
   AND dna_code IS NOT NULL;

-- morphology_archetypes.morphology_data carries the same payload, and its
-- morphology_hash was built by stringifying it — every object-shaped row
-- collapsed onto the literal hash "[object object]-…". Rebuild both.
UPDATE public.morphology_archetypes
   SET morphology_data = public.normalize_morphology(morphology_data)
 WHERE morphology_data IS NOT NULL
   AND public.normalize_morphology(morphology_data) IS DISTINCT FROM morphology_data;

-- Drop archetypes whose hash can no longer be trusted (they were shared by
-- unrelated morphologies). They are a regenerable cache, not user data.
DELETE FROM public.morphology_archetypes
 WHERE morphology_hash LIKE '%[object%';

UPDATE public.morphology_archetypes a
   SET morphology_hash = lower(public.morphology_dna_code(a.morphology_data))
 WHERE a.morphology_data IS NOT NULL
   AND a.morphology_hash IS DISTINCT FROM lower(public.morphology_dna_code(a.morphology_data))
   AND NOT EXISTS (
     SELECT 1 FROM public.morphology_archetypes b
      WHERE b.id <> a.id
        AND b.morphology_hash = lower(public.morphology_dna_code(a.morphology_data))
   );