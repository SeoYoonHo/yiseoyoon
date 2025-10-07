import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

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
    const { textId, title, s3Key } = await request.json();

    if (!textId || !s3Key) {
      return NextResponse.json({ success: false, error: '텍스트 ID와 S3 키가 필요합니다.' }, { status: 400 });
    }

    const metadataKey = `Text/metadata.json`;

    let existingMetadata: { id: string; title: string; fileKey: string; createdAt: string }[] = [];
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();
      if (metadataContent) {
        const parsed = JSON.parse(metadataContent);
        // 배열인지 확인하고, 아니면 빈 배열로 초기화
        existingMetadata = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        console.log('metadata.json not found, creating new one.');
        existingMetadata = [];
      } else {
        throw error;
      }
    }

    const metadata = {
      id: textId,
      title: title || '',
      fileKey: s3Key,
      createdAt: new Date().toISOString(),
    };

    existingMetadata.push(metadata);

    const putMetadataCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(existingMetadata, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putMetadataCommand);

    return NextResponse.json({
      success: true,
      message: '텍스트 메타데이터가 성공적으로 업데이트되었습니다.',
      text: metadata,
    });

  } catch (error) {
    console.error('텍스트 메타데이터 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '메타데이터 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
