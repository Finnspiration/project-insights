import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { morphology, language = "en", projectName, projectId } = await req.json();
    
    if (!morphology) {
      return new Response(
        JSON.stringify({ error: "Morphology data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating insights for project:", projectName);
    console.log("Language:", language);
    console.log("Morphology:", morphology);

    // Fetch document analysis context and document metadata if projectId is provided
    let documentContext = '';
    let documentMetadata: { count: number; excerpts: Array<{ filename: string; excerpt: string }> } = { count: 0, excerpts: [] };
    if (projectId) {
      try {
        // Get supabase admin client to bypass RLS
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // Fetch documents with content using admin client
        const { data: documents, error: docsError } = await supabaseAdmin
          .from('documents')
          .select('filename, content')
          .eq('project_id', projectId)
          .not('content', 'is', null);

        if (!docsError && documents && documents.length > 0) {
          documentMetadata.count = documents.length;
          // Extract excerpts (first 200 chars from each doc)
          documentMetadata.excerpts = documents
            .map((doc: any) => ({
              filename: doc.filename,
              excerpt: doc.content?.substring(0, 200) || ''
            }))
            .filter((d: any) => d.excerpt);

          console.log(`Found ${documentMetadata.count} documents for insights`);
        }

        // Fetch document analysis
        const analyzeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/analyze-documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId, language })
        });

        if (analyzeResponse.ok) {
          const analysisData = await analyzeResponse.json();
          if (analysisData?.patterns) {
            documentContext = `\n\nDocument Analysis Context (based on ${documentMetadata.count} uploaded documents):
- Dominant metaphors: ${JSON.stringify(analysisData.patterns.metaphors)}
- Key themes: ${analysisData.patterns.dominantThemes?.join(', ')}
- Emotional tone: ${analysisData.patterns.emotionalTone}
- Power dynamics: ${analysisData.patterns.powerDynamics}

When generating insights, INCLUDE SPECIFIC CITATIONS from the documents. Use document filenames and quote relevant passages to support your recommendations, blind spots, and evidence.`;
          }
        }
      } catch (err) {
        console.error('Error fetching document analysis:', err);
      }
    }

    // Construct system prompt based on language
    const systemPrompts = {
      en: `You are PRISM, an expert AI consultant specializing in project intelligence and organizational development. 
Your role is to analyze morphological assessments (based on Theory U, Inner Development Goals, Laloux's Organizational Paradigms, and Morgan's Organizational Metaphors) and provide actionable insights.

Analyze the project morphology and generate:
1. Strategic Recommendations - 3-5 specific, actionable recommendations with MANDATORY citations from uploaded documents
2. Blind Spots - 3-5 potential blind spots or overlooked dimensions with MANDATORY citations from uploaded documents
3. Interventions - 3-5 practical interventions or workshops to improve project success

CRITICAL: EVERY recommendation and blind spot MUST include at least 1-2 specific citations with the document filename and exact quotes from the uploaded documents. The citations field is REQUIRED and cannot be empty.

Be specific, insightful, and grounded in organizational theory. Focus on what's NOT being addressed.${documentContext}`,
      da: `Du er PRISM, en ekspert AI-konsulent specialiseret i projektintelligens og organisationsudvikling.
Din rolle er at analysere morfologiske vurderinger (baseret på Teori U, Indre Udviklingsmål, Laloux's Organisatoriske Paradigmer og Morgans Organisatoriske Metaforer) og give handlingsorienterede indsigter.

Analyser projektmorfologien og generer:
1. Strategiske Anbefalinger - 3-5 specifikke, handlingsorienterede anbefalinger med OBLIGATORISKE citater fra uploadede dokumenter
2. Blinde Vinkler - 3-5 potentielle blinde vinkler eller oversete dimensioner med OBLIGATORISKE citater fra uploadede dokumenter
3. Interventioner - 3-5 praktiske interventioner eller workshops for at forbedre projektsucces

KRITISK: HVER anbefaling og blind vinkel SKAL inkludere mindst 1-2 specifikke citater med dokumentfilnavnet og nøjagtige citater fra de uploadede dokumenter. Citations-feltet er PÅKRÆVET og kan ikke være tomt.

Vær specifik, indsigtsfuld og forankret i organisationsteori. Fokuser på hvad der IKKE bliver adresseret.${documentContext}`
    };

    const userPrompts = {
      en: `Analyze this project morphology and generate insights:

Project: ${projectName || "Unnamed Project"}

Morphology Assessment:
- Complexity: ${morphology.complexity || "N/A"}
- Stakeholder Dynamics: ${morphology.stakeholder || "N/A"}
- Knowledge Intensity: ${morphology.knowledge || "N/A"}
- Cultural Context: ${morphology.cultural || "N/A"}
- Temporal Dynamics: ${morphology.temporal || "N/A"}
- Organizational Stage: ${morphology.organizational || "N/A"}
- Primary Challenge: ${morphology.challenge || "N/A"}
- Inner Development Needs: ${morphology.development || "N/A"}
- Resources: ${morphology.resources || "N/A"}
- Change Intensity: ${morphology.change || "N/A"}
- Information Flow: ${morphology.information || "N/A"}
- Risk Profile: ${morphology.risk || "N/A"}${documentContext}

Generate comprehensive insights with specific, actionable recommendations.`,
      da: `Analyser denne projektmorfologi og generer indsigter:

Projekt: ${projectName || "Unavngivet Projekt"}

Morfologisk Vurdering:
- Kompleksitet: ${morphology.complexity || "N/A"}
- Interessentdynamik: ${morphology.stakeholder || "N/A"}
- Vidensintensitet: ${morphology.knowledge || "N/A"}
- Kulturel Kontekst: ${morphology.cultural || "N/A"}
- Temporal Dynamik: ${morphology.temporal || "N/A"}
- Organisatorisk Stadium: ${morphology.organizational || "N/A"}
- Primær Udfordring: ${morphology.challenge || "N/A"}
- Indre Udviklingsbehov: ${morphology.development || "N/A"}
- Ressourcer: ${morphology.resources || "N/A"}
- Forandringsintensitet: ${morphology.change || "N/A"}
- Informationsflow: ${morphology.information || "N/A"}
- Risikoprofil: ${morphology.risk || "N/A"}${documentContext}

Generer omfattende indsigter med specifikke, handlingsorienterede anbefalinger.`
    };

    // Use structured output with tool calling
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en },
          { role: "user", content: userPrompts[language as keyof typeof userPrompts] || userPrompts.en }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_insights",
              description: "Generate project insights based on morphological assessment",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        rationale: { type: "string" },
                        citations: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              document: { type: "string" },
                              quote: { type: "string" }
                            },
                            required: ["document", "quote"]
                          }
                        }
                      },
                      required: ["title", "description", "priority", "rationale", "citations"],
                      additionalProperties: false
                    }
                  },
                  blindSpots: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        impact: { type: "string", enum: ["high", "medium", "low"] },
                        evidence: { type: "string" },
                        citations: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              document: { type: "string" },
                              quote: { type: "string" }
                            },
                            required: ["document", "quote"]
                          }
                        }
                      },
                      required: ["title", "description", "impact", "evidence", "citations"],
                      additionalProperties: false
                    }
                  },
                  interventions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        type: { type: "string", enum: ["workshop", "coaching", "process", "tool", "retreat"] },
                        timeframe: { type: "string" }
                      },
                      required: ["title", "description", "type", "timeframe"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["recommendations", "blindSpots", "interventions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_insights" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the function call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_insights") {
      throw new Error("Unexpected AI response format");
    }

    const insights = JSON.parse(toolCall.function.arguments);
    
    // Add document metadata to insights
    insights.documentMetadata = {
      count: documentMetadata.count,
      analyzed: documentMetadata.count > 0
    };

    // If no documents, ensure empty citations arrays for graceful degradation
    if (documentMetadata.count === 0) {
      insights.recommendations = insights.recommendations.map((rec: any) => ({
        ...rec,
        citations: []
      }));
      insights.blindSpots = insights.blindSpots.map((spot: any) => ({
        ...spot,
        citations: []
      }));
    }
    
    console.log("Insights generated successfully");

    // Store insights and blind spots in database if projectId is provided
    if (projectId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Store full insights in patterns field of projects table
      console.log(`Storing insights for project ${projectId}`);
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          patterns: {
            ...insights,
            generated_at: new Date().toISOString(),
            language: language
          }
        })
        .eq('id', projectId);

      if (updateError) {
        console.error('Error storing insights:', updateError);
      } else {
        console.log('Insights stored successfully in projects table');
      }

      // Store blind spots in dedicated table
      if (insights.blindSpots && insights.blindSpots.length > 0) {
        console.log(`Storing ${insights.blindSpots.length} blind spots for project ${projectId}`);

        // Delete existing blind spots for this project
        await supabase
          .from('blind_spots')
          .delete()
          .eq('project_id', projectId);

        // Prepare blind spots data for insertion
        const blindSpotsToInsert = insights.blindSpots.map((bs: any) => ({
          project_id: projectId,
          title: language === 'da' 
            ? { en: bs.title, da: bs.title }
            : { en: bs.title, da: bs.title },
          description: language === 'da'
            ? { en: bs.description, da: bs.description }
            : { en: bs.description, da: bs.description },
          priority: bs.impact || 'medium',
          confidence: 0.7,
          evidence: { text: bs.evidence },
          consequences: language === 'da'
            ? { en: bs.evidence, da: bs.evidence }
            : { en: bs.evidence, da: bs.evidence },
          recommendations: language === 'da'
            ? { en: 'Address this blind spot', da: 'Adresser denne blinde vinkel' }
            : { en: 'Address this blind spot', da: 'Adresser denne blinde vinkel' },
          status: 'unaddressed'
        }));

        const { error: insertError } = await supabase
          .from('blind_spots')
          .insert(blindSpotsToInsert);

        if (insertError) {
          console.error('Error storing blind spots:', insertError);
        } else {
          console.log('Blind spots stored successfully');
        }
      }
    }

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-insights function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
