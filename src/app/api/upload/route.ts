import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Session authorization check
    const roleCookie = req.cookies.get('portal_role')?.value || req.cookies.get('infotech_role')?.value;
    if (!roleCookie || (roleCookie !== 'ADMIN' && roleCookie !== 'WORKER')) {
      return NextResponse.json({ error: 'Unauthorized: Staff session required for file uploads' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const rawBucket = (formData.get('bucket') as string) || 'admissions';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Size limit check (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum 10MB limit' }, { status: 413 });
    }

    // MIME type whitelist
    const ALLOWED_MIME_TYPES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };

    const ext = ALLOWED_MIME_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `Unsupported file format (${file.type}). Only JPG, PNG, WEBP, and PDF files are allowed.` },
        { status: 415 }
      );
    }

    // Bucket whitelist
    const ALLOWED_BUCKETS = ['photos', 'dossiers', 'receipts', 'admissions'];
    const bucket = ALLOWED_BUCKETS.includes(rawBucket) ? rawBucket : 'admissions';

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate secure randomized filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}.${ext}`;

    // Ensure bucket exists
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
