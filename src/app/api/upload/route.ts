import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 파일명을 background로 고정하고 원본 확장자 유지
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${folder}/background.${fileExtension}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // S3에 직접 업로드 (캐시 헤더 포함)
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable', // 1년 캐시
      Metadata: {
        'upload-timestamp': new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    const publicUrl = getS3ImageUrl(key);
    
    return NextResponse.json({ 
      success: true,
      key,
      publicUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
