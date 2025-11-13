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
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin
      .rpc('is_admin', { _user_id: user.id });

    if (adminCheckError || !isAdmin) {
      console.error('Admin check failed:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified, fetching stats:', user.email);

    // Fetch total users count
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    const totalUsers = authUsers?.users?.length || 0;

    if (authUsersError) {
      console.error('Error fetching users:', authUsersError);
    }

    // Fetch total projects count
    const { count: totalProjects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (projectsError) {
      console.error('Error fetching projects count:', projectsError);
    }

    // Fetch total documents count
    const { count: totalDocuments, error: documentsError } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (documentsError) {
      console.error('Error fetching documents count:', documentsError);
    }

    // Fetch subscription distribution
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const subscriptionDistribution = {
      free: 0,
      professional: 0,
      team: 0,
      enterprise: 0
    };

    profiles?.forEach(profile => {
      const tier = profile.subscription_tier || 'free';
      if (subscriptionDistribution.hasOwnProperty(tier)) {
        subscriptionDistribution[tier as keyof typeof subscriptionDistribution]++;
      }
    });

    // Fetch total AI messages used this month
    const { data: aiUsage, error: aiUsageError } = await supabaseAdmin
      .from('user_profiles')
      .select('ai_messages_used_this_month');

    if (aiUsageError) {
      console.error('Error fetching AI usage:', aiUsageError);
    }

    const totalAiMessagesUsed = aiUsage?.reduce((sum, profile) => 
      sum + (profile.ai_messages_used_this_month || 0), 0) || 0;

    // Fetch projects created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: projectsLast30Days, error: recentProjectsError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentProjectsError) {
      console.error('Error fetching recent projects:', recentProjectsError);
    }

    // Fetch active projects (status = 'active')
    const { count: activeProjects, error: activeProjectsError } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (activeProjectsError) {
      console.error('Error fetching active projects:', activeProjectsError);
    }

    const stats = {
      users: {
        total: totalUsers,
        // New users in last 30 days (we'd need to check created_at from auth.users)
        newLast30Days: 0 // This would require iterating through authUsers
      },
      projects: {
        total: totalProjects || 0,
        active: activeProjects || 0,
        createdLast30Days: projectsLast30Days || 0
      },
      documents: {
        total: totalDocuments || 0
      },
      subscriptions: subscriptionDistribution,
      ai: {
        totalMessagesUsed: totalAiMessagesUsed,
        averagePerUser: totalUsers > 0 ? Math.round(totalAiMessagesUsed / totalUsers) : 0
      }
    };

    console.log('Successfully compiled stats:', stats);

    return new Response(
      JSON.stringify({ stats }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in admin-get-stats function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
