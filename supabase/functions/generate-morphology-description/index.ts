import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompts = {
  en: `You are PRISM, an expert in project morphological analysis. 

Generate a concise, structured project description based on the morphology.

Format as markdown with these sections (use sentence case for headings):
## Project profile
A 2-3 sentence overview capturing the essential nature of this project.

## Key characteristics
- Bullet list of 3-4 defining traits based on the morphology. Each bullet should be a clear statement without bold formatting.

## Strategic focus areas
- Bullet list of 2-3 critical areas to focus on. Each bullet should be a clear statement without bold formatting.

IMPORTANT: 
- Do NOT use bold formatting (**text**) anywhere
- Use sentence case for all headings (e.g., "Project profile" not "Project Profile")
- Keep bullets clear and readable without special formatting
- Maximum 200 words total`,
  
  da: `Du er PRISM, en ekspert i projekt morfologisk analyse.

Generer en kort, struktureret projektbeskrivelse baseret på morfologien.

Format som markdown med disse sektioner (brug almindelig skrivemåde for overskrifter):
## Projekt profil
En 2-3 sætnings oversigt der fanger projektets essentielle natur.

## Nøgle karakteristika
- Punktliste med 3-4 definerende træk baseret på morfologien. Hver punkt skal være en klar sætning uden fed formatering.

## Strategiske fokusområder
- Punktliste med 2-3 kritiske områder at fokusere på. Hver punkt skal være en klar sætning uden fed formatering.

VIGTIGT:
- Brug IKKE fed formatering (**tekst**) nogen steder
- Brug almindelig skrivemåde for alle overskrifter (f.eks. "Projekt profil" ikke "Projekt Profil")
- Hold punkter klare og læsbare uden speciel formatering
- Maksimalt 200 ord i alt`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { morphology, language = 'en' } = await req.json();
    console.log('Generating morphology description:', { morphology, language });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create morphology summary for the prompt
    const morphologyText = Object.entries(morphology)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompts[language as 'en' | 'da'] || systemPrompts.en },
          { 
            role: "user", 
            content: `Analyze this project morphology and generate a structured description:\n\n${morphologyText}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    console.log('Generated description successfully');

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error in generate-morphology-description:', error);
    
    // Return fallback description on error
    const fallbackDescription = `## Project Overview\nThis project has been characterized with specific morphological dimensions. Review the matrix above for detailed characteristics.\n\n## Key Areas\n- Monitor project complexity and adapt approach accordingly\n- Engage stakeholders effectively\n- Focus on continuous learning and adaptation`;
    
    return new Response(
      JSON.stringify({ description: fallbackDescription, fallback: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
