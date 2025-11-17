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
      en: `Analyze THIS SPECIFIC document and provide BOTH morphology suggestions AND IDG (Inner Development Goals) analysis with evidence quotes that come EXCLUSIVELY from this document.

Document: ${document.filename}
Content:
${document.content.slice(0, 50000)}

CRITICAL: All evidence quotes MUST be exact quotes from the content above. Do not reference other documents.

You MUST provide scores for all 5 IDG dimensions:
- Being (self-awareness, presence, inner compass)
- Thinking (critical thinking, perspective, sense-making)
- Relating (appreciation, connectedness, humility)
- Collaborating (communication, co-creation, trust)
- Acting (courage, optimism, perseverance)

Return COMPLETE analysis with both morphology AND IDG scores.`,
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

    console.log('Calling AI with tool calling for structured output...');
    
    // Define morphology analysis tool for structured output
    const morphologyTool = {
      type: "function",
      function: {
        name: "analyze_morphology",
        description: "Analyze document and return morphology suggestions with evidence",
        parameters: {
          type: "object",
          properties: {
            morphologySuggestions: {
              type: "object",
              properties: {
                complexity: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["simple", "complicated", "complex", "chaotic"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                stakeholderDynamics: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["unified", "cooperative", "competitive", "adversarial"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                knowledgeIntensity: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["routine", "adaptive", "innovative", "breakthrough"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                culturalContext: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["mono", "cross_functional", "cross_organizational", "cross_cultural"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                temporalDynamics: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["sprint", "project", "program", "transformation"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                organizationalStage: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["red", "amber", "orange", "green", "teal"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                primaryChallenge: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["technical", "social", "political", "cognitive", "adaptive"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                innerDevelopmentNeeds: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["being", "thinking", "relating", "collaborating", "acting"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                resourceCharacteristics: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["rich", "balanced", "constrained", "scarce"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                changeIntensity: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["incremental", "transitional", "transformational", "disruptive"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                informationFlow: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["centralized", "hierarchical", "network", "distributed"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                },
                riskProfile: {
                  type: "object",
                  properties: {
                    value: { type: "string", enum: ["low", "moderate", "high", "extreme"] },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["value", "confidence", "evidence"]
                }
              },
              required: ["complexity", "stakeholderDynamics", "knowledgeIntensity", "culturalContext", "temporalDynamics", "organizationalStage", "primaryChallenge", "innerDevelopmentNeeds", "resourceCharacteristics", "changeIntensity", "informationFlow", "riskProfile"]
            },
            idgAnalysis: {
              type: "object",
              properties: {
                being: {
                  type: "object",
                  properties: {
                    score: { type: "number", minimum: 0, maximum: 100 },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["score", "confidence", "evidence"]
                },
                thinking: {
                  type: "object",
                  properties: {
                    score: { type: "number", minimum: 0, maximum: 100 },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["score", "confidence", "evidence"]
                },
                relating: {
                  type: "object",
                  properties: {
                    score: { type: "number", minimum: 0, maximum: 100 },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["score", "confidence", "evidence"]
                },
                collaborating: {
                  type: "object",
                  properties: {
                    score: { type: "number", minimum: 0, maximum: 100 },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["score", "confidence", "evidence"]
                },
                acting: {
                  type: "object",
                  properties: {
                    score: { type: "number", minimum: 0, maximum: 100 },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    evidence: { type: "string" }
                  },
                  required: ["score", "confidence", "evidence"]
                }
              },
              required: ["being", "thinking", "relating", "collaborating", "acting"]
            }
          },
          required: ["morphologySuggestions", "idgAnalysis"]
        }
      }
    };

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
        tools: [morphologyTool],
        tool_choice: { type: "function", function: { name: "analyze_morphology" } }
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
      console.log('First choice message type:', typeof data.choices[0].message);
      console.log('Has tool_calls:', !!data.choices[0].message?.tool_calls);
      console.log('Finish reason:', data.choices[0].finish_reason);
    }
    
    // Parse tool call response
    if (!data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      console.error('No tool calls in AI response. Full response:', JSON.stringify(data, null, 2));
      throw new Error('No tool calls in AI response');
    }

    const toolCallArgs = data.choices[0].message.tool_calls[0].function.arguments;
    console.log('Tool call arguments type:', typeof toolCallArgs);
    console.log('Tool call arguments length:', toolCallArgs.length);
    console.log('Tool call preview:', toolCallArgs.slice(0, 200));

    console.log('AI analysis complete for document:', document.filename);

    const analysis = JSON.parse(toolCallArgs);
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
