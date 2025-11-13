-- Create blind_spots table
CREATE TABLE public.blind_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title JSONB NOT NULL,
  description JSONB,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB,
  consequences JSONB,
  recommendations JSONB,
  status TEXT NOT NULL DEFAULT 'unaddressed' CHECK (status IN ('unaddressed', 'acknowledged', 'addressed')),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  addressed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_blind_spots_project_id ON public.blind_spots(project_id);
CREATE INDEX idx_blind_spots_priority ON public.blind_spots(priority);
CREATE INDEX idx_blind_spots_status ON public.blind_spots(status);
CREATE INDEX idx_blind_spots_project_status ON public.blind_spots(project_id, status);

-- Enable Row Level Security
ALTER TABLE public.blind_spots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blind_spots
-- Users can view blind spots for their own projects
CREATE POLICY "Users can view own project blind spots"
  ON public.blind_spots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = blind_spots.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can insert blind spots for their own projects
CREATE POLICY "Users can insert own project blind spots"
  ON public.blind_spots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = blind_spots.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can update blind spots for their own projects
CREATE POLICY "Users can update own project blind spots"
  ON public.blind_spots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = blind_spots.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can delete blind spots for their own projects
CREATE POLICY "Users can delete own project blind spots"
  ON public.blind_spots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = blind_spots.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Admins can view all blind spots
CREATE POLICY "Admins can view all blind spots"
  ON public.blind_spots
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_blind_spots_updated_at
  BEFORE UPDATE ON public.blind_spots
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();