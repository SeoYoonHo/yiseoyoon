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
    const { artworks } = await request.json();

    if (!artworks || artworks.length === 0) {
      return NextResponse.json({ success: false, error: '작품 정보가 필요합니다.' }, { status: 400 });
    }

    const metadataKey = `Works/Painting/metadata.json`;

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
    artworks.forEach((artwork: { 
      artworkId: string; 
      title: string; 
      year: string; 
      description: string; 
      originalKey: string;
      thumbnailSmallKey: string;
      thumbnailMediumKey: string;
      thumbnailLargeKey: string;
    }) => {
      const metadata = {
        id: artwork.artworkId,
        title: artwork.title,
        year: artwork.year,
        description: artwork.description,
        originalImage: artwork.originalKey,
        thumbnailImage: artwork.thumbnailSmallKey, // Small 썸네일을 기본으로 사용
        thumbnailSmall: artwork.thumbnailSmallKey,
        thumbnailMedium: artwork.thumbnailMediumKey,
        thumbnailLarge: artwork.thumbnailLargeKey,
        category: 'painting',
        createdAt: new Date().toISOString(),
      };
      existingMetadata.push(metadata);
    });

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
      uploadedCount: artworks.length,
    });

  } catch (error) {
    console.error('메타데이터 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '메타데이터 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
