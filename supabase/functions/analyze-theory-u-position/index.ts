import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { calculateTheoryUPosition, getDominantPhase, calculateOpenMHW } from "./morphologyMapping.ts";

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
    
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI content was:', aiContent);
      // Fallback to basic structure
      aiAnalysis = {
        currentPhase: morphologyAnalysis?.phase || 'seeing',
        confidence: morphologyAnalysis?.confidence || 0.5,
        diagnostics: { aiParseError: true },
        whyHere: { aiNuance: 'AI response parsing failed, using morphology only' },
        nextActions: [],
        readinessIndicators: {},
        theoryUResources: []
      };
    }

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

    // STEP 4: Generate documentEvidence array with AI (per document)
    const documentEvidence = hasDocuments ? await generateIntelligentQuotesPerDocument(
      documents,
      morphologyAnalysis?.phase || 'seeing',
      language,
      LOVABLE_API_KEY
    ) : [];

    // STEP 5: Beregn Open Mind/Heart/Will deterministisk
    const openMHW = morphology ? calculateOpenMHW(morphology) : { mind: 0, heart: 0, will: 0 };
    console.log('Open MHW scores:', openMHW);

    // STEP 6: Kombiner
    const finalAnalysis = {
      ...aiAnalysis,
      currentPhase: morphologyAnalysis?.phase || aiAnalysis.currentPhase,
      confidence: morphologyAnalysis?.confidence || aiAnalysis.confidence,
      openMHW,
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

// Helper function: Generate intelligent quotes PER DOCUMENT with hardcoded source
async function generateIntelligentQuotesPerDocument(
  documents: any[],
  phase: string,
  language: string,
  apiKey: string
): Promise<any[]> {
  const allQuotes: any[] = [];
  
  console.log(`Processing ${documents.length} documents separately for quote extraction...`);
  
  // Process each document SEPARATELY
  for (const doc of documents) {
    const prompt = language === 'da' 
      ? `Udvælg 1-2 af de mest relevante og indsigtsfulde citater fra dette dokument der understøtter at projektet er i "${phase}" fasen af Theory U.

Fokuser på citater der:
- Viser observation, sensing, eller presencing aktiviteter
- Indeholder konkrete eksempler eller indsigter
- Er selvstændigt meningsfulde (ikke fragmenter)
- Er mellem 15-50 ord

For HVERT citat, bedøm relevansen (0-100) baseret på hvor godt det understøtter "${phase}" fasen.

Returner JSON objekt med denne struktur:
{
  "quotes": [
    {
      "text": "citat tekst her",
      "relevance": 85
    }
  ]
}

Dokument:
${doc.content.substring(0, 8000)}`
      : `Select 1-2 of the most relevant and insightful quotes from this document that support the project being in the "${phase}" phase of Theory U.

Focus on quotes that:
- Show observation, sensing, or presencing activities
- Contain concrete examples or insights
- Are self-contained and meaningful (not fragments)
- Are between 15-50 words

For EACH quote, assess the relevance (0-100) based on how well it supports the "${phase}" phase.

Return JSON object with this structure:
{
  "quotes": [
    {
      "text": "quote text here",
      "relevance": 85
    }
  ]
}

Document:
${doc.content.substring(0, 8000)}`;

    try {
      console.log(`Extracting quotes from: ${doc.filename}`);
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim() || '{"quotes":[]}';
        content = content.replace(/```json|```/g, '').trim();
        
        try {
          const parsed = JSON.parse(content);
          
          // Add source to each quote (HARDCODED from current document)
          const quotesWithSource = (parsed.quotes || []).map((q: any) => ({
            text: q.text,
            relevance: q.relevance,
            source: doc.filename  // ← HARDCODED SOURCE!
          }));
          
          console.log(`✅ Extracted ${quotesWithSource.length} quotes from ${doc.filename}`);
          allQuotes.push(...quotesWithSource);
        } catch (parseError) {
          console.error(`❌ JSON parse error for ${doc.filename}:`, parseError);
          console.error(`Malformed content: ${content.substring(0, 500)}...`);
          // Skip this document's quotes but continue processing others
        }
      } else {
        console.warn(`⚠️ Failed to extract quotes from ${doc.filename}: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error extracting quotes from ${doc.filename}:`, error);
    }
  }
  
  // Sort by relevance and return top 5-7
  console.log(`Total quotes extracted: ${allQuotes.length}`);
  const topQuotes = allQuotes
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 7);
  
  console.log(`Returning top ${topQuotes.length} quotes`);
  return topQuotes;
}

// Fallback if AI fails - returns quotes with default relevance
function fallbackQuoteExtraction(documents: any[]): any[] {
  return documents.slice(0, 3).flatMap(doc => {
    if (!doc.content) return [];
    const sentences = doc.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 50);
    return sentences.slice(0, 2).map((s: string) => ({
      text: s.trim() + '.',
      relevance: 50, // Default medium relevance
      source: doc.filename
    }));
  }).slice(0, 6);
}
