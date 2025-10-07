import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType } = await request.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ success: false, error: '파일명과 파일 타입이 필요합니다.' }, { status: 400 });
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    
    // 원본 이미지 키
    const originalKey = `CV/Original/${timestamp}.${fileExtension}`;
    // 썸네일 이미지 키
    const thumbnailKey = `CV/Thumbnail/${timestamp}.${fileExtension}`;

    // 원본 이미지용 Presigned URL
    const putOriginalCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalKey,
      ContentType: fileType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });
    const originalPresignedUrl = await getSignedUrl(s3Client, putOriginalCommand, { expiresIn: 300 });

    // 썸네일 이미지용 Presigned URL
    const putThumbnailCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailKey,
      ContentType: fileType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });
    const thumbnailPresignedUrl = await getSignedUrl(s3Client, putThumbnailCommand, { expiresIn: 300 });

    return NextResponse.json({
      success: true,
      originalPresignedUrl,
      thumbnailPresignedUrl,
      originalKey,
      thumbnailKey,
      imageId: timestamp.toString(),
    });

  } catch (error) {
    console.error('CV Presigned URL 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Presigned URL 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
