import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'analyst' | 'user';
  created_at: string;
  updated_at: string;
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
  supabaseClient: SupabaseClient;
  serviceClient: SupabaseClient;
}

export interface AuthError {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INTERNAL_ERROR';
  message: string;
  status: number;
}

/**
 * Initialize a Supabase service client using environment secrets
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service credentials in environment');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Initialize a Supabase client for the authenticated user
 */
export function createUserClient(authHeader: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials in environment');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}

/**
 * Fetch the caller's user profile and role from user_profiles table
 */
async function fetchUserProfile(supabaseClient: SupabaseClient, userId: string): Promise<UserProfile | null> {
  const { data: profile, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return profile;
}

/**
 * Log an action to the admin_audit_log table
 */
export async function logAuditAction(
  supabaseClient: SupabaseClient,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown>,
  userEmail?: string
): Promise<void> {
  try {
    await supabaseClient
      .from('admin_audit_log')
      .insert({
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details: {
          ...details,
          submitted_by: userEmail
        },
        created_by: userId
      });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Create an error response for auth failures
 */
export function createAuthErrorResponse(error: AuthError): Response {
  return new Response(
    JSON.stringify({ error: error.message }),
    { 
      status: error.status, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Authenticate the user and fetch their profile
 */
export async function authenticateRequest(
  authHeader: string | null
): Promise<{ context: AuthContext } | { error: AuthError }> {
  if (!authHeader) {
    return { 
      error: { 
        code: 'UNAUTHORIZED', 
        message: 'Authorization header required', 
        status: 401 
      } 
    };
  }

  try {
    // Create user client with auth header
    const supabaseClient = createUserClient(authHeader);

    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return { 
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Invalid or expired token', 
          status: 401 
        } 
      };
    }

    // Fetch user profile
    const profile = await fetchUserProfile(supabaseClient, user.id);
    
    if (!profile) {
      return { 
        error: { 
          code: 'FORBIDDEN', 
          message: 'User profile not found', 
          status: 403 
        } 
      };
    }

    // Create service client for privileged operations
    const serviceClient = createServiceClient();

    const context: AuthContext = {
      user: {
        id: user.id,
        email: user.email || ''
      },
      profile,
      supabaseClient,
      serviceClient
    };

    return { context };
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Authentication failed', 
        status: 500 
      } 
    };
  }
}

/**
 * Require specific roles for access
 */
export function requireRole(
  allowedRoles: ('admin' | 'analyst' | 'user')[]
) {
  return (context: AuthContext): { success: true } | { error: AuthError } => {
    if (!allowedRoles.includes(context.profile.role)) {
      return { 
        error: { 
          code: 'FORBIDDEN', 
          message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}. Current role: ${context.profile.role}`, 
          status: 403 
        } 
      };
    }

    return { success: true };
  };
}

/**
 * Require admin role only
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Require admin or analyst roles
 */
export const requireAdminOrAnalyst = requireRole(['admin', 'analyst']);

/**
 * Require any authenticated user
 */
export const requireAuthenticatedUser = requireRole(['admin', 'analyst', 'user']);

/**
 * Helper function to handle auth flow and role checking in Edge Functions
 */
export async function protectEndpoint(
  authHeader: string | null,
  roleChecker: (context: AuthContext) => { success: true } | { error: AuthError }
): Promise<{ context: AuthContext } | { error: AuthError }> {
  // First authenticate the user
  const authResult = await authenticateRequest(authHeader);
  
  if ('error' in authResult) {
    return authResult;
  }

  // Then check role requirements
  const roleResult = roleChecker(authResult.context);
  
  if ('error' in roleResult) {
    return roleResult;
  }

  return authResult;
}

/**
 * Common CORS headers for Edge Functions
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflight(): Response | null {
  return new Response(null, { headers: corsHeaders });
}