import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

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
      emailRedirectTo: `${window.location.origin}/verified`
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${window.location.origin}/oauth-callback`
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'twitter',
    options: {
      redirectTo: `${window.location.origin}/oauth-callback`
    }
  });

  if (error) {
    console.error('Twitter OAuth error:', error.message);
    return { error: error.message };
  }

  return { data };
}

// Create user from OAuth session
export async function createUserFromOAuthSession() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.email) {
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
