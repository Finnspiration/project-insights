import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { corsHeaders } from '../_shared/auth.ts';
import { generateDnaCode, normalizeMorphology } from '../_shared/morphology.ts';

// This function used to index morphology values directly, which produced
// "[object Object]-[object Object]-…" for every row stored in the legacy
// { selectedValue } shape — the corruption the frontend then had to patch
// around on load. generateDnaCode() normalizes first, so both shapes are safe.

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { projectId } = await req.json();

    console.log('🔄 Starting DNA code regeneration...', { projectId, userId: user.id });

    // Build query
    let query = supabaseClient
      .from('projects')
      .select('id, morphology, dna_code, user_id')
      .eq('user_id', user.id);

    // If specific project ID provided, filter to that project
    if (projectId) {
      query = query.eq('id', projectId);
    }

    const { data: projects, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching projects:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch projects' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!projects || projects.length === 0) {
      console.log('No projects found to regenerate');
      return new Response(
        JSON.stringify({ 
          message: 'No projects found',
          updated: 0,
          skipped: 0,
          errors: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${projects.length} project(s) to process`);

    const results = {
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Process each project
    for (const project of projects) {
      try {
        if (!project.morphology) {
          console.log(`Skipping project ${project.id} - no morphology data`);
          results.skipped++;
          results.details.push({
            id: project.id,
            status: 'skipped',
            reason: 'No morphology data'
          });
          continue;
        }

        // Also converts legacy { selectedValue } rows to the flat format, so
        // the row stops being a source of new corruption.
        const normalized = normalizeMorphology(project.morphology);
        const newDnaCode = generateDnaCode(normalized);
        const oldDnaCode = project.dna_code;
        const morphologyChanged =
          JSON.stringify(normalized) !== JSON.stringify(project.morphology);

        if (newDnaCode === oldDnaCode && !morphologyChanged) {
          console.log(`Skipping project ${project.id} - DNA code already correct`);
          results.skipped++;
          results.details.push({
            id: project.id,
            status: 'skipped',
            reason: 'DNA code already correct',
            dnaCode: newDnaCode
          });
          continue;
        }

        console.log(`Updating project ${project.id}:`, {
          oldDnaCode,
          newDnaCode
        });

        // Update the project with new DNA code (and the normalized morphology)
        const { error: updateError } = await supabaseClient
          .from('projects')
          .update({ dna_code: newDnaCode, morphology: normalized })
          .eq('id', project.id);

        if (updateError) {
          console.error(`Error updating project ${project.id}:`, updateError);
          results.errors++;
          results.details.push({
            id: project.id,
            status: 'error',
            error: updateError.message
          });
          continue;
        }

        results.updated++;
        results.details.push({
          id: project.id,
          status: 'updated',
          oldDnaCode,
          newDnaCode
        });

        console.log(`✅ Successfully updated project ${project.id}`);
      } catch (projectError) {
        console.error(`Error processing project ${project.id}:`, projectError);
        results.errors++;
        results.details.push({
          id: project.id,
          status: 'error',
          error: String(projectError)
        });
      }
    }

    console.log('🎉 DNA regeneration complete:', results);

    return new Response(
      JSON.stringify({
        message: 'DNA code regeneration complete',
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error in regenerate-dna-codes:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: String(error)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
