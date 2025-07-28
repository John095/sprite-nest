import { supabaseClient } from '../supabase/client';

export async function logDownload(assetId: string, userId?: string) {
  const { error } = await supabaseClient
    .from('downloads')
    .insert([{ asset_id: assetId, user_id: userId || 'anonymous' }]);
  if (error) throw new Error(error.message);
}