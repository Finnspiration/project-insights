-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view documents for their own projects
CREATE POLICY "Users can view own project documents"
  ON public.documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = documents.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert documents for their own projects
CREATE POLICY "Users can insert own project documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = documents.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete documents from their own projects
CREATE POLICY "Users can delete own project documents"
  ON public.documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = documents.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Storage RLS Policies: Users can upload files to their own project folders
CREATE POLICY "Users can upload to own project folders"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Storage RLS Policy: Users can view files from their own project folders
CREATE POLICY "Users can view own project files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Storage RLS Policy: Users can delete files from their own project folders
CREATE POLICY "Users can delete own project files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects WHERE user_id = auth.uid()
    )
  );