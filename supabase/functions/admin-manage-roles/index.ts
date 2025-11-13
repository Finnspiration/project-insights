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
    const { userId, role, action } = await req.json();

    // Validate input
    if (!userId || !role || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, role, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['add', 'remove'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "add" or "remove"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validRoles = ['super_admin', 'admin', 'user'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be one of: super_admin, admin, user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Check if user is super admin (only super admins can manage roles)
    const { data: isSuperAdmin, error: superAdminCheckError } = await supabaseAdmin
      .rpc('is_super_admin', { _user_id: user.id });

    if (superAdminCheckError || !isSuperAdmin) {
      console.error('Super admin check failed:', superAdminCheckError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Super admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Super admin ${user.email} attempting to ${action} role ${role} for user ${userId}`);

    // Prevent removing super_admin from self
    if (action === 'remove' && role === 'super_admin' && userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot remove super_admin role from yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add') {
      // Add role
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate error
        if (error.code === '23505') {
          console.log('User already has this role');
          return new Response(
            JSON.stringify({ message: 'User already has this role', success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.error('Error adding role:', error);
        throw new Error('Failed to add role');
      }

      console.log(`Successfully added role ${role} to user ${userId}`);
      return new Response(
        JSON.stringify({ message: 'Role added successfully', data, success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Remove role
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        console.error('Error removing role:', error);
        throw new Error('Failed to remove role');
      }

      console.log(`Successfully removed role ${role} from user ${userId}`);
      return new Response(
        JSON.stringify({ message: 'Role removed successfully', success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in admin-manage-roles function:', error);
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
