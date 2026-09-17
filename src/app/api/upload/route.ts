import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'admissions';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = file.name.split('.').pop() || 'tmp';
    const filename = `${uniqueSuffix}.${originalExt}`;

    // Ensure bucket exists, if not create it
    const { data: buckets } = await supabaseServer.storage.listBuckets();
    const bucketExists = buckets?.find((b) => b.name === bucket);
    
    if (!bucketExists) {
      await supabaseServer.storage.createBucket(bucket, {
        public: true,
      });
    }

    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabaseServer.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'File upload failed';
    console.error('Upload Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
