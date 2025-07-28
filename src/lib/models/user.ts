import { supabaseClient } from '../supabase/client';
import type { Database } from '../types';

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export async function getUser(userId: string): Promise<User> {
  const { data, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}