-- Migration: Convert morphology from string format to object format
-- This migration updates all projects to use the new morphology format with selectedValue and selectedIndex

-- Helper function to convert string morphology to object format
CREATE OR REPLACE FUNCTION convert_morphology_to_object_format()
RETURNS void AS $$
DECLARE
  project_record RECORD;
  new_morphology JSONB;
  dimension_key TEXT;
  dimension_value TEXT;
  dimension_index INTEGER;
BEGIN
  -- Loop through all projects
  FOR project_record IN SELECT id, morphology FROM projects WHERE morphology IS NOT NULL
  LOOP
    new_morphology := '{}'::jsonb;
    
    -- Process each dimension
    FOR dimension_key IN SELECT jsonb_object_keys(project_record.morphology)
    LOOP
      dimension_value := project_record.morphology->>dimension_key;
      
      -- Check if it's already in object format (has 'selectedValue' key)
      IF dimension_value LIKE '{%' AND dimension_value LIKE '%selectedValue%' THEN
        -- Already converted, keep as is
        new_morphology := new_morphology || jsonb_build_object(
          dimension_key,
          (project_record.morphology->dimension_key)
        );
      ELSE
        -- Convert string to object format
        -- Calculate index based on dimension and value
        dimension_index := CASE dimension_key
          -- complexity: simple(0), complicated(1), complex(2), chaotic(3)
          WHEN 'complexity' THEN 
            CASE dimension_value
              WHEN 'simple' THEN 0
              WHEN 'complicated' THEN 1
              WHEN 'complex' THEN 2
              WHEN 'chaotic' THEN 3
              ELSE 0
            END
          -- stakeholder: unified(0), cooperative(1), competitive(2), adversarial(3)
          WHEN 'stakeholder' THEN
            CASE dimension_value
              WHEN 'unified' THEN 0
              WHEN 'cooperative' THEN 1
              WHEN 'competitive' THEN 2
              WHEN 'adversarial' THEN 3
              ELSE 0
            END
          -- knowledge: routine(0), adaptive(1), innovative(2), breakthrough(3)
          WHEN 'knowledge' THEN
            CASE dimension_value
              WHEN 'routine' THEN 0
              WHEN 'adaptive' THEN 1
              WHEN 'innovative' THEN 2
              WHEN 'breakthrough' THEN 3
              ELSE 0
            END
          -- cultural: mono(0), cross_functional(1), cross_org(2), cross_cultural(3)
          WHEN 'cultural' THEN
            CASE dimension_value
              WHEN 'mono' THEN 0
              WHEN 'cross_functional' THEN 1
              WHEN 'cross_org' THEN 2
              WHEN 'cross_cultural' THEN 3
              ELSE 0
            END
          -- temporal: sprint(0), project(1), program(2), transformation(3)
          WHEN 'temporal' THEN
            CASE dimension_value
              WHEN 'sprint' THEN 0
              WHEN 'project' THEN 1
              WHEN 'program' THEN 2
              WHEN 'transformation' THEN 3
              ELSE 0
            END
          -- organizational: red(0), amber(1), orange(2), green(3), teal(4)
          WHEN 'organizational' THEN
            CASE dimension_value
              WHEN 'red' THEN 0
              WHEN 'amber' THEN 1
              WHEN 'orange' THEN 2
              WHEN 'green' THEN 3
              WHEN 'teal' THEN 4
              ELSE 0
            END
          -- challenge: technical(0), social(1), political(2), cognitive(3), adaptive(4)
          WHEN 'challenge' THEN
            CASE dimension_value
              WHEN 'technical' THEN 0
              WHEN 'social' THEN 1
              WHEN 'political' THEN 2
              WHEN 'cognitive' THEN 3
              WHEN 'adaptive' THEN 4
              ELSE 0
            END
          -- development: being(0), thinking(1), relating(2), collaborating(3), acting(4)
          WHEN 'development' THEN
            CASE dimension_value
              WHEN 'being' THEN 0
              WHEN 'thinking' THEN 1
              WHEN 'relating' THEN 2
              WHEN 'collaborating' THEN 3
              WHEN 'acting' THEN 4
              ELSE 0
            END
          -- resources: rich(0), balanced(1), constrained(2), scarce(3)
          WHEN 'resources' THEN
            CASE dimension_value
              WHEN 'rich' THEN 0
              WHEN 'balanced' THEN 1
              WHEN 'constrained' THEN 2
              WHEN 'scarce' THEN 3
              ELSE 0
            END
          -- change: incremental(0), transitional(1), transformational(2), disruptive(3)
          WHEN 'change' THEN
            CASE dimension_value
              WHEN 'incremental' THEN 0
              WHEN 'transitional' THEN 1
              WHEN 'transformational' THEN 2
              WHEN 'disruptive' THEN 3
              ELSE 0
            END
          -- information: centralized(0), hierarchical(1), network(2), distributed(3)
          WHEN 'information' THEN
            CASE dimension_value
              WHEN 'centralized' THEN 0
              WHEN 'hierarchical' THEN 1
              WHEN 'network' THEN 2
              WHEN 'distributed' THEN 3
              ELSE 0
            END
          -- risk: low(0), moderate(1), high(2), extreme(3)
          WHEN 'risk' THEN
            CASE dimension_value
              WHEN 'low' THEN 0
              WHEN 'moderate' THEN 1
              WHEN 'high' THEN 2
              WHEN 'extreme' THEN 3
              ELSE 0
            END
          ELSE 0
        END;
        
        -- Build object format
        new_morphology := new_morphology || jsonb_build_object(
          dimension_key,
          jsonb_build_object(
            'selectedValue', dimension_value,
            'selectedIndex', dimension_index
          )
        );
      END IF;
    END LOOP;
    
    -- Update project with new morphology
    UPDATE projects 
    SET morphology = new_morphology,
        updated_at = NOW()
    WHERE id = project_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the conversion
SELECT convert_morphology_to_object_format();

-- Drop the helper function
DROP FUNCTION convert_morphology_to_object_format();