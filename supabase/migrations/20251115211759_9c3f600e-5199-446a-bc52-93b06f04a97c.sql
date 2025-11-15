-- Create favorite_quotes table
CREATE TABLE public.favorite_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  relevance_score INTEGER NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  theory_u_phase TEXT NOT NULL,
  source_document TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.favorite_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own favorite quotes"
  ON public.favorite_quotes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorite quotes"
  ON public.favorite_quotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite quotes"
  ON public.favorite_quotes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all favorite quotes"
  ON public.favorite_quotes
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create index for performance
CREATE INDEX idx_favorite_quotes_user_project ON public.favorite_quotes(user_id, project_id);
CREATE INDEX idx_favorite_quotes_created ON public.favorite_quotes(created_at DESC);