import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

interface Exhibition {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  photos: string[];
  createdAt: string;
}

export async function PUT(request: NextRequest) {
  try {
    const { exhibitionId, photoKeys } = await request.json();

    if (!exhibitionId || !photoKeys || !Array.isArray(photoKeys)) {
      return NextResponse.json({ error: 'exhibitionId and photoKeys array are required' }, { status: 400 });
    }

    const metadataKey = 'Exhibitions/metadata.json';
    let metadata: Record<string, Exhibition> = {};

    // 기존 metadata.json 가져오기
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString) as Record<string, Exhibition>;
      }
    } catch {
      return NextResponse.json({ error: 'Exhibition metadata not found' }, { status: 404 });
    }

    // 전시 존재 확인
    if (!metadata[exhibitionId]) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    // 사진 순서 업데이트
    metadata[exhibitionId].photos = photoKeys;

    // 업데이트된 metadata.json 업로드
    const putMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(putMetadataCommand);

    return NextResponse.json({
      success: true,
      message: '사진 순서가 업데이트되었습니다.',
    });

  } catch (error) {
    console.error('Photo reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder photos' }, { status: 500 });
  }
}
