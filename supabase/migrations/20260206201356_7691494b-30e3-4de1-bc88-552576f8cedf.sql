
-- Fix overly permissive RLS policies on morphology_archetypes
-- Drop the existing overly permissive INSERT and UPDATE policies
DROP POLICY IF EXISTS "System can insert archetypes" ON public.morphology_archetypes;
DROP POLICY IF EXISTS "System can update usage count" ON public.morphology_archetypes;

-- Create new restrictive policies (only authenticated users can insert/update)
CREATE POLICY "Authenticated users can insert archetypes" 
  ON public.morphology_archetypes 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update archetypes" 
  ON public.morphology_archetypes 
  FOR UPDATE 
  TO authenticated
  USING (true);
