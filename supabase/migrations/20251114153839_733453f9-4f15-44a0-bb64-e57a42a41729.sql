-- Add Theory U analysis caching columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS theory_u_analysis JSONB,
ADD COLUMN IF NOT EXISTS theory_u_analysis_updated_at TIMESTAMP WITH TIME ZONE;