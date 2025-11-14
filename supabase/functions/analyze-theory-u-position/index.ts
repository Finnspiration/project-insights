import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, morphology, language = 'en' } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'projectId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch processed documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('content, filename')
      .eq('project_id', projectId)
      .eq('processed', true);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }

    const hasDocuments = documents && documents.length > 0;
    const documentText = hasDocuments 
      ? documents.map(d => `[${d.filename}]\n${d.content}`).join('\n\n')
      : 'No documents uploaded yet.';

    // Prepare Theory U analysis prompt
    const systemPrompt = language === 'da' 
      ? `Du er en Theory U ekspert. Analyser projektet baseret på BÅDE morfologisk assessment OG dokumentindhold.

Theory U faserne er:
- Downloading: Ser med gamle øjne, reproducerer mønstre
- Seeing: Ser med friske øjne, observerer fra kanten
- Sensing: Ser fra hele systemet, dyb lytning
- Presencing: Forbindelse til kilde, tilstedeværelse
- Crystallizing: Krystalliserer vision og intention
- Prototyping: Prototyper det nye
- Performing: Udfører og implementerer

Social Field kvaliteter:
- Downloading: Høflighed, rutine
- Debating: Debat, konflikt, positioner
- Dialogue: Reflekterende dialog, åbent sind
- Collective Creativity: Flow, co-kreation, åben vilje

Returner struktureret JSON med:
1. currentPhase: Præcis fase, confidence (0-1), socialField, depthLevel
2. diagnostics: Open Mind/Heart/Will scores (0-10) med konkret evidens
3. whyHere: Morfologi evidens + dokument citater med analyse
4. nextActions: 3 konkrete handlinger prioriteret (high/medium/low)
5. readinessIndicators: Vurdering af parathed til næste faser
6. theoryUResources: Relevante ressourcer`
      : `You are a Theory U expert. Analyze the project based on BOTH morphological assessment AND document content.

Theory U phases are:
- Downloading: Seeing with old eyes, reproducing patterns
- Seeing: Seeing with fresh eyes, observing from the edge
- Sensing: Seeing from the whole system, deep listening
- Presencing: Connection to source, presence
- Crystallizing: Crystallizing vision and intention
- Prototyping: Prototyping the new
- Performing: Performing and implementing

Social Field qualities:
- Downloading: Politeness, routine
- Debating: Debate, conflict, positions
- Dialogue: Reflective dialogue, open mind
- Collective Creativity: Flow, co-creation, open will

Return structured JSON with:
1. currentPhase: Precise phase, confidence (0-1), socialField, depthLevel
2. diagnostics: Open Mind/Heart/Will scores (0-10) with concrete evidence
3. whyHere: Morphology evidence + document quotes with analysis
4. nextActions: 3 concrete actions prioritized (high/medium/low)
5. readinessIndicators: Assessment of readiness for next phases
6. theoryUResources: Relevant resources`;

    const userPrompt = `Morphological Assessment:
${JSON.stringify(morphology, null, 2)}

Project Documents:
${documentText}

${language === 'da' 
  ? 'Analyser hvor projektet er på Theory U rejsen, hvorfor, og hvad de skal gøre ved det. Returner valid JSON.'
  : 'Analyze where the project is on the Theory U journey, why, and what to do about it. Return valid JSON.'}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    let analysisText = aiData.choices[0].message.content;
    
    // Remove markdown code blocks if present
    analysisText = analysisText.trim();
    if (analysisText.startsWith('```json')) {
      analysisText = analysisText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (analysisText.startsWith('```')) {
      analysisText = analysisText.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const analysis = JSON.parse(analysisText);

    // Cache the result in database
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        theory_u_analysis: analysis,
        theory_u_analysis_updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error caching analysis:', updateError);
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-theory-u-position:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});