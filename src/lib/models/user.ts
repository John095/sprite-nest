import { supabase } from '../supabase/client';
import type { Database } from '../types';

export interface User {
  id: number;
  email?: string;
  username?: string;
  created_at: string;
}
export async function getUser(userId: number) {  // Change parameter type to number
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw new Error(error.message);
  return data;
}