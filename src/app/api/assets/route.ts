import { NextResponse } from 'next/server';
import { getAssets } from '../../../lib/models/asset';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      category: searchParams.get('category') as string | undefined,
      engine: searchParams.get('engine') as string | undefined,
      search: searchParams.get('search') as string | undefined,
    };
    const assets = await getAssets(filters);
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}