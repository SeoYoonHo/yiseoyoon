import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

function sanitizeMetadataValue(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const year = formData.get('year') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    // 파일 크기 제한 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '파일 크기는 50MB를 초과할 수 없습니다.' }, { status: 400 });
    }

    // 파일을 ArrayBuffer로 변환
    const buffer = Buffer.from(await file.arrayBuffer());

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const originalKey = `Works/Drawing/Original/${timestamp}.${fileExtension}`;

    // 원본 이미지 업로드
    const originalUploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalKey,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        title: sanitizeMetadataValue(title || ''),
        year: sanitizeMetadataValue(year || ''),
        description: sanitizeMetadataValue(description || ''),
        category: sanitizeMetadataValue('drawing'),
        uploadedAt: sanitizeMetadataValue(new Date().toISOString()),
      },
    });

    await s3Client.send(originalUploadCommand);

    // 메타데이터 파일 업데이트
    const metadata = {
      id: timestamp.toString(),
      title: title || '',
      year: year || '',
      description: description || '',
      originalImage: originalKey,
      thumbnailImage: originalKey, // 원본을 썸네일로도 사용
      category: 'drawing',
      createdAt: new Date().toISOString(),
    };

    const metadataKey = `Works/Drawing/metadata.json`;
    
    // 기존 메타데이터 불러오기
    let existingMetadata = [];
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const existingData = await response.Body?.transformToString();
      if (existingData) {
        existingMetadata = JSON.parse(existingData);
      }
    } catch (error) {
      console.log('메타데이터 파일이 없습니다. 새로 생성합니다.');
    }

    // 새 메타데이터 추가
    existingMetadata.push(metadata);

    // 메타데이터 파일 업로드
    const metadataUploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(existingMetadata, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(metadataUploadCommand);

    console.log('Drawing uploaded successfully:', metadata);

    return NextResponse.json({
      success: true,
      message: 'Drawing 작품이 성공적으로 업로드되었습니다.',
      artwork: metadata
    });

  } catch (error) {
    console.error('Drawing 업로드 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Drawing 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}