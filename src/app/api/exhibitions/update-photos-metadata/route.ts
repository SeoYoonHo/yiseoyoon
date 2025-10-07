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
    const { exhibitionId, photos } = await request.json();
    console.log('Exhibition 메타데이터 업데이트 요청:', { exhibitionId, photos });

    if (!exhibitionId || !photos || photos.length === 0) {
      return NextResponse.json({ success: false, error: '전시 ID와 사진 정보가 필요합니다.' }, { status: 400 });
    }

    const metadataKey = 'Exhibitions/metadata.json';

    let metadata: Record<string, { photos?: string[]; [key: string]: unknown }> = {};
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();
      if (metadataContent) {
        metadata = JSON.parse(metadataContent) as Record<string, { photos?: string[]; [key: string]: unknown }>;
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        console.log('metadata.json not found, creating new one.');
      } else {
        throw error;
      }
    }

    // 해당 전시의 photos 배열에 새 사진들 추가 (썸네일 키 사용, 모달에서는 Original로 변환)
    const photoKeys = photos.map((photo: { thumbnailKey?: string; s3Key?: string }) => photo.thumbnailKey || photo.s3Key);
    
    if (metadata[exhibitionId]) {
      metadata[exhibitionId].photos = [...(metadata[exhibitionId].photos || []), ...photoKeys];
    }

    console.log('업데이트될 메타데이터:', metadata);

    const putMetadataCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putMetadataCommand);

    return NextResponse.json({
      success: true,
      message: '전시 사진 메타데이터가 성공적으로 업데이트되었습니다.',
      uploadedCount: photos.length,
    });

  } catch (error) {
    console.error('전시 사진 메타데이터 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '메타데이터 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
