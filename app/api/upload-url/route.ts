import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    console.log('API /upload-url: Received request for', filePath);
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

    console.log('API /upload-url: Getting user from session...');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('API /upload-url: No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure users can only generate signed upload URLs for their own folders
    if (!filePath.startsWith(`${user.id}/`)) {
      console.log('API /upload-url: User path mismatch, returning 403');
      return NextResponse.json({ error: 'Unauthorized path' }, { status: 403 });
    }

    console.log('API /upload-url: Calling createSignedUploadUrl...');
    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUploadUrl(filePath);

    console.log('API /upload-url: createSignedUploadUrl returned. Error?', error);
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
