import { NextResponse } from 'next/server';
import { logDownload } from '../../../lib/models/download';
import { requireAuth } from '../../../lib/middleware/auth';

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { assetId } = await request.json();

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    await logDownload(assetId, user?.id);
    return NextResponse.json({ message: 'Download logged' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}