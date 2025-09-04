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
          id: data.user.id,
          email: data.user.email,
          userTypeCode: userTypeCode || 2, // Default to DTI user
          approval_status: userTypeCode && userTypeCode !== 2 ? 'pending' : 'approved' // DTI users auto-approved
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

export default supabase;
