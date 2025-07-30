import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { createAsset } from '../../../lib/models/asset';
import { requireAuth } from '../../../lib/middleware/auth';

import type { NextRequest } from 'next/server';

function isUser(obj: unknown): obj is { id: string } {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!isUser(user)) return user;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as '3D' | 'animation' | 'audio';
    const engine = formData.get('engine') as 'Unity' | 'Unreal' | 'Other';
    const price = parseFloat(formData.get('price') as string);
    const license = formData.get('license') as 'CC0' | 'commercial';

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.storage
      .from('assets')
      .upload(`public/${user.id}/${file.name}`, file);
      
    if (error) throw new Error(error.message);

    const asset = await createAsset(user.id, {
      title,
      description,
      category,
      engine,
      price,
      license,
      file_url: data.path,
      thumbnail_url: null,
    });

    return NextResponse.json({ message: 'Asset uploaded', asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}