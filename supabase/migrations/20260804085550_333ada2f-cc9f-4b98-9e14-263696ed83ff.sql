-- Keep a history of each project's assessment, so the blob can show how a
-- project has changed rather than only how it is today.
--
-- Written by a trigger rather than by the application. The morphology is
-- updated from at least five places — the wizard, the morphological box, the
-- weather map's editor, aggregate-morphology and regenerate-dna-codes — and a
-- history that depends on every one of them remembering to append would be
-- wrong within a month. The database sees every write.

CREATE TABLE IF NOT EXISTS public.project_dna_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  dna_code TEXT,
  morphology JSONB NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_dna_history_project_recorded_idx
  ON public.project_dna_history (project_id, recorded_at DESC);

ALTER TABLE public.project_dna_history ENABLE ROW LEVEL SECURITY;

-- Readable by the project's owner, and by admins as everywhere else.
DROP POLICY IF EXISTS "Users can view own project history" ON public.project_dna_history;
CREATE POLICY "Users can view own project history"
  ON public.project_dna_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_dna_history.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all project history" ON public.project_dna_history;
CREATE POLICY "Admins can view all project history"
  ON public.project_dna_history
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- No INSERT/UPDATE/DELETE policy on purpose: only the trigger writes here, and
-- it runs as the definer. A history a user can edit is not a history.

CREATE OR REPLACE FUNCTION public.record_project_dna()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized jsonb;
  v_last jsonb;
BEGIN
  IF NEW.morphology IS NULL THEN
    RETURN NEW;
  END IF;

  -- Compare like with like: a row rewritten from the legacy {selectedValue}
  -- shape into flat strings is not a change to the assessment.
  v_normalized := public.normalize_morphology(NEW.morphology);

  IF v_normalized IS NULL OR v_normalized = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  SELECT morphology INTO v_last
    FROM public.project_dna_history
   WHERE project_id = NEW.id
   ORDER BY recorded_at DESC
   LIMIT 1;

  IF v_last IS NOT NULL AND v_last = v_normalized THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.project_dna_history (project_id, dna_code, morphology)
  VALUES (NEW.id, nullif(public.morphology_dna_code(v_normalized), ''), v_normalized);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_project_dna ON public.projects;
CREATE TRIGGER record_project_dna
  AFTER INSERT OR UPDATE OF morphology ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.record_project_dna();

-- Seed the history with where every assessed project stands today, so the
-- timeline is not empty until the next edit.
INSERT INTO public.project_dna_history (project_id, dna_code, morphology, recorded_at)
SELECT
  p.id,
  nullif(public.morphology_dna_code(p.morphology), ''),
  public.normalize_morphology(p.morphology),
  coalesce(p.updated_at, p.created_at, now())
FROM public.projects p
WHERE p.morphology IS NOT NULL
  AND public.normalize_morphology(p.morphology) <> '{}'::jsonb
  AND NOT EXISTS (
    SELECT 1 FROM public.project_dna_history h WHERE h.project_id = p.id
  );