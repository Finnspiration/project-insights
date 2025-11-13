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
    const { message, context } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user info and language preference
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user profile for language preference
    let { data: profile } = await supabase
      .from('user_profiles')
      .select('preferred_language, ai_messages_used_this_month, subscription_tier')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist, create it
    if (!profile) {
      console.log('User profile not found, creating one for user:', user.id);
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          preferred_language: 'en',
          subscription_tier: 'free',
          ai_messages_used_this_month: 0
        })
        .select()
        .single();
      
      if (createError || !newProfile) {
        console.error('Error creating user profile:', createError);
        throw new Error('Failed to create user profile');
      }
      
      profile = newProfile;
    }

    // At this point, profile is guaranteed to exist
    if (!profile) {
      throw new Error('User profile not found');
    }

    // Check usage limits
    const limits = {
      free: 20,
      professional: 500,
      team: 999999 // unlimited
    };

    const limit = limits[profile.subscription_tier as keyof typeof limits] || limits.free;

    if (profile.ai_messages_used_this_month >= limit) {
      return new Response(
        JSON.stringify({ 
          error: profile.preferred_language === 'da' 
            ? 'Du har nået din månedlige grænse for AI-beskeder. Opgrader din plan for at fortsætte.'
            : 'You have reached your monthly AI message limit. Upgrade your plan to continue.'
        }),
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const language = profile.preferred_language || 'en';

    // Build context-aware system prompt
    let contextPrompt = '';
    
    const pageContexts = {
      en: {
        dashboard: "You are helping the user on their dashboard. They can see an overview of their projects here.",
        project_detail: "You are helping the user with a specific project. They can view morphology assessments, visualizations, and AI insights here.",
        projects_list: "You are helping the user view their projects list. They can create new projects or view existing ones.",
        settings: "You are helping the user in the settings page where they can manage their profile and preferences.",
        general: "You are helping the user navigate PRISM."
      },
      da: {
        dashboard: "Du hjælper brugeren på deres dashboard. De kan se en oversigt over deres projekter her.",
        project_detail: "Du hjælper brugeren med et specifikt projekt. De kan se morfologiske vurderinger, visualiseringer og AI-indsigter her.",
        projects_list: "Du hjælper brugeren med at se deres projektliste. De kan oprette nye projekter eller se eksisterende.",
        settings: "Du hjælper brugeren på indstillingssiden, hvor de kan administrere deres profil og præferencer.",
        general: "Du hjælper brugeren med at navigere i PRISM."
      }
    };

    contextPrompt = pageContexts[language as keyof typeof pageContexts]?.[context.page as keyof typeof pageContexts.en] || 
                    pageContexts.en.general;

    const systemPrompts = {
      en: `You are PRISM AI, an intelligent assistant for the PRISM project intelligence platform. 
      
PRISM reveals the invisible dimensions of projects—culture, politics, consciousness—through theory-driven visualization.

${contextPrompt}

You help users:
- Understand their morphological assessments (12 dimensions)
- Interpret visualizations (Cultural Weather Map, U-Journey Timeline, IDG Radar)
- Navigate blind spots and strategic recommendations
- Make sense of their project's complexity, stakeholder dynamics, and development needs

Be insightful, concise, and helpful. Reference specific PRISM concepts when relevant (Morgan's metaphors, Theory U, Inner Development Goals, Laloux stages).`,
      
      da: `Du er PRISM AI, en intelligent assistent til PRISM projektintelligens-platformen.

PRISM afslører de usynlige dimensioner af projekter—kultur, politik, bevidsthed—gennem teoridrevet visualisering.

${contextPrompt}

Du hjælper brugere med at:
- Forstå deres morfologiske vurderinger (12 dimensioner)
- Fortolke visualiseringer (Kulturelt Vejrkort, U-Rejse Tidslinje, IDG Radar)
- Navigere blinde vinkler og strategiske anbefalinger
- Forstå deres projekts kompleksitet, interessent-dynamik og udviklingsbehov

Vær indsigtsfuld, kortfattet og hjælpsom. Referer til specifikke PRISM-koncepter når relevant (Morgans metaforer, Theory U, Inner Development Goals, Laloux-stadier).`
    };

    // Get project context if available
    let projectContext = '';
    if (context.projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('name, description, dna_code, morphology')
        .eq('id', context.projectId)
        .single();

      if (project) {
        const projectName = typeof project.name === 'string' 
          ? project.name 
          : project.name[language] || project.name.en;
        
        projectContext = language === 'da'
          ? `\n\nAktuelt projekt: ${projectName}\nDNA Kode: ${project.dna_code || 'Ikke vurderet endnu'}`
          : `\n\nCurrent project: ${projectName}\nDNA Code: ${project.dna_code || 'Not assessed yet'}`;
      }
    }

    const systemPrompt = systemPrompts[language as keyof typeof systemPrompts] + projectContext;

    // Prepare messages for AI
    const conversationMessages = context.conversationHistory?.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })) || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages,
          { role: "user", content: message }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "credits" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Increment usage counter
    await supabase
      .from('user_profiles')
      .update({ 
        ai_messages_used_this_month: profile.ai_messages_used_this_month + 1 
      })
      .eq('id', user.id);

    console.log('Chat assistant response generated for user:', user.id);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in chat-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
