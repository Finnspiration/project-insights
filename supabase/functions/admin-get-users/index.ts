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

    // Check if user is admin using RPC call to security definer function
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin
      .rpc('is_admin', { _user_id: user.id });

    if (adminCheckError || !isAdmin) {
      console.error('Admin check failed:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified, fetching users:', user.email);

    // Fetch all users from auth.users
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error('Error fetching auth users:', authUsersError);
      throw new Error('Failed to fetch users');
    }

    // Fetch all user profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Fetch all user roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Fetch project counts per user
    const { data: projectCounts, error: projectCountsError } = await supabaseAdmin
      .from('projects')
      .select('user_id');

    if (projectCountsError) {
      console.error('Error fetching project counts:', projectCountsError);
    }

    // Aggregate data
    const users = authUsers.users.map((authUser) => {
      const profile = profiles?.find(p => p.id === authUser.id);
      const userRoles = roles?.filter(r => r.user_id === authUser.id).map(r => r.role) || [];
      const projectCount = projectCounts?.filter(p => p.user_id === authUser.id).length || 0;

      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        roles: userRoles,
        profile: profile ? {
          preferred_language: profile.preferred_language,
          subscription_tier: profile.subscription_tier,
          subscription_status: profile.subscription_status,
          ai_messages_used_this_month: profile.ai_messages_used_this_month,
        } : null,
        project_count: projectCount,
      };
    });

    console.log(`Successfully fetched ${users.length} users`);

    return new Response(
      JSON.stringify({ users }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in admin-get-users function:', error);
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
