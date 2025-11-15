import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { calculateTheoryUPosition, getDominantPhase } from "./morphologyMapping.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, morphology, language = 'en', regenerateQuotes = false } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'projectId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch documents
    const { data: documents } = await supabase
      .from('documents')
      .select('content, filename, processed')
      .eq('project_id', projectId)
      .eq('processed', true);

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

    // STEP 1: Deterministisk scoring fra morfologi
    console.log('Calculating Theory U position from morphology...');
    const morphologyAnalysis = morphology ? getDominantPhase(morphology) : null;
    const rankedPhases = morphology ? calculateTheoryUPosition(morphology) : [];
    
    console.log('Morphology phase:', morphologyAnalysis?.phase, 'confidence:', morphologyAnalysis?.confidence);

    // STEP 2: AI supplement
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const morphologyInsight = morphologyAnalysis 
      ? `MORFOLOGISK SCORING: fase ${morphologyAnalysis.phase} (${(morphologyAnalysis.confidence * 100).toFixed(0)}% confidence)\n\nTop evidens:\n${morphologyAnalysis.evidence.slice(0, 3).join('\n')}\n\nSupplement med dokumentanalyse.`
      : 'Ingen morfologi data.';

    const systemPrompt = language === 'da' 
      ? `Du supplerer morfologisk scoring med dokumentanalyse.\n\n${morphologyInsight}\n\nReturner JSON med currentPhase, diagnostics, whyHere (inkl. aiNuance), nextActions, readinessIndicators, theoryUResources.`
      : `Supplement morphology scoring with document analysis.\n\n${morphologyInsight}\n\nReturn JSON with currentPhase, diagnostics, whyHere (incl. aiNuance), nextActions, readinessIndicators, theoryUResources.`;

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
          { role: 'user', content: `Morphology: ${JSON.stringify(morphology)}\n\nDocuments: ${documentText}\n\nStatus: ${documentStatus}` }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', errorText);
      throw new Error('AI failed');
    }

    const aiData = await aiResponse.json();
    let aiContent = aiData.choices?.[0]?.message?.content?.trim() || '{}';
    aiContent = aiContent.replace(/```json|```/g, '').trim();
    const aiAnalysis = JSON.parse(aiContent);

    // STEP 3: Generate morphologyEvidence array
    const morphologyEvidence = morphologyAnalysis ? 
      morphologyAnalysis.evidence.slice(0, 5).map((contrib: string) => {
        // Parse "dimension (value): reasoning" format
        const match = contrib.match(/^(.+?) \((.+?)\): (.+)$/);
        if (match) {
          return {
            dimension: match[1],
            value: match[2],
            reasoning: match[3]
          };
        }
        return null;
      }).filter(Boolean) : [];

    // STEP 4: Generate documentEvidence array with AI
    const documentEvidence = hasDocuments ? await generateIntelligentQuotes(
      documents,
      morphologyAnalysis?.phase || 'seeing',
      language,
      LOVABLE_API_KEY
    ) : [];

    // STEP 5: Kombiner
    const finalAnalysis = {
      ...aiAnalysis,
      currentPhase: morphologyAnalysis?.phase || aiAnalysis.currentPhase,
      confidence: morphologyAnalysis?.confidence || aiAnalysis.confidence,
      whyHere: {
        ...aiAnalysis.whyHere,
        morphologyScoring: morphologyAnalysis ? {
          phase: morphologyAnalysis.phase,
          confidence: morphologyAnalysis.confidence,
          topContributions: morphologyAnalysis.evidence.slice(0, 5),
          allPhaseScores: rankedPhases.slice(0, 3).map(p => ({
            phase: p.phase,
            score: p.score,
          }))
        } : null,
        morphologyEvidence,
        documentEvidence,
        documentStatus,
        processingFiles: hasUnprocessed ? unprocessedDocs.map(d => d.filename) : []
      }
    };

    // Cache
    await supabase
      .from('projects')
      .update({ 
        theory_u_analysis: finalAnalysis,
        theory_u_analysis_updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    return new Response(JSON.stringify(finalAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function: Generate intelligent quotes using AI
async function generateIntelligentQuotes(
  documents: any[],
  phase: string,
  language: string,
  apiKey: string
): Promise<string[]> {
  const combinedContent = documents
    .map(doc => doc.content)
    .join('\n\n---\n\n')
    .substring(0, 15000); // Limit for API
  
  const prompt = language === 'da' 
    ? `Udvælg 5-7 af de mest relevante og indsigtsfulde citater fra disse dokumenter der understøtter at projektet er i "${phase}" fasen af Theory U.

Fokuser på citater der:
- Viser observation, sensing, eller presencing aktiviteter
- Indeholder konkrete eksempler eller indsigter
- Er selvstændigt meningsfulde (ikke fragmenter)
- Er mellem 15-50 ord

Returner BARE citaterne som JSON array af strings, intet andet.

Dokumenter:
${combinedContent}`
    : `Select the 5-7 most relevant and insightful quotes from these documents that support the project being in the "${phase}" phase of Theory U.

Focus on quotes that:
- Show observation, sensing, or presencing activities
- Contain concrete examples or insights
- Are self-contained and meaningful (not fragments)
- Are between 15-50 words

Return ONLY the quotes as a JSON array of strings, nothing else.

Documents:
${combinedContent}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      console.error('Quote generation failed, falling back to simple extraction');
      return fallbackQuoteExtraction(documents);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '[]';
    content = content.replace(/```json|```/g, '').trim();
    
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.quotes || []);
    
  } catch (error) {
    console.error('Quote AI error:', error);
    return fallbackQuoteExtraction(documents);
  }
}

// Fallback if AI fails
function fallbackQuoteExtraction(documents: any[]): string[] {
  return documents.slice(0, 3).flatMap(doc => {
    if (!doc.content) return [];
    const sentences = doc.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 50);
    return sentences.slice(0, 2).map((s: string) => s.trim() + '.');
  }).slice(0, 6);
}
