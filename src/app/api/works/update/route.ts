import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, date, description } = body;

    if (!id || !title || !date) {
      return NextResponse.json({ error: 'ID, title, and date are required' }, { status: 400 });
    }

    const metadataKey = 'Works/metadata.json';

    // 1. metadata.json 가져오기
    let metadata: Record<string, any> = {};
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString);
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }

    // 2. 해당 작품 정보 확인
    if (!metadata[id]) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    // 3. 작품 정보 업데이트 (이미지 경로는 유지)
    metadata[id] = {
      ...metadata[id],
      title,
      date,
      description: description || '',
    };

    // 4. 업데이트된 metadata.json 업로드
    try {
      const putMetadataCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
        CacheControl: 'public, max-age=0, must-revalidate',
      });
      await s3Client.send(putMetadataCommand);
    } catch (updateError) {
      console.error('Failed to update metadata:', updateError);
      return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      artwork: metadata[id],
      message: 'Artwork updated successfully'
    });

  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

