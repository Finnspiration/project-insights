import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { morphology, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompts = {
      en: `You are a project analysis expert. Analyze the morphological profile and provide a comprehensive, insightful description of what this combination means for the project. Focus on:
- The overall project character and nature
- Key challenges and opportunities
- Recommended approaches and interventions
- Potential blind spots or risks
- Strategic considerations

Be specific, actionable, and insightful. Avoid just listing the dimensions - synthesize them into a coherent narrative.`,
      da: `Du er en projektanalyse-ekspert. Analyser den morfologiske profil og giv en omfattende, indsigtsfuld beskrivelse af, hvad denne kombination betyder for projektet. Fokuser på:
- Projektets overordnede karakter og natur
- Centrale udfordringer og muligheder
- Anbefalede tilgange og interventioner
- Potentielle blinde vinkler eller risici
- Strategiske overvejelser

Vær specifik, handlingsorienteret og indsigtsfuld. Undgå blot at liste dimensionerne - syntetiser dem til en sammenhængende fortælling.`
    };

    const dimensionLabels: Record<string, any> = {
      complexity: { en: "Complexity Level", da: "Kompleksitetsniveau" },
      stakeholder: { en: "Stakeholder Dynamics", da: "Interessentdynamik" },
      knowledge: { en: "Knowledge Intensity", da: "Vidensintensitet" },
      cultural: { en: "Cultural Context", da: "Kulturel Kontekst" },
      temporal: { en: "Temporal Dynamics", da: "Temporal Dynamik" },
      organizational: { en: "Organizational Stage", da: "Organisatorisk Stadium" },
      challenge: { en: "Primary Challenge", da: "Primær Udfordring" },
      development: { en: "Inner Development Needs", da: "Indre Udviklingsbehov" },
      resources: { en: "Resource Characteristics", da: "Ressourcekarakteristika" },
      change: { en: "Change Intensity", da: "Forandringsintensitet" },
      information: { en: "Information Flow", da: "Informationsflow" },
      risk: { en: "Risk Profile", da: "Risikoprofil" }
    };

    // Format morphology for AI
    const morphologyText = Object.entries(morphology)
      .map(([key, value]) => {
        const label = dimensionLabels[key]?.[language] || key;
        return `${label}: ${value}`;
      })
      .join('\n');

    const prompt = language === 'da' 
      ? `Analyser denne projektmorfologi og giv en dyb, strategisk beskrivelse (2-3 afsnit):\n\n${morphologyText}\n\nGiv en sammenhængende fortolkning af hvad disse dimensioner betyder sammen, hvilke implikationer de har, og hvilke anbefalinger du vil give.`
      : `Analyze this project morphology and provide a deep, strategic description (2-3 paragraphs):\n\n${morphologyText}\n\nProvide a coherent interpretation of what these dimensions mean together, what implications they have, and what recommendations you would give.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompts[language as 'en' | 'da'] || systemPrompts.en },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate description');
    }

    const data = await response.json();
    const description = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-morphology function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
