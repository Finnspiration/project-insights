-- Create morphology_archetypes table
CREATE TABLE morphology_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Unique identifier for morphological combination
  morphology_hash TEXT NOT NULL UNIQUE,
  
  -- AI-generated archetype data
  name JSONB NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description JSONB NOT NULL,
  
  -- Metadata
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Original morphology (for reference)
  morphology_data JSONB NOT NULL
);

-- Index for fast lookup
CREATE INDEX idx_morphology_hash ON morphology_archetypes(morphology_hash);

-- RLS policies
ALTER TABLE morphology_archetypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view archetypes"
  ON morphology_archetypes FOR SELECT
  USING (true);

CREATE POLICY "System can insert archetypes"
  ON morphology_archetypes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update usage count"
  ON morphology_archetypes FOR UPDATE
  USING (true);