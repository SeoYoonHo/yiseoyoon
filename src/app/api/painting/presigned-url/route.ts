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

function sanitizeMetadataValue(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, title, year, description } = await request.json();
    console.log('Painting Presigned URL 요청:', { fileName, fileType, title, year, description });

    if (!fileName || !fileType) {
      return NextResponse.json({ success: false, error: '파일명과 파일 타입이 필요합니다.' }, { status: 400 });
    }

    // 파일 확장자 추출
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    
    // 원본 이미지 키
    const originalKey = `Works/Painting/Original/${timestamp}.${fileExtension}`;
    // 썸네일 이미지 키들
    const thumbnailSmallKey = `Works/Painting/Thumbnail/Small/${timestamp}.${fileExtension}`;
    const thumbnailMediumKey = `Works/Painting/Thumbnail/Medium/${timestamp}.${fileExtension}`;
    const thumbnailLargeKey = `Works/Painting/Thumbnail/Large/${timestamp}.${fileExtension}`;

    console.log('Painting S3 키 생성:', { originalKey, thumbnailSmallKey, thumbnailMediumKey, thumbnailLargeKey });

    // 원본 이미지용 Presigned URL
    const putOriginalCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalKey,
      ContentType: fileType,
      Metadata: {
        title: sanitizeMetadataValue(title || ''),
        year: sanitizeMetadataValue(year || ''),
        description: sanitizeMetadataValue(description || ''),
        category: sanitizeMetadataValue('painting'),
        uploadedAt: sanitizeMetadataValue(new Date().toISOString()),
      },
    });
    const originalPresignedUrl = await getSignedUrl(s3Client, putOriginalCommand, { expiresIn: 300 });

    // 썸네일 이미지용 Presigned URLs
    const putThumbnailSmallCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailSmallKey,
      ContentType: fileType,
    });
    const thumbnailSmallPresignedUrl = await getSignedUrl(s3Client, putThumbnailSmallCommand, { expiresIn: 300 });

    const putThumbnailMediumCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailMediumKey,
      ContentType: fileType,
    });
    const thumbnailMediumPresignedUrl = await getSignedUrl(s3Client, putThumbnailMediumCommand, { expiresIn: 300 });

    const putThumbnailLargeCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbnailLargeKey,
      ContentType: fileType,
    });
    const thumbnailLargePresignedUrl = await getSignedUrl(s3Client, putThumbnailLargeCommand, { expiresIn: 300 });

    console.log('Painting Presigned URLs 생성 완료');

    return NextResponse.json({
      success: true,
      originalPresignedUrl,
      thumbnailSmallPresignedUrl,
      thumbnailMediumPresignedUrl,
      thumbnailLargePresignedUrl,
      originalKey,
      thumbnailSmallKey,
      thumbnailMediumKey,
      thumbnailLargeKey,
      artworkId: timestamp.toString(),
    });

  } catch (error) {
    console.error('Presigned URL 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Presigned URL 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
