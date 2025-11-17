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
    const { documentId, language = 'en' } = await req.json();
    
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing single document:', documentId);

    // Fetch the specific document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('processed', true)
      .single();

    if (docError) {
      throw docError;
    }

    if (!document || !document.content) {
      return new Response(
        JSON.stringify({ 
          morphologySuggestions: null,
          message: 'Document not found or has no content'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing document: ${document.filename}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompts = {
      en: 'You are PRISM AI, an expert in organizational development and project analysis. Analyze this SPECIFIC document and provide insights based ONLY on quotes from this exact document.',
      da: 'Du er PRISM AI, ekspert i organisationsudvikling og projektanalyse. Analyser dette SPECIFIKKE dokument og giv indsigter baseret KUN på citater fra netop dette dokument.'
    };

    const userPrompts = {
      en: `Analyze THIS SPECIFIC document and provide morphology suggestions with evidence quotes that come EXCLUSIVELY from this document.

Document: ${document.filename}
Content:
${document.content.slice(0, 50000)}

CRITICAL: All evidence quotes MUST be exact quotes from the content above. Do not reference other documents.

Return JSON with this structure:
{
  "morphologySuggestions": {
    "complexity": {"value": "complex", "confidence": 0.8, "evidence": "exact quote from THIS document"},
    "stakeholderDynamics": {"value": "cooperative", "confidence": 0.7, "evidence": "exact quote from THIS document"},
    "knowledgeIntensity": {"value": "innovative", "confidence": 0.9, "evidence": "exact quote from THIS document"},
    "culturalContext": {"value": "cross_functional", "confidence": 0.6, "evidence": "exact quote from THIS document"},
    "temporalDynamics": {"value": "transformation", "confidence": 0.75, "evidence": "exact quote from THIS document"},
    "organizationalStage": {"value": "green", "confidence": 0.65, "evidence": "exact quote from THIS document"},
    "primaryChallenge": {"value": "adaptive", "confidence": 0.8, "evidence": "exact quote from THIS document"},
    "innerDevelopmentNeeds": {"value": "relating", "confidence": 0.7, "evidence": "exact quote from THIS document"},
    "resourceCharacteristics": {"value": "balanced", "confidence": 0.6, "evidence": "exact quote from THIS document"},
    "changeIntensity": {"value": "transformational", "confidence": 0.85, "evidence": "exact quote from THIS document"},
    "informationFlow": {"value": "network", "confidence": 0.7, "evidence": "exact quote from THIS document"},
    "riskProfile": {"value": "moderate", "confidence": 0.65, "evidence": "exact quote from THIS document"}
  }
}`,
      da: `Analyser DETTE SPECIFIKKE dokument og giv morfologi forslag OG Inner Development Goals (IDG) analyse med evidens-citater der kommer UDELUKKENDE fra dette dokument.

Dokument: ${document.filename}
Indhold:
${document.content.slice(0, 50000)}

KRITISK: Alle evidens-citater SKAL være eksakte citater fra indholdet ovenfor. Referer ikke til andre dokumenter.

Returner JSON med denne struktur:
{
  "morphologySuggestions": {
    "complexity": {"value": "complex", "confidence": 0.8, "evidence": "eksakt citat fra DETTE dokument"},
    "stakeholderDynamics": {"value": "cooperative", "confidence": 0.7, "evidence": "eksakt citat fra DETTE dokument"},
    "knowledgeIntensity": {"value": "innovative", "confidence": 0.9, "evidence": "eksakt citat fra DETTE dokument"},
    "culturalContext": {"value": "cross_functional", "confidence": 0.6, "evidence": "eksakt citat fra DETTE dokument"},
    "temporalDynamics": {"value": "transformation", "confidence": 0.75, "evidence": "eksakt citat fra DETTE dokument"},
    "organizationalStage": {"value": "green", "confidence": 0.65, "evidence": "eksakt citat fra DETTE dokument"},
    "primaryChallenge": {"value": "adaptive", "confidence": 0.8, "evidence": "eksakt citat fra DETTE dokument"},
    "innerDevelopmentNeeds": {"value": "relating", "confidence": 0.7, "evidence": "eksakt citat fra DETTE dokument"},
    "resourceCharacteristics": {"value": "balanced", "confidence": 0.6, "evidence": "eksakt citat fra DETTE dokument"},
    "changeIntensity": {"value": "transformational", "confidence": 0.85, "evidence": "eksakt citat fra DETTE dokument"},
    "informationFlow": {"value": "network", "confidence": 0.7, "evidence": "eksakt citat fra DETTE dokument"},
    "riskProfile": {"value": "moderate", "confidence": 0.65, "evidence": "eksakt citat fra DETTE dokument"}
  },
  "idgAnalysis": {
    "being": {"score": 65, "confidence": 0.75, "evidence": "eksakt citat der viser selvindsigt eller opmærksomhed"},
    "thinking": {"score": 70, "confidence": 0.8, "evidence": "eksakt citat der viser analytisk tænkning eller perspektiv"},
    "relating": {"score": 60, "confidence": 0.7, "evidence": "eksakt citat der viser relationsskabelse eller empati"},
    "collaborating": {"score": 75, "confidence": 0.85, "evidence": "eksakt citat der viser co-creation eller mobilisering"},
    "acting": {"score": 55, "confidence": 0.65, "evidence": "eksakt citat der viser mod eller udholdenhed"}
  }
}`
    };

    console.log('Calling AI for single document analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en },
          { role: 'user', content: userPrompts[language as keyof typeof userPrompts] || userPrompts.en }
        ],
        max_tokens: 4000,
      }),
    });

    console.log('AI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response data keys:', Object.keys(data));
    console.log('Choices array length:', data.choices?.length);
    
    if (data.choices && data.choices.length > 0) {
      console.log('First choice keys:', Object.keys(data.choices[0]));
      console.log('First choice message:', JSON.stringify(data.choices[0].message, null, 2));
      console.log('Finish reason:', data.choices[0].finish_reason);
    }
    
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in response. Full choices array:', JSON.stringify(data.choices, null, 2));
      throw new Error('No content in AI response');
    }
    
    console.log('Content length:', content.length);
    console.log('Content preview:', content.slice(0, 200));

    console.log('AI analysis complete for document:', document.filename);

    const analysis = JSON.parse(content);
    console.log('Has morphologySuggestions:', !!analysis.morphologySuggestions);
    console.log('Has idgAnalysis:', !!analysis.idgAnalysis);

    // Map AI response keys to database keys
    const keyMapping: Record<string, string> = {
      'stakeholderDynamics': 'stakeholder',
      'knowledgeIntensity': 'knowledge',
      'culturalContext': 'cultural',
      'temporalDynamics': 'temporal',
      'organizationalStage': 'organizational',
      'primaryChallenge': 'challenge',
      'innerDevelopmentNeeds': 'development',
      'resourceCharacteristics': 'resources',
      'changeIntensity': 'change',
      'informationFlow': 'information',
      'riskProfile': 'risk',
      'complexity': 'complexity'
    };

    const mappedSuggestions: any = {};
    if (analysis.morphologySuggestions) {
      for (const [aiKey, dbKey] of Object.entries(keyMapping)) {
        if (analysis.morphologySuggestions[aiKey]) {
          mappedSuggestions[dbKey] = analysis.morphologySuggestions[aiKey];
        }
      }
    }

    // Parse IDG analysis if present
    const idgAnalysis = analysis.idgAnalysis || null;
    if (idgAnalysis) {
      console.log('IDG analysis found:', Object.keys(idgAnalysis));
    }

    // Calculate overall confidence
    const allConfidences = Object.values(mappedSuggestions)
      .map((s: any) => s.confidence || 0);
    const overallConfidence = allConfidences.length > 0
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
      : 0;

    console.log(`Document-specific confidence: ${(overallConfidence * 100).toFixed(1)}%`);

    // Update this specific document with its own analysis
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: {
          ...(document.metadata || {}),
          morphologySuggestions: mappedSuggestions,
          idgAnalysis: idgAnalysis,
          overallConfidence: overallConfidence,
          analysisTimestamp: new Date().toISOString(),
          sourceDocument: {
            id: document.id,
            filename: document.filename,
            analyzedIndividually: true
          }
        }
      })
      .eq('id', document.id);

    if (updateError) {
      console.error(`Failed to update document ${document.id}:`, updateError);
      throw updateError;
    }

    console.log(`Updated metadata for document: ${document.filename}`);

    return new Response(
      JSON.stringify({
        morphologySuggestions: mappedSuggestions,
        idgAnalysis: idgAnalysis,
        overallConfidence: overallConfidence,
        documentId: document.id,
        filename: document.filename
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error analyzing single document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
