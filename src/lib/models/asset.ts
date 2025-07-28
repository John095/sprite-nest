import { supabaseClient } from '../supabase/client';
import type { Asset } from '../types';

export async function createAsset(userId: string, assetData: Omit<Asset, 'id' | 'user_id' | 'created_at'>): Promise<Asset> {
  const { data, error } = await supabaseClient
    .from('assets')
    .insert([{ user_id: userId, ...assetData }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAssets(filters: Partial<Pick<Asset, 'category' | 'engine'>> & { search?: string }): Promise<Asset[]> {
  let query = supabaseClient.from('assets').select('*');
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.engine) query = query.eq('engine', filters.engine);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}