import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Do nothing
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure users can only generate signed upload URLs for their own folders
    if (!filePath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Unauthorized path' }, { status: 403 });
    }

    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error('Failed to create signed upload url:', error);
      return NextResponse.json({ error: error?.message || 'Failed to generate signed url' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path: data.path });
  } catch (err: any) {
    console.error('Upload URL API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
