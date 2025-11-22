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
    const { projectId, language = 'en' } = await req.json();
    
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing documents for project:', projectId);

    // Fetch all processed documents for the project
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('processed', true);

    if (docError) {
      throw docError;
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ 
          morphologySuggestions: null,
          patterns: null,
          message: 'No processed documents found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${documents.length} processed documents`);

    // Combine all document content
    const combinedContent = documents
      .map(doc => doc.content)
      .filter(Boolean)
      .join('\n\n---\n\n')
      .slice(0, 100000); // Limit total content

    if (!combinedContent) {
      return new Response(
        JSON.stringify({ 
          morphologySuggestions: null,
          patterns: null,
          message: 'No content extracted from documents'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompts = {
      en: 'You are PRISM AI, an expert in organizational development, project management, and systems thinking. Analyze documents to provide deep insights.',
      da: 'Du er PRISM AI, ekspert i organisationsudvikling, projektledelse og systemtænkning. Analyser dokumenter for at give dybe indsigter.'
    };

    const userPrompts = {
      en: `Analyze these project documents and provide:

1. MORPHOLOGY SUGGESTIONS: For each dimension, suggest the most appropriate value based on document content.
2. PATTERNS: Identify organizational metaphors, cultural indicators, and power dynamics.
3. BLIND SPOTS: What is NOT being discussed? What contradictions exist?

Documents:
${combinedContent}

Return JSON with this structure:
{
  "morphologySuggestions": {
    "complexity": {"value": "complex", "confidence": 0.8, "evidence": "quote from doc"},
    "stakeholderDynamics": {"value": "cooperative", "confidence": 0.7, "evidence": "quote"},
    "knowledgeIntensity": {"value": "innovative", "confidence": 0.9, "evidence": "quote"},
    "culturalContext": {"value": "cross_functional", "confidence": 0.6, "evidence": "quote"},
    "temporalDynamics": {"value": "transformation", "confidence": 0.75, "evidence": "quote"},
    "organizationalStage": {"value": "green", "confidence": 0.65, "evidence": "quote"},
    "primaryChallenge": {"value": "adaptive", "confidence": 0.8, "evidence": "quote"},
    "innerDevelopmentNeeds": {"value": "relating", "confidence": 0.7, "evidence": "quote"},
    "resourceCharacteristics": {"value": "balanced", "confidence": 0.6, "evidence": "quote"},
    "changeIntensity": {"value": "transformational", "confidence": 0.85, "evidence": "quote"},
    "informationFlow": {"value": "network", "confidence": 0.7, "evidence": "quote"},
    "riskProfile": {"value": "moderate", "confidence": 0.65, "evidence": "quote"}
  },
  "patterns": {
    "metaphors": {"machine": 0.2, "organism": 0.4, "brain": 0.3, "culture": 0.1},
    "dominantThemes": ["collaboration", "innovation", "change management"],
    "stakeholderMentions": ["leadership team", "customers", "development team"],
    "emotionalTone": "cautiously optimistic",
    "powerDynamics": "distributed leadership emerging"
  },
  "blindSpots": [
    {
      "title": "Missing customer voice",
      "priority": "high",
      "evidence": "No direct customer feedback or user research mentioned",
      "consequence": "Risk of building solutions that don't meet real needs"
    }
  ]
}`,
      da: `Analyser disse projektdokumenter og giv:

1. MORFOLOGI FORSLAG: For hver dimension, foreslå den mest passende værdi baseret på dokumentindhold.
2. MØNSTRE: Identificer organisatoriske metaforer, kulturelle indikatorer og magtdynamikker.
3. BLINDE VINKLER: Hvad diskuteres IKKE? Hvilke modsætninger eksisterer?

Dokumenter:
${combinedContent}

Returner JSON med denne struktur:
{
  "morphologySuggestions": {
    "complexity": {"value": "complex", "confidence": 0.8, "evidence": "citat fra dok"},
    "stakeholderDynamics": {"value": "cooperative", "confidence": 0.7, "evidence": "citat"},
    "knowledgeIntensity": {"value": "innovative", "confidence": 0.9, "evidence": "citat"},
    "culturalContext": {"value": "cross_functional", "confidence": 0.6, "evidence": "citat"},
    "temporalDynamics": {"value": "transformation", "confidence": 0.75, "evidence": "citat"},
    "organizationalStage": {"value": "green", "confidence": 0.65, "evidence": "citat"},
    "primaryChallenge": {"value": "adaptive", "confidence": 0.8, "evidence": "citat"},
    "innerDevelopmentNeeds": {"value": "relating", "confidence": 0.7, "evidence": "citat"},
    "resourceCharacteristics": {"value": "balanced", "confidence": 0.6, "evidence": "citat"},
    "changeIntensity": {"value": "transformational", "confidence": 0.85, "evidence": "citat"},
    "informationFlow": {"value": "network", "confidence": 0.7, "evidence": "citat"},
    "riskProfile": {"value": "moderate", "confidence": 0.65, "evidence": "citat"}
  },
  "patterns": {
    "metaphors": {"machine": 0.2, "organism": 0.4, "brain": 0.3, "culture": 0.1},
    "dominantThemes": ["samarbejde", "innovation", "ændringsledelse"],
    "stakeholderMentions": ["ledelsesteam", "kunder", "udviklingsteam"],
    "emotionalTone": "forsigtigt optimistisk",
    "powerDynamics": "distribueret ledelse i fremgang"
  },
  "blindSpots": [
    {
      "title": "Manglende kundestemme",
      "priority": "high",
      "evidence": "Ingen direkte kundefeedback eller brugerundersøgelse nævnt",
      "consequence": "Risiko for at bygge løsninger der ikke møder reelle behov"
    }
  ]
}`
    };

    console.log('Calling AI for document analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en },
          { role: 'user', content: userPrompts[language as keyof typeof userPrompts] || userPrompts.en }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI analysis complete');

    const analysis = JSON.parse(content);

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
      'complexity': 'complexity' // unchanged
    };

    const mappedSuggestions: any = {};
    if (analysis.morphologySuggestions) {
      for (const [aiKey, dbKey] of Object.entries(keyMapping)) {
        if (analysis.morphologySuggestions[aiKey]) {
          mappedSuggestions[dbKey] = analysis.morphologySuggestions[aiKey];
        }
      }
    }

    // Calculate overall confidence
    const allConfidences = Object.values(mappedSuggestions)
      .map((s: any) => s.confidence || 0);
    const overallConfidence = allConfidences.length > 0
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
      : 0;

    console.log(`Overall confidence: ${(overallConfidence * 100).toFixed(1)}%`);

    // Store project-level patterns (aggregated from all documents)
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({
        patterns: {
          ...(analysis.patterns || {}),
          lastAnalyzed: new Date().toISOString(),
          documentCount: documents.length
        }
      })
      .eq('id', projectId);

    if (projectUpdateError) {
      console.error('Failed to update project patterns:', projectUpdateError);
    }

    // Now analyze each document individually for document-specific suggestions
    console.log('Starting individual document analysis...');
    const individualResults = [];

    for (const doc of documents) {
      try {
        console.log(`Analyzing individual document: ${doc.filename}`);
        
        const { data: individualAnalysis, error: analyzeError } = await supabase.functions.invoke(
          'analyze-single-document',
          { body: { documentId: doc.id, language } }
        );

        if (analyzeError) {
          console.error(`Failed to analyze document ${doc.id}:`, analyzeError);
        } else {
          console.log(`Successfully analyzed: ${doc.filename}`);
          individualResults.push(individualAnalysis);
        }
      } catch (error) {
        console.error(`Error analyzing document ${doc.id}:`, error);
      }
    }

    console.log(`Completed individual analysis for ${individualResults.length}/${documents.length} documents`);

    return new Response(
      JSON.stringify({
        morphologySuggestions: mappedSuggestions,
        patterns: analysis.patterns,
        blindSpots: analysis.blindSpots,
        analyzedDocuments: individualResults.length,
        totalDocuments: documents.length,
        message: `Analyzed ${individualResults.length} documents individually`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error analyzing documents:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});