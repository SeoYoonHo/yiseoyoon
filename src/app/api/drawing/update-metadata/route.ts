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
    const { artworkId, title, year, description, originalKey, thumbnailSmallKey, thumbnailMediumKey, thumbnailLargeKey } = await request.json();

    if (!artworkId) {
      return NextResponse.json({ success: false, error: '작품 ID가 필요합니다.' }, { status: 400 });
    }

    // 메타데이터 생성
    const metadata = {
      id: artworkId,
      title: title || '',
      year: year || '',
      description: description || '',
      originalImage: originalKey || `Works/Drawing/Original/${artworkId}.jpg`,
      thumbnailImage: thumbnailSmallKey || `Works/Drawing/Thumbnail/Small/${artworkId}.jpg`,
      thumbnailSmall: thumbnailSmallKey || `Works/Drawing/Thumbnail/Small/${artworkId}.jpg`,
      thumbnailMedium: thumbnailMediumKey || `Works/Drawing/Thumbnail/Medium/${artworkId}.jpg`,
      thumbnailLarge: thumbnailLargeKey || `Works/Drawing/Thumbnail/Large/${artworkId}.jpg`,
      category: 'drawing',
      createdAt: new Date().toISOString(),
    };

    const metadataKey = `Works/Drawing/metadata.json`;

    // 기존 메타데이터 가져오기
    let existingMetadata = [];
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();
      if (metadataContent) {
        existingMetadata = JSON.parse(metadataContent);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        console.log('metadata.json not found, creating new one.');
      } else {
        throw error;
      }
    }

    // 새 메타데이터 추가
    existingMetadata.push(metadata);

    // 메타데이터 업데이트
    const putMetadataCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(existingMetadata, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putMetadataCommand);

    return NextResponse.json({
      success: true,
      message: '메타데이터가 성공적으로 업데이트되었습니다.',
      artwork: metadata,
    });

  } catch (error) {
    console.error('메타데이터 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '메타데이터 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
