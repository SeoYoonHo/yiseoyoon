import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function GET() {
  try {
    const metadataKey = 'Works/Drawing/metadata.json';

    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });

      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();

      if (!metadataContent) {
        return NextResponse.json({
          success: true,
          artworks: []
        });
      }

      const artworks = JSON.parse(metadataContent);

      // 상대 경로를 전체 URL로 변환
      const artworksWithUrls = artworks.map((artwork: any) => ({
        ...artwork,
        originalImage: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${artwork.originalImage}`,
        thumbnailImage: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${artwork.thumbnailImage}`,
      }));

      return NextResponse.json({
        success: true,
        works: artworksWithUrls
      });

    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        // 메타데이터 파일이 없는 경우 빈 배열 반환
        return NextResponse.json({
          success: true,
          works: []
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Drawing 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Drawing 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
