import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect('/login?error=' + encodeURIComponent(error.message));
    }
  }

  return NextResponse.redirect('/assets')
}  