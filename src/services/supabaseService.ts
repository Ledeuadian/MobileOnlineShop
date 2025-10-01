import { createClient } from '@supabase/supabase-js';

// Hardcode values for mobile build debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jugtklulvvpcpfsrdxom.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Z3RrbHVsdnZwY3Bmc3JkeG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzE1MzksImV4cCI6MjA3MjIwNzUzOX0.odMPsM_N9glo3J-1aUSA6OSlRGfVT5X5O2SSFvZa9CQ';

// Detect mobile environment
const isMobile = () => {
  return window.location.protocol === 'capacitor:' || 
         'Capacitor' in window;
};

// Configure mobile-aware redirect URLs
export const getRedirectUrl = (path: string) => {
  if (isMobile()) {
    return `com.groceryshop.app://${path}`;
  } else {
    return `${window.location.origin}/${path}`;
  }
};

// Add error checking for environment variables
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);
console.log('Mobile environment detected:', isMobile());

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  alert('Configuration error: Missing database credentials');
}

// Create client with mobile-aware configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
});

// Example test query: fetch all users from USER table
export async function fetchUsers() {
  const { data, error } = await supabase
    .from('USER')
    .select('*');
  if (error) throw error;
  return data;
}

// Fetch all user types from USER_TYPE table
export async function fetchUserTypes() {
  const { data, error } = await supabase
    .from('USER_TYPE')
    .select('*');
  if (error) throw error;
  return data;
}

// Fetch all user types from USER_TYPE table and log to console
export async function fetchAndLogUserTypes() {
  const { data, error } = await supabase
    .from('USER_TYPE')
    .select('*');
  if (error) {
    console.error('Error fetching USER_TYPE:', error.message);
    return;
  }
  console.log('Fetched USER_TYPE:', data);
  return data;
}

// Update a specific user's userTypeCode and approval status
export async function updateUserTypeAndApproval(email: string, userTypeCode: number, approvalStatus: string = 'pending') {
  const { data, error } = await supabase
    .from('USER')
    .update({ 
      userTypeCode: userTypeCode,
      approval_status: approvalStatus
    })
    .eq('email', email);
  
  if (error) {
    console.error('Error updating user:', error.message);
    return { error };
  }
  
  console.log('User updated successfully:', data);
  return { data };
}

// Check user approval status and userTypeCode
export async function checkUserApprovalStatus(email: string) {
  const { data, error } = await supabase
    .from('USER')
    .select('userTypeCode, approval_status')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Error checking user approval status:', error.message);
    return { error };
  }
  
  console.log('User approval status:', data);
  return { data };
}

// Approve a user (set approval_status to 'approved')
export async function approveUser(email: string) {
  const { data, error } = await supabase
    .from('USER')
    .update({ approval_status: 'approved' })
    .eq('email', email);
  
  if (error) {
    console.error('Error approving user:', error.message);
    return { error };
  }
  
  console.log('User approved successfully:', data);
  return { data };
}

// Reject a user (set approval_status to 'rejected')
export async function rejectUser(email: string) {
  const { data, error } = await supabase
    .from('USER')
    .update({ approval_status: 'rejected' })
    .eq('email', email);
  
  if (error) {
    console.error('Error rejecting user:', error.message);
    return { error };
  }
  
  console.log('User rejected successfully:', data);
  return { data };
}

// Get all users pending approval
export async function getPendingUsers() {
  const { data, error } = await supabase
    .from('USER')
    .select('*')
    .eq('approval_status', 'pending')
    .in('userTypeCode', [2, 3]); // DTI and Store users only
  
  if (error) {
    console.error('Error fetching pending users:', error.message);
    return { error };
  }
  
  return { data };
}

// Test Supabase connection by fetching current session
export async function testSupabaseConnection() {
  const { data, error } = await supabase.auth.getSession();
  console.log('Session:', data, 'Error:', error);
}

// Register a new user
export async function RegisterUser(email: string, password: string, confirmPassword: string, userTypeCode?: number) {
  // Input validation
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  // Check if email already exists in public.USER table
  const { data: existingUser } = await supabase
    .from('USER')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    return { error: 'Email address is already registered. Please use a different email or try logging in.' };
  }

  // Register user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl('verified')
    }
  });

  if (error) {
    console.error('Registration error:', error.message);
    return { error: error.message };
  }

  // If registration successful, insert into public.USER table with approval status
  if (data.user) {
    const { error: insertError } = await supabase
      .from('USER')
      .insert([
        { 
          auth_user_id: data.user.id,
          email: data.user.email,
          userTypeCode: userTypeCode || 2, // Default to DTI user
          approval_status: (userTypeCode === 2 || userTypeCode === 3) ? 'pending' : 'approved' // DTI and STORE users need approval
        }
      ]);

    if (insertError) {
      console.error('Error inserting user into USER table:', insertError.message);
      return { error: insertError.message };
    }
  }

  return { data, success: true };
}

// Function to manually create admin user (temporary)
export async function createAdminUser(email: string, password: string) {
  const result = await RegisterUser(email, password, password, 1);
  
  if (result.success) {
    console.log('Admin user created successfully!');
  } else {
    console.error('Failed to create admin user:', result.error);
  }
  
  return result;
}

// OAuth sign in with Facebook
export async function signInWithFacebook() {
  const redirectTo = getRedirectUrl('oauth-callback');
  console.log('Facebook OAuth redirect URL:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectTo
    }
  });

  if (error) {
    console.error('Facebook OAuth error:', error.message);
    return { error: error.message };
  }

  return { data };
}

// OAuth sign in with Twitter
export async function signInWithTwitter() {
  const redirectTo = getRedirectUrl('oauth-callback');
  console.log('Twitter OAuth redirect URL:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitter',
    options: {
      redirectTo: redirectTo
    }
  });

  if (error) {
    console.error('Twitter OAuth error:', error.message);
    return { error: error.message };
  }

  return { data };
}

// Create user from OAuth session, restoring session from OAuth callback fragment if present
export async function createUserFromOAuthSession() {
  // Check if we have an OAuth fragment in the URL (e.g., #access_token=...)
  let session = null;
  if (window && window.location) {
    console.log('[OAuth] Current URL:', window.location.href);
    console.log('[OAuth] Current hash:', window.location.hash);
    const fragment = window.location.hash.substring(1); // Remove '#'
    if (fragment) {
      console.log('[OAuth] Parsed fragment:', fragment);
      // Parse fragment into key-value pairs
      const params = new URLSearchParams(fragment);
      // Log all fragment params
      for (const [key, value] of params.entries()) {
        console.log(`[OAuth] Fragment param: ${key} = ${value}`);
      }
      // Supabase PKCE flow returns 'code' param for exchange
      const code = params.get('code');
      if (code) {
        console.log('[OAuth] Found code in fragment:', code);
        try {
          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('[OAuth] Error exchanging code for session:', error.message);
            return { error: error.message };
          }
          session = data.session;
          console.log('[OAuth] Session after code exchange:', session);
        } catch (err) {
          console.error('[OAuth] Unexpected error exchanging code for session:', err);
          return { error: 'Failed to exchange code for session' };
        }
      } else {
        console.warn('[OAuth] No code found in fragment.');
      }
    } else {
      console.warn('[OAuth] No fragment found in URL.');
    }
  }
  // Fallback: try to get session from Supabase
  if (!session) {
    console.log('[OAuth] No session from code exchange, trying supabase.auth.getSession()...');
    const { data } = await supabase.auth.getSession();
    session = data.session;
    console.log('[OAuth] Session from supabase.auth.getSession():', session);
  }
  if (!session?.user?.email) {
    console.error('[OAuth] No active OAuth session found. Session object:', session);
    return { error: 'No active OAuth session found' };
  }
  const userEmail = session.user.email;
  const authUserId = session.user.id;
  console.log('Checking for existing user with email:', userEmail);
  try {
    // First, check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('USER')
      .select('userId, email, auth_user_id, userTypeCode, approval_status')
      .eq('email', userEmail)
      .limit(1);
    if (checkError) {
      console.error('Error checking for existing user:', checkError.message);
      return { error: checkError.message };
    }
    // If user exists, return the first one found
    if (existingUser && existingUser.length > 0) {
      console.log('User already exists in USER table:', existingUser[0]);
      return { data: existingUser[0], message: 'User already exists' };
    }
    console.log('Creating new OAuth user for email:', userEmail);
    // Create new user in public.USER table
    const { data, error } = await supabase
      .from('USER')
      .insert([
        {
          auth_user_id: authUserId,
          email: userEmail,
          userTypeCode: 4, // Default to Shopper user for OAuth registrations
          approval_status: 'approved' // OAuth users auto-approved
        }
      ])
      .select()
      .single();
    if (error) {
      console.error('Error creating user from OAuth session:', error.message);
      // If it's a duplicate error, try to fetch the existing user again
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        console.log('Duplicate user detected, fetching existing user...');
        const { data: existingUserAfterError } = await supabase
          .from('USER')
          .select('userId, email, auth_user_id, userTypeCode, approval_status')
          .eq('email', userEmail)
          .limit(1);
        if (existingUserAfterError && existingUserAfterError.length > 0) {
          return { data: existingUserAfterError[0], message: 'User already exists' };
        }
      }
      return { error: error.message };
    }
    console.log('User created successfully from OAuth session:', data);
    return { data, success: true };
  } catch (err) {
    console.error('Unexpected error in OAuth user creation:', err);
    return { error: 'Failed to create or retrieve user account' };
  }
}

export default supabase;
