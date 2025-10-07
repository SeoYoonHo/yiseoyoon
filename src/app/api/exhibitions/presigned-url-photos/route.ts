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
    const { files, exhibitionId } = await request.json();
    console.log('Exhibition Presigned URL 요청:', { files, exhibitionId });

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: '파일 정보가 필요합니다.' }, { status: 400 });
    }

    if (!exhibitionId) {
      return NextResponse.json({ success: false, error: '전시 ID가 필요합니다.' }, { status: 400 });
    }

    const presignedUrls = [];
    const baseTimestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = baseTimestamp + i;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      
      // 원본 이미지 키
      const originalKey = `Exhibitions/${exhibitionId}/Original/${timestamp}.${fileExtension}`;
      // 썸네일 이미지 키
      const thumbnailKey = `Exhibitions/${exhibitionId}/Thumbnail/${timestamp}.${fileExtension}`;

      console.log(`파일 ${i + 1} S3 키 생성:`, { originalKey, thumbnailKey });

      // 원본 이미지용 Presigned URL
      const putOriginalCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: originalKey,
        ContentType: file.type,
      });
      const originalPresignedUrl = await getSignedUrl(s3Client, putOriginalCommand, { expiresIn: 300 });

      // 썸네일 이미지용 Presigned URL
      const putThumbnailCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: thumbnailKey,
        ContentType: file.type,
      });
      const thumbnailPresignedUrl = await getSignedUrl(s3Client, putThumbnailCommand, { expiresIn: 300 });

      console.log(`파일 ${i + 1} Presigned URLs 생성 완료`);

      presignedUrls.push({
        originalPresignedUrl,
        thumbnailPresignedUrl,
        originalKey,
        thumbnailKey,
        fileName: file.name,
        fileType: file.type,
      });
    }

    console.log('Exhibition Presigned URLs 생성 완료:', presignedUrls);

    return NextResponse.json({
      success: true,
      presignedUrls,
    });

  } catch (error) {
    console.error('Exhibition Presigned URL 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Presigned URL 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
