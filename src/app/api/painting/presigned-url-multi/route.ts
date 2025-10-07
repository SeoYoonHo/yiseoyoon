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
    const { files, defaultTitle, defaultYear, defaultDescription } = await request.json();

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: '파일 정보가 필요합니다.' }, { status: 400 });
    }

    const presignedUrls = [];
    const baseTimestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = baseTimestamp + i;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const s3Key = `Works/Painting/Original/${timestamp}.${fileExtension}`;
      
      const artworkTitle = files.length > 1 ? `${defaultTitle} ${i + 1}` : defaultTitle;

      const putObjectCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        ContentType: file.type,
        Metadata: {
          title: sanitizeMetadataValue(artworkTitle),
          year: sanitizeMetadataValue(defaultYear),
          description: sanitizeMetadataValue(defaultDescription),
          category: sanitizeMetadataValue('painting'),
          uploadedAt: sanitizeMetadataValue(new Date().toISOString()),
        },
      });

      const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 300 });

      presignedUrls.push({
        presignedUrl,
        s3Key,
        artworkId: timestamp.toString(),
        fileName: file.name,
        fileType: file.type,
        title: artworkTitle,
      });
    }

    return NextResponse.json({
      success: true,
      presignedUrls,
    });

  } catch (error) {
    console.error('멀티 Presigned URL 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Presigned URL 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}