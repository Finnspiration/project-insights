import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  assertOwnsProject,
  corsHeaders,
  errorResponse,
  HttpError,
  requireUser,
  serviceClient,
  type SupabaseClient,
} from "../_shared/auth.ts";

// Fallback limits, used only if consume_ai_message() is not available yet.
// The database function is the authoritative source (see the RLS migration).
const FALLBACK_LIMITS: Record<string, number> = {
  free: 20,
  pro: 500,
  professional: 500,
  team: Number.MAX_SAFE_INTEGER,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context = {} } = await req.json();

    // Admin client: reads document content and profiles across RLS. Every use
    // is gated on an explicit ownership check below.
    const supabaseAdmin = serviceClient();

    const user = await requireUser(req, supabaseAdmin);

    // Get user profile for language preference
    let { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('preferred_language, ai_messages_used_this_month, subscription_tier')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist, create it using admin client (bypasses RLS)
    if (!profile) {
      console.log('User profile not found, attempting to create or fetch for user:', user.id);
      
      // Use UPSERT to handle race conditions - if profile exists, just ignore the insert
      const { data: upsertedProfile, error: upsertError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: user.id,
          preferred_language: 'en',
          subscription_tier: 'free',
          ai_messages_used_this_month: 0
        }, {
          onConflict: 'id',
          ignoreDuplicates: true
        })
        .select()
        .single();
      
      // If upsert fails for reasons other than duplicate, try to fetch the profile
      if (upsertError) {
        console.log('Upsert had issue, attempting to fetch existing profile:', upsertError.code);
        
        // Try to fetch with admin client
        const { data: existingProfile, error: fetchError } = await supabaseAdmin
          .from('user_profiles')
          .select('preferred_language, ai_messages_used_this_month, subscription_tier')
          .eq('id', user.id)
          .single();
        
        if (fetchError || !existingProfile) {
          console.error('Failed to fetch or create user profile:', fetchError);
          throw new Error('Failed to access user profile');
        }
        
        profile = existingProfile;
        console.log('Successfully fetched existing profile for:', user.id);
      } else {
        profile = upsertedProfile;
        console.log('Successfully created/fetched user profile for:', user.id);
      }
    }

    // At this point, profile is guaranteed to exist
    if (!profile) {
      throw new Error('User profile not found');
    }

    const language = profile.preferred_language || 'en';

    // Reserve one message BEFORE calling the model. consume_ai_message() rolls
    // the counter over at the start of each month, applies the tier limit and
    // increments atomically under a row lock, so parallel requests cannot both
    // slip past the last allowed message.
    const quota = await consumeAiMessage(supabaseAdmin, user.id, profile);

    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          error: language === 'da'
            ? 'Du har nået din månedlige grænse for AI-beskeder. Opgrader din plan for at fortsætte.'
            : 'You have reached your monthly AI message limit. Upgrade your plan to continue.',
          used: quota.used,
          limit: quota.limit,
        }),
        {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
      // The document fetch below bypasses RLS, so the caller must own the
      // project — otherwise any signed-in user could read another user's files
      // simply by passing their project id.
      await assertOwnsProject(supabaseAdmin, context.projectId, user.id);

      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('name, description, dna_code, morphology')
        .eq('id', context.projectId)
        .single();

      if (project) {
        const projectName = typeof project.name === 'string'
          ? project.name
          : project.name?.[language] || project.name?.en || '';

        projectContext = language === 'da'
          ? `\n\nAktuelt projekt: ${projectName}\nDNA Kode: ${project.dna_code || 'Ikke vurderet endnu'}`
          : `\n\nCurrent project: ${projectName}\nDNA Code: ${project.dna_code || 'Not assessed yet'}`;
      }

      // Fetch project documents using admin client (ownership verified above)
      const { data: documents, error: docError } = await supabaseAdmin
        .from('documents')
        .select('filename, content, metadata, processed')
        .eq('project_id', context.projectId)
        .eq('processed', true)
        .order('uploaded_at', { ascending: false });
      
      if (docError) {
        console.error('Document fetch error:', docError);
      }
      
      if (documents && documents.length > 0) {
        const docList = documents.map(doc => {
          const wordCount = doc.metadata?.word_count || 0;
          const charCount = doc.metadata?.character_count || doc.content?.length || 0;
          return `- ${doc.filename} (${wordCount} ${language === 'da' ? 'ord' : 'words'}, ${charCount} ${language === 'da' ? 'tegn' : 'chars'})`;
        }).join('\n');
        
        const docsContext = language === 'da'
          ? `\n\n📄 Uploadede Dokumenter til dette projekt:\n${docList}\n\nDokumentindhold er tilgængeligt nedenfor. Du kan referere til specifikt indhold fra disse dokumenter når du svarer.`
          : `\n\n📄 Uploaded Documents for this project:\n${docList}\n\nDocument content is available below. You can reference specific content from these documents when responding.`;
        
        projectContext += docsContext;
        
        // Add document contents (limit to reasonable size)
        const maxCharsPerDoc = 10000; // Limit per document to avoid token overflow
        const documentsContent = documents.map(doc => {
          const content = doc.content || '';
          const truncated = content.length > maxCharsPerDoc 
            ? content.substring(0, maxCharsPerDoc) + `... [${language === 'da' ? 'afkortet' : 'truncated'}]`
            : content;
          
          return `\n---\n📄 ${doc.filename}:\n${truncated}\n---`;
        }).join('\n');
        
        projectContext += `\n\n${language === 'da' ? 'DOKUMENTINDHOLD' : 'DOCUMENT CONTENT'}:${documentsContent}`;
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

    // The usage counter was already incremented by consume_ai_message() above.
    console.log('Chat assistant response generated for user:', user.id);

    return new Response(
      JSON.stringify({ response: aiResponse, used: quota.used, limit: quota.limit }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return errorResponse(error, 'Error in chat-assistant function:');
  }
});

interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
}

interface ProfileRow {
  preferred_language: string | null;
  ai_messages_used_this_month: number;
  subscription_tier: string | null;
}

/**
 * Atomically reserves one AI message for the user.
 *
 * Uses the consume_ai_message() database function, which owns the monthly
 * rollover and the tier limits. If that function has not been applied to the
 * database yet, it degrades to a non-atomic read/check/increment through the
 * service-role client — still enforced, just racy under concurrency.
 */
async function consumeAiMessage(
  admin: SupabaseClient,
  userId: string,
  profile: ProfileRow,
): Promise<QuotaResult> {
  const { data, error } = await admin.rpc('consume_ai_message', { _user_id: userId });

  const row = Array.isArray(data) ? data[0] : data;

  if (!error && row) {
    return {
      allowed: Boolean(row.allowed),
      used: Number(row.used ?? 0),
      limit: Number(row.monthly_limit ?? 0),
    };
  }

  console.warn('consume_ai_message() unavailable, falling back to direct update:', error?.message);

  const tier = (profile.subscription_tier || 'free').toLowerCase();
  const limit = FALLBACK_LIMITS[tier] ?? FALLBACK_LIMITS.free;
  const used = profile.ai_messages_used_this_month ?? 0;

  if (used >= limit) {
    return { allowed: false, used, limit };
  }

  const { error: updateError } = await admin
    .from('user_profiles')
    .update({ ai_messages_used_this_month: used + 1 })
    .eq('id', userId);

  if (updateError) {
    // Never hand out a free message because bookkeeping failed.
    console.error('Failed to record AI usage:', updateError);
    throw new HttpError(500, 'Could not record AI usage');
  }

  return { allowed: true, used: used + 1, limit };
}
