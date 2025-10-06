import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST() {
  try {
    console.log('Exhibition 썸네일 화질 개선 마이그레이션 시작...');

    // Exhibition 메타데이터 가져오기
    const metadataKey = 'Exhibitions/metadata.json';
    let metadata: Record<string, { photos: string[]; [key: string]: unknown }> = {};

    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString);
      }
    } catch (error) {
      console.error('메타데이터 가져오기 실패:', error);
      return NextResponse.json({ success: false, error: '메타데이터를 가져올 수 없습니다.' }, { status: 500 });
    }

    let totalProcessed = 0;
    let totalOptimized = 0;
    const results = [];

    // 각 전시의 썸네일 이미지 처리
    for (const [exhibitionId, exhibition] of Object.entries(metadata)) {
      console.log(`\n=== 처리 중인 전시: ${exhibitionId} ===`);
      
      if (!exhibition.photos || !Array.isArray(exhibition.photos)) {
        console.log(`${exhibitionId}: 사진이 없습니다.`);
        continue;
      }

      const updatedPhotos: string[] = [];

      for (const photoKey of exhibition.photos) {
        try {
          console.log(`처리 중: ${photoKey}`);

          // URL에서 S3 키 추출
          let s3Key = photoKey;
          if (photoKey.startsWith('http')) {
            // URL에서 S3 키 부분만 추출
            const urlParts = photoKey.split('/');
            const bucketIndex = urlParts.findIndex(part => part.includes('s3'));
            if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
              s3Key = urlParts.slice(bucketIndex + 1).join('/');
              // 쿼리 파라미터 제거
              s3Key = s3Key.split('?')[0];
            }
          }

          // Thumbnail 경로인지 확인
          if (!s3Key.includes('/Thumbnail/')) {
            console.log(`${s3Key}: 썸네일 파일이 아닙니다.`);
            updatedPhotos.push(photoKey);
            continue;
          }

          // 썸네일 이미지 다운로드
          const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
          });

          const getResponse = await s3Client.send(getCommand);
          const chunks: Uint8Array[] = [];
          
          if (getResponse.Body) {
            for await (const chunk of getResponse.Body as AsyncIterable<Uint8Array>) {
              chunks.push(chunk);
            }
          }

          const thumbnailBuffer = Buffer.concat(chunks);
          console.log(`기존 썸네일 크기: ${(thumbnailBuffer.length / 1024).toFixed(2)}KB`);

          // 원본 이미지 경로 생성
          const originalKey = s3Key.replace('/Thumbnail/', '/Original/');
          
          // 원본 이미지 다운로드
          let originalBuffer: Buffer;
          try {
            const getOriginalCommand = new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: originalKey,
            });

            const getOriginalResponse = await s3Client.send(getOriginalCommand);
            const originalChunks: Uint8Array[] = [];
            
            if (getOriginalResponse.Body) {
              for await (const chunk of getOriginalResponse.Body as AsyncIterable<Uint8Array>) {
                originalChunks.push(chunk);
              }
            }

            originalBuffer = Buffer.concat(originalChunks);
            console.log(`원본 크기: ${(originalBuffer.length / 1024 / 1024).toFixed(2)}MB`);
          } catch (error) {
            console.log(`${originalKey}: 원본 이미지를 찾을 수 없습니다. 기존 썸네일을 사용합니다.`);
            originalBuffer = thumbnailBuffer;
          }

          // 새로운 고화질 썸네일 생성 (600x600px, 품질 95%)
          const newThumbnailBuffer = await sharp(originalBuffer)
            .resize(600, 600, { 
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ 
              quality: 95,
              progressive: true
            })
            .toBuffer();

          console.log(`새 썸네일 크기: ${(newThumbnailBuffer.length / 1024).toFixed(2)}KB`);

          // 새로운 썸네일 업로드
          const thumbnailUploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: newThumbnailBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000, immutable',
          });

          await s3Client.send(thumbnailUploadCommand);

          console.log(`썸네일 화질 개선 완료: ${s3Key}`);

          updatedPhotos.push(photoKey);

          totalProcessed++;
          totalOptimized++;
          results.push({
            exhibitionId,
            photoKey: s3Key,
            originalSize: thumbnailBuffer.length,
            newSize: newThumbnailBuffer.length,
            improvementRatio: ((newThumbnailBuffer.length - thumbnailBuffer.length) / thumbnailBuffer.length * 100).toFixed(1)
          });

        } catch (error) {
          console.error(`파일 처리 실패 ${photoKey}:`, error);
          results.push({
            exhibitionId,
            photoKey,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // 전시의 사진 목록 업데이트 (변경사항이 없어도 순서 유지)
      metadata[exhibitionId].photos = updatedPhotos;
    }

    // 업데이트된 메타데이터 저장
    const putMetadataCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(putMetadataCommand);
    console.log('메타데이터 업데이트 완료');

    return NextResponse.json({
      success: true,
      message: 'Exhibition 썸네일 화질 개선 마이그레이션 완료',
      totalProcessed,
      totalOptimized,
      results
    });

  } catch (error) {
    console.error('마이그레이션 오류:', error);
    return NextResponse.json(
      { success: false, error: '마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
