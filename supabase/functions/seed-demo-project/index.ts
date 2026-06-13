// Edge function: seed-demo-project
// Creates a fully populated demo project for the authenticated user, idempotently.
// If the user already has an is_demo=true project, returns it instead of creating a new one.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 12 morphology dimensions in the {selectedIndex, selectedValue} shape used everywhere.
const DEMO_MORPHOLOGY = {
  complexity: { selectedIndex: 2, selectedValue: 'complex' },
  stakeholder: { selectedIndex: 1, selectedValue: 'cooperative' },
  knowledge: { selectedIndex: 2, selectedValue: 'innovative' },
  cultural: { selectedIndex: 2, selectedValue: 'crossorg' },
  temporal: { selectedIndex: 3, selectedValue: 'transformation' },
  organizational: { selectedIndex: 3, selectedValue: 'green' },
  challenge: { selectedIndex: 4, selectedValue: 'adaptive' },
  development: { selectedIndex: 2, selectedValue: 'relating' },
  resources: { selectedIndex: 1, selectedValue: 'balanced' },
  change: { selectedIndex: 2, selectedValue: 'transformational' },
  information: { selectedIndex: 2, selectedValue: 'network' },
  risk: { selectedIndex: 1, selectedValue: 'moderate' },
};

const DEMO_DNA = Object.values(DEMO_MORPHOLOGY)
  .map((v) => v.selectedValue)
  .join('-');

const DEMO_NAME = {
  en: 'Demo: Sustainable Urban Transition',
  da: 'Demo: Bæredygtig byomstilling',
};

const DEMO_DESCRIPTION = {
  en:
    'A cross-organisational transformation programme exploring how a Nordic city can transition to a climate-neutral, citizen-led model by 2035. Pre-loaded with realistic morphology, AI insights and blind spots so you can explore PRISM without uploading anything.',
  da:
    'Et tværorganisatorisk transformationsprogram der udforsker, hvordan en nordisk by kan omstille sig til en klimaneutral, borgerdrevet model inden 2035. Færdig-udfyldt med realistisk morfologi, AI-indsigter og blinde vinkler, så du kan udforske PRISM uden at uploade noget.',
};

const DEMO_BLIND_SPOTS = [
  {
    title: {
      en: 'Silent voices in the citizen panels',
      da: 'Tavse stemmer i borgerpanelerne',
    },
    description: {
      en:
        'Younger residents and non-Danish-speaking communities are systematically under-represented in the participation data.',
      da:
        'Yngre indbyggere og ikke-dansktalende fællesskaber er systematisk underrepræsenteret i deltagelses-data.',
    },
    priority: 'high',
    confidence: 0.82,
    evidence: {
      en: 'Of 312 citizen-panel respondents, only 14 were under 25 and none were first-generation residents.',
      da: 'Ud af 312 paneldeltagere var kun 14 under 25, og ingen var første-generations-borgere.',
    },
    consequences: {
      en: 'Policy proposals risk landing as imposed rather than co-created, eroding social licence.',
      da: 'Politiske forslag risikerer at fremstå som påtvungne i stedet for fælles-skabte og udhuler social legitimitet.',
    },
    recommendations: {
      en: 'Run targeted outreach via schools and community centres before the next consultation round.',
      da: 'Lav målrettet opsøgende arbejde via skoler og kulturhuse før næste høringsrunde.',
    },
  },
  {
    title: {
      en: 'Mobility plan ignores logistics economy',
      da: 'Mobilitetsplanen overser logistikøkonomien',
    },
    description: {
      en:
        'Last-mile delivery actors are absent from the steering group despite owning ~30% of inner-city traffic.',
      da:
        'Sidste-kilometer-leverandører mangler i styregruppen, selvom de står for ca. 30 % af inderbyens trafik.',
    },
    priority: 'medium',
    confidence: 0.74,
    evidence: {
      en: 'Stakeholder map lists 22 actors; none represent freight or courier services.',
      da: 'Interessentkortet viser 22 aktører; ingen repræsenterer fragt eller kurértjenester.',
    },
    consequences: {
      en: 'New zoning rules may be technically sound but operationally unworkable on day one.',
      da: 'Nye zoneregler kan være teknisk solide, men operationelt ubrugelige fra dag ét.',
    },
    recommendations: {
      en: 'Invite at least two logistics-sector representatives to the next prototyping sprint.',
      da: 'Inviter mindst to repræsentanter fra logistiksektoren til næste prototyping-sprint.',
    },
  },
  {
    title: {
      en: 'No conversation about what we stop doing',
      da: 'Ingen samtale om, hvad vi stopper med',
    },
    description: {
      en:
        'Documents describe new initiatives but never name the legacy programmes that must be wound down to free capacity.',
      da:
        'Dokumenterne beskriver nye initiativer, men nævner aldrig de eksisterende programmer der skal lukkes for at frigøre kapacitet.',
    },
    priority: 'high',
    confidence: 0.88,
    evidence: {
      en: 'Across 14 strategy notes, the word "decommission" or "stop" appears zero times.',
      da: 'I 14 strategi-noter optræder ordet "afvikle" eller "stop" nul gange.',
    },
    consequences: {
      en: 'Burnout and political backlash when teams realise the workload only ever grows.',
      da: 'Udbrændthed og politisk modreaktion når teams indser, at arbejdsbyrden kun vokser.',
    },
    recommendations: {
      en: 'Add a "what we stop" column to the portfolio review and revisit quarterly.',
      da: 'Tilføj en "hvad vi stopper med"-kolonne til portefølje-reviewet og genbesøg kvartalsvis.',
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Identify the caller with their JWT (anon client).
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResult, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userResult?.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userResult.user.id;

    // Service-role for writes (bypasses RLS while we set user_id ourselves).
    const admin = createClient(supabaseUrl, serviceKey);

    // Idempotency: return existing demo if any.
    const { data: existing } = await admin
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('is_demo', true)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      return new Response(JSON.stringify({ id: existing.id, reused: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: created, error: insertErr } = await admin
      .from('projects')
      .insert({
        user_id: userId,
        is_demo: true,
        name: DEMO_NAME,
        description: DEMO_DESCRIPTION,
        morphology: DEMO_MORPHOLOGY,
        dna_code: DEMO_DNA,
        status: 'active',
        team_size: 18,
      })
      .select('id')
      .single();

    if (insertErr || !created) {
      console.error('insert project failed', insertErr);
      return new Response(JSON.stringify({ error: 'Could not create demo project' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const projectId = created.id;

    const blindSpotRows = DEMO_BLIND_SPOTS.map((bs) => ({
      project_id: projectId,
      title: bs.title,
      description: bs.description,
      priority: bs.priority,
      confidence: bs.confidence,
      evidence: bs.evidence,
      consequences: bs.consequences,
      recommendations: bs.recommendations,
      status: 'unaddressed',
    }));

    const { error: bsErr } = await admin.from('blind_spots').insert(blindSpotRows);
    if (bsErr) console.warn('blind_spots insert failed', bsErr);

    return new Response(JSON.stringify({ id: projectId, reused: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('seed-demo-project error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
