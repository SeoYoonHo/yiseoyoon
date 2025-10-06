import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import sharp from 'sharp';

function sanitizeMetadataValue(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '');
}

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
    const { category } = await request.json();
    
    if (!category || !['painting', 'drawing'].includes(category)) {
      return NextResponse.json({ 
        success: false, 
        error: '카테고리는 painting 또는 drawing이어야 합니다.' 
      }, { status: 400 });
    }

    const categoryCapitalized = category.charAt(0).toUpperCase() + category.slice(1);
    const metadataKey = `Works/${categoryCapitalized}/metadata.json`;

    // 기존 메타데이터 불러오기
    let artworks = [];
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();
      if (metadataContent) {
        artworks = JSON.parse(metadataContent);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        return NextResponse.json({ 
          success: false, 
          error: '메타데이터를 찾을 수 없습니다.' 
        }, { status: 404 });
      }
      throw error;
    }

    let migratedCount = 0;
    const updatedArtworks = [];

    for (const artwork of artworks) {
      console.log(`작품 ${artwork.id} 확인: thumbnailSmall = ${artwork.thumbnailSmall}`);
      // 반응형 썸네일이 없는 경우에만 마이그레이션
      if (!artwork.thumbnailSmall) {
        console.log(`작품 ${artwork.id} 마이그레이션 시작`);
        try {
          // 원본 이미지 가져오기
          const originalKey = artwork.originalImage;
          const getOriginalCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: originalKey,
          });
          const originalResponse = await s3Client.send(getOriginalCommand);
          const originalBuffer = Buffer.from(await originalResponse.Body?.transformToByteArray() || []);

          // 새로운 썸네일 키 생성
          const timestamp = artwork.id;
          const thumbnailSmallKey = `Works/${categoryCapitalized}/Thumbnail/Small/${timestamp}.jpg`;
          const thumbnailMediumKey = `Works/${categoryCapitalized}/Thumbnail/Medium/${timestamp}.jpg`;
          const thumbnailLargeKey = `Works/${categoryCapitalized}/Thumbnail/Large/${timestamp}.jpg`;

          // 반응형 썸네일 생성 및 업로드
          const thumbnailSizes = [
            { key: thumbnailSmallKey, size: 300, name: 'Small' },
            { key: thumbnailMediumKey, size: 500, name: 'Medium' },
            { key: thumbnailLargeKey, size: 800, name: 'Large' }
          ];

          for (const { key, size, name } of thumbnailSizes) {
            const thumbnailBuffer = await sharp(originalBuffer)
              .resize(size, size, { 
                fit: 'inside',
                withoutEnlargement: true
              })
              .jpeg({ quality: 90 })
              .toBuffer();

            const thumbnailUploadCommand = new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: key,
              Body: thumbnailBuffer,
              ContentType: 'image/jpeg',
              Metadata: {
                title: sanitizeMetadataValue(artwork.title || ''),
                year: sanitizeMetadataValue(artwork.year || ''),
                description: sanitizeMetadataValue(artwork.description || ''),
                category: sanitizeMetadataValue(category),
                uploadedAt: sanitizeMetadataValue(new Date().toISOString()),
                isThumbnail: 'true',
                thumbnailSize: sanitizeMetadataValue(name),
              },
            });

            await s3Client.send(thumbnailUploadCommand);
          }

          // 메타데이터 업데이트
          const updatedArtwork = {
            ...artwork,
            thumbnailSmall: thumbnailSmallKey,
            thumbnailMedium: thumbnailMediumKey,
            thumbnailLarge: thumbnailLargeKey,
            // 기존 thumbnailImage는 호환성을 위해 유지
          };

          updatedArtworks.push(updatedArtwork);
          migratedCount++;

        } catch (error) {
          console.error(`작품 ${artwork.id} 마이그레이션 실패:`, error);
          // 실패한 경우 기존 데이터 유지
          updatedArtworks.push(artwork);
        }
      } else {
        // 이미 마이그레이션된 경우 또는 썸네일이 없는 경우
        updatedArtworks.push(artwork);
      }
    }

    // 업데이트된 메타데이터 저장
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(updatedArtworks, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);

    return NextResponse.json({
      success: true,
      message: `${category} 작품들의 반응형 썸네일이 성공적으로 마이그레이션되었습니다.`,
      migratedCount: migratedCount,
      totalCount: artworks.length
    });

  } catch (error) {
    console.error('썸네일 마이그레이션 오류:', error);
    return NextResponse.json(
      { success: false, error: '썸네일 마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
