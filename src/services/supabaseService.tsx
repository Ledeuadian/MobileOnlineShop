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

  // Register user with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Also insert into public.USER table with auth_user_id
  const authUserId = data?.user?.id;
  const { error: userTableError } = await supabase
    .from('USER')
    .insert([{ email, userTypeCode: userTypeCode ?? null, auth_user_id: authUserId }]);
  if (userTableError) {
    return { error: userTableError.message };
  }

  return { data };
}