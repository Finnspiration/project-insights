import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    
    console.log('Generating archetype for morphology:', morphology);
    
    // 1. Generate hash from morphology
    const morphologyHash = generateMorphologyHash(morphology);
    console.log('Morphology hash:', morphologyHash);
    
    // 2. Check if archetype already exists
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { data: existing, error: fetchError } = await supabase
      .from('morphology_archetypes')
      .select('*')
      .eq('morphology_hash', morphologyHash)
      .single();
    
    if (existing) {
      console.log('Found existing archetype, updating usage count');
      // Update usage count
      await supabase
        .from('morphology_archetypes')
        .update({ 
          usage_count: existing.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      return new Response(JSON.stringify({ archetype: existing }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('No existing archetype found, generating new one with AI');
    
    // 3. Generate new archetype with AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const systemPrompts = {
      en: `You are a creative analyst generating unique project archetypes.
Based on morphological dimensions, create a memorable archetype name (2-4 words),
a fitting emoji icon, a hex color, and a 1-2 sentence description.

Return ONLY valid JSON:
{
  "name": "The Strategic Weaver",
  "icon": "🕸️",
  "color": "#8B5CF6",
  "description": "A complex project weaving together multiple stakeholder interests through adaptive strategies."
}`,
      da: `Du er en kreativ analytiker der genererer unikke projekt-arketyper.
Baseret på morfologiske dimensioner, skab et mindeværdigt arketype-navn (2-4 ord),
et passende emoji-ikon, en hex-farve, og en 1-2 sætnings beskrivelse.

Returner KUN valid JSON:
{
  "name": "Den Strategiske Væver",
  "icon": "🕸️",
  "color": "#8B5CF6",
  "description": "Et komplekst projekt der væver flere interessenters interesser sammen gennem adaptive strategier."
}`
    };
    
    const morphologyDescription = Object.entries(morphology)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompts[language as 'en' | 'da'] || systemPrompts.en },
          { role: 'user', content: `Morphology: ${morphologyDescription}` }
        ],
      }),
    });
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI generation failed:', aiResponse.status, errorText);
      throw new Error('AI generation failed');
    }
    
    const aiData = await aiResponse.json();
    const rawContent = aiData.choices[0].message.content;
    
    // Strip markdown code fences if present
    let jsonContent = rawContent.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const generated = JSON.parse(jsonContent);
    
    console.log('AI generated archetype:', generated);
    
    // 4. Save to database (multilingual)
    const archetypeData = {
      morphology_hash: morphologyHash,
      name: { [language]: generated.name },
      icon: generated.icon,
      color: generated.color,
      description: { [language]: generated.description },
      morphology_data: morphology,
      usage_count: 1
    };
    
    const { data: newArchetype, error: insertError } = await supabase
      .from('morphology_archetypes')
      .insert(archetypeData)
      .select()
      .single();
    
    if (insertError) {
      console.error('Database insert error:', insertError);
      
      // If duplicate key error (code 23505), fetch and return existing archetype
      if (insertError.code === '23505') {
        console.log('Duplicate key detected during insert, fetching existing archetype');
        const { data: existingArchetype, error: refetchError } = await supabase
          .from('morphology_archetypes')
          .select('*')
          .eq('morphology_hash', morphologyHash)
          .single();
        
        if (existingArchetype) {
          // Update usage count
          await supabase
            .from('morphology_archetypes')
            .update({ 
              usage_count: existingArchetype.usage_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingArchetype.id);
          
          return new Response(JSON.stringify({ archetype: existingArchetype }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      throw insertError;
    }
    
    console.log('Successfully created new archetype');
    
    return new Response(JSON.stringify({ archetype: newArchetype }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in generate-archetype:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateMorphologyHash(morphology: any): string {
  // Sort keys alphabetically for consistency
  const keys = Object.keys(morphology).sort();
  return keys.map(k => morphology[k]).join('-').toLowerCase();
}
