// Shared authentication and ownership helpers for PRISM edge functions.
//
// Most functions in this project need the service-role key (to read document
// content and write analysis results across tables), which bypasses RLS.
// `verify_jwt` only proves that *some* signed-in user is calling — it says
// nothing about whether that user owns the project or document referenced in
// the request body. Every function that touches project-scoped data must
// therefore call requireUser() + assertOwnsProject()/assertOwnsDocument().

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

export type { SupabaseClient };

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Turns a thrown HttpError into its status code; anything else becomes a 500. */
export function errorResponse(error: unknown, fallbackMessage = 'Internal server error'): Response {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message }, error.status);
  }
  console.error(fallbackMessage, error);
  return jsonResponse(
    { error: error instanceof Error ? error.message : fallbackMessage },
    500,
  );
}

/** Service-role client. Bypasses RLS — only use after an ownership check. */
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Client acting as the calling user. RLS applies — safe for user-scoped reads/writes. */
export function userClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new HttpError(401, 'Missing Authorization header');
  }
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

export interface AuthedUser {
  id: string;
  email?: string;
}

/** Verifies the bearer token and returns the caller. Throws HttpError(401) otherwise. */
export async function requireUser(req: Request, admin?: SupabaseClient): Promise<AuthedUser> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new HttpError(401, 'Missing Authorization header');
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new HttpError(401, 'Malformed Authorization header');
  }

  const client = admin ?? serviceClient();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data?.user) {
    console.warn('Authentication failed:', error?.message);
    throw new HttpError(401, 'Unauthorized');
  }

  return { id: data.user.id, email: data.user.email ?? undefined };
}

/**
 * Confirms the user owns the project. Returns 404 for unknown ids and 403 for
 * someone else's project — never reveals whether an id exists to a non-owner.
 */
export async function assertOwnsProject(
  admin: SupabaseClient,
  projectId: string,
  userId: string,
): Promise<void> {
  if (!projectId) {
    throw new HttpError(400, 'Project ID is required');
  }

  const { data, error } = await admin
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    console.error('Ownership lookup failed for project', projectId, error);
    throw new HttpError(500, 'Failed to verify project access');
  }

  if (!data || data.user_id !== userId) {
    throw new HttpError(data ? 403 : 404, 'Project not found');
  }
}

/**
 * Confirms the user owns the project the document belongs to.
 * Returns the document's project_id so callers can reuse it.
 */
export async function assertOwnsDocument(
  admin: SupabaseClient,
  documentId: string,
  userId: string,
): Promise<string> {
  if (!documentId) {
    throw new HttpError(400, 'Document ID is required');
  }

  const { data, error } = await admin
    .from('documents')
    .select('id, project_id, projects!inner(user_id)')
    .eq('id', documentId)
    .maybeSingle();

  if (error) {
    console.error('Ownership lookup failed for document', documentId, error);
    throw new HttpError(500, 'Failed to verify document access');
  }

  const ownerId = (data as { projects?: { user_id?: string } } | null)?.projects?.user_id;

  if (!data || ownerId !== userId) {
    throw new HttpError(data ? 403 : 404, 'Document not found');
  }

  return data.project_id as string;
}
