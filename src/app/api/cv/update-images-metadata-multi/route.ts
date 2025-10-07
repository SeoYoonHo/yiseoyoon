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
    const { images } = await request.json();

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ success: false, error: '이미지 데이터가 필요합니다.' }, { status: 400 });
    }

    const metadataKey = `CV/metadata.json`;

    // 기존 메타데이터 가져오기
    let existingMetadata: { images: string[] } = { images: [] };
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();
      if (metadataContent) {
        existingMetadata = JSON.parse(metadataContent) as { images: string[] };
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        console.log('CV metadata.json not found, creating new one.');
      } else {
        throw error;
      }
    }

    // 새로운 이미지들을 기존 목록에 추가
    existingMetadata.images.push(...images);

    // 업데이트된 메타데이터 저장
    const putMetadataCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(existingMetadata, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putMetadataCommand);

    return NextResponse.json({
      success: true,
      message: `${images.length}개 이미지가 성공적으로 추가되었습니다.`,
      totalImages: existingMetadata.images.length,
    });

  } catch (error) {
    console.error('CV 다중 이미지 메타데이터 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '메타데이터 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
