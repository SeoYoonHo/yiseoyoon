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
    const { fileName, fileType, folder } = await request.json();

    if (!fileName || !fileType || !folder) {
      return NextResponse.json({ success: false, error: '파일명, 파일 타입, 폴더가 필요합니다.' }, { status: 400 });
    }

    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const s3Key = `${folder}/Background/background.${fileExtension}`;

    const putObjectCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 300 });

    return NextResponse.json({
      success: true,
      presignedUrl,
      s3Key,
    });

  } catch (error) {
    console.error('Background Presigned URL 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Presigned URL 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
