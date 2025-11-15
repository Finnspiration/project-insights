-- Add UPDATE policy for documents table
-- This is critical for the processing function to update documents with extracted content

CREATE POLICY "Users can update own project documents"
ON documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = documents.project_id
    AND projects.user_id = auth.uid()
  )
);