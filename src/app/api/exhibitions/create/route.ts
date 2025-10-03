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
  photos: string[]; // S3 키 배열
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, startDate, endDate, location, description } = body;

    if (!title || !startDate || !endDate || !location) {
      return NextResponse.json({ 
        error: 'Title, start date, end date, and location are required' 
      }, { status: 400 });
    }

    // 전시 ID 생성 (제목 기반 + 타임스탬프)
    const safeTitle = title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_가-힣-]/g, '');
    const exhibitionId = safeTitle || `exhibition_${Date.now()}`;

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
    } catch (getError) {
      const error = getError as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        console.log('No existing exhibitions metadata, creating new one');
      } else {
        console.error('Error fetching exhibitions metadata:', getError);
      }
    }

    // 중복 ID 체크
    if (metadata[exhibitionId]) {
      return NextResponse.json({ 
        error: 'Exhibition with this title already exists' 
      }, { status: 400 });
    }

    // 새 전시 정보 추가
    metadata[exhibitionId] = {
      id: exhibitionId,
      title,
      startDate,
      endDate,
      location,
      description: description || '',
      photos: [],
      createdAt: new Date().toISOString(),
    };

    // metadata.json 업로드
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
      exhibition: metadata[exhibitionId],
      message: 'Exhibition created successfully',
    });

  } catch (error) {
    console.error('Exhibition creation error:', error);
    return NextResponse.json({ error: 'Failed to create exhibition' }, { status: 500 });
  }
}

