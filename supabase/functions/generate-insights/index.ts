import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Fetch document analysis context if projectId is provided
    let documentContext = '';
    if (projectId) {
      try {
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
            documentContext = `\n\nDocument Analysis Context:
- Dominant metaphors: ${JSON.stringify(analysisData.patterns.metaphors)}
- Key themes: ${analysisData.patterns.dominantThemes?.join(', ')}
- Emotional tone: ${analysisData.patterns.emotionalTone}
- Power dynamics: ${analysisData.patterns.powerDynamics}`;
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
1. Strategic Recommendations - 3-5 specific, actionable recommendations
2. Blind Spots - 3-5 potential blind spots or overlooked dimensions
3. Interventions - 3-5 practical interventions or workshops to improve project success

Be specific, insightful, and grounded in organizational theory. Focus on what's NOT being addressed.`,
      da: `Du er PRISM, en ekspert AI-konsulent specialiseret i projektintelligens og organisationsudvikling.
Din rolle er at analysere morfologiske vurderinger (baseret på Teori U, Indre Udviklingsmål, Laloux's Organisatoriske Paradigmer og Morgans Organisatoriske Metaforer) og give handlingsorienterede indsigter.

Analyser projektmorfologien og generer:
1. Strategiske Anbefalinger - 3-5 specifikke, handlingsorienterede anbefalinger
2. Blinde Vinkler - 3-5 potentielle blinde vinkler eller oversete dimensioner
3. Interventioner - 3-5 praktiske interventioner eller workshops for at forbedre projektsucces

Vær specifik, indsigtsfuld og forankret i organisationsteori. Fokuser på hvad der IKKE bliver adresseret.`
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
                        rationale: { type: "string" }
                      },
                      required: ["title", "description", "priority", "rationale"],
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
                        evidence: { type: "string" }
                      },
                      required: ["title", "description", "impact", "evidence"],
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
    console.log("Insights generated successfully");

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
