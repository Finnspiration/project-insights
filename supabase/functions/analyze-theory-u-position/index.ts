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
      .select('content, filename, processed')
      .eq('project_id', projectId)
      .eq('processed', true);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
    }

    // Check for unprocessed documents
    const { data: unprocessedDocs } = await supabase
      .from('documents')
      .select('filename')
      .eq('project_id', projectId)
      .eq('processed', false);

    const hasDocuments = documents && documents.length > 0;
    const hasUnprocessed = unprocessedDocs && unprocessedDocs.length > 0;
    
    const documentText = hasDocuments 
      ? documents.map(d => `[${d.filename}]\n${d.content}`).join('\n\n')
      : 'No documents uploaded yet.';
    
    const documentStatus = hasUnprocessed ? 'processing' : (hasDocuments ? 'ready' : 'none');
    const processingFiles = hasUnprocessed ? unprocessedDocs.map(d => d.filename) : [];

    // Prepare Theory U analysis prompt
    const systemPrompt = language === 'da' 
      ? `Du er en Theory U ekspert. Analyser projektet baseret på BÅDE morfologisk assessment OG dokumentindhold.

KRITISK: HELE dit output SKAL være på DANSK. Ingen engelske ord eller sætninger.

Theory U faserne er:
- downloading: Ser med gamle øjne, reproducerer mønstre
- seeing: Ser med friske øjne, observerer fra kanten
- sensing: Ser fra hele systemet, dyb lytning
- presencing: Forbindelse til kilde, tilstedeværelse
- crystallizing: Krystalliserer vision og intention
- prototyping: Prototyper det nye
- performing: Udfører og implementerer

Social Field kvaliteter (brug disse PRÆCISE keys):
- downloading: Høflighed, rutine
- debating: Debat, konflikt, positioner
- dialogue: Reflekterende dialog, åbent sind
- collective_creativity: Flow, co-kreation, åben vilje

Returner struktureret JSON med:
1. currentPhase: { phase: "sensing", confidence: 0.85, socialField: "dialogue", depthLevel: "Surface/Deep" }
2. diagnostics: Open Mind/Heart/Will scores (0-10) med konkret evidens
3. whyHere: { 
     morphologySynthesis: "KORT sammenhængende forklaring på dansk af hvorfor projektet er i denne fase baseret på morfologien",
     morphologyEvidence: [...],
     documentEvidence: [...] eller documentStatus: "processing", processingFiles: [...]
   }
4. nextActions: [
     {
       "priority": 1,
       "action": "Gennemfør 'sensing walks' med nøglepersoner",
       "rationale": "For at udvikle dyb lytning...",
       "theoryUPrinciple": "Sensing kræver...",
       "timeframe": "1-2 uger",
       "expectedImpact": "Større indsigt i..."
     }
   ]
5. readinessIndicators: { 
     readyToDescend: { status: "green/yellow/red", reason: "...", nextSteps: ["...", "..."] },
     readyToPresence: { status: "green/yellow/red", reason: "...", nextSteps: ["...", "..."] },
     readyToAscend: { status: "green/yellow/red", reason: "...", nextSteps: ["...", "..."] }
   }
6. theoryUResources: Minimum 2-3 fase-specifikke ressourcer på dansk`
      : `You are a Theory U expert. Analyze the project based on BOTH morphological assessment AND document content.

Theory U phases are:
- downloading: Seeing with old eyes, reproducing patterns
- seeing: Seeing with fresh eyes, observing from the edge
- sensing: Seeing from the whole system, deep listening
- presencing: Connection to source, presence
- crystallizing: Crystallizing vision and intention
- prototyping: Prototyping the new
- performing: Performing and implementing

Social Field qualities (use these EXACT keys):
- downloading: Politeness, routine
- debating: Debate, conflict, positions
- dialogue: Reflective dialogue, open mind
- collective_creativity: Flow, co-creation, open will

Return structured JSON with:
1. currentPhase: { phase: "sensing", confidence: 0.85, socialField: "dialogue", depthLevel: "Surface/Deep" }
2. diagnostics: Open Mind/Heart/Will scores (0-10) with concrete evidence
3. whyHere: { 
     morphologySynthesis: "SHORT coherent explanation of why project is in this phase based on morphology",
     morphologyEvidence: [...],
     documentEvidence: [...] or documentStatus: "processing", processingFiles: [...]
   }
4. nextActions: 3 concrete actions with priority, action, rationale, theoryUPrinciple, timeframe, expectedImpact
5. readinessIndicators: { 
     readyToDescend: { status: "green/yellow/red", reason: "...", nextSteps: ["...", "..."] },
     readyToPresence: { status: "green/yellow/red", reason: "...", nextSteps: ["...", "..."] },
     readyToAscend: { status: "green/yellow/red", reason: "...", nextSteps: ["...", "..."] }
   }
6. theoryUResources: Minimum 2-3 phase-specific resources`;

    const userPrompt = `Morphological Assessment:
${JSON.stringify(morphology, null, 2)}

Project Documents:
${documentText}

Document Status: ${documentStatus}
${hasUnprocessed ? `Processing: ${processingFiles.join(', ')}` : ''}

${language === 'da' 
  ? 'Analyser hvor projektet er på Theory U rejsen, hvorfor, og hvad de skal gøre ved det. ALT SKAL VÆRE PÅ DANSK. Returner valid JSON.'
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