import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
    console.log('CV 이미지 마이그레이션 시작...');

    // CV 메타데이터 가져오기
    const metadataKey = 'CV/metadata.json';
    let metadata: { images: string[]; [key: string]: unknown } = { images: [] };

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

    // 각 이미지 처리
    for (const imageUrl of metadata.images) {
      try {
        console.log(`처리 중: ${imageUrl}`);

        // URL에서 S3 키 추출
        let s3Key = imageUrl;
        if (imageUrl.startsWith('http')) {
          const urlParts = imageUrl.split('/');
          const bucketIndex = urlParts.findIndex(part => part.includes('s3'));
          if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
            s3Key = urlParts.slice(bucketIndex + 1).join('/');
            s3Key = s3Key.split('?')[0];
          }
        }

        // 이미 Original/ 또는 Thumbnail/ 경로인지 확인
        if (s3Key.includes('/Original/') || s3Key.includes('/Thumbnail/')) {
          console.log(`${s3Key}: 이미 마이그레이션된 파일입니다.`);
          continue;
        }

        // 원본 이미지 다운로드
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

        const originalBuffer = Buffer.concat(chunks);
        console.log(`원본 크기: ${(originalBuffer.length / 1024 / 1024).toFixed(2)}MB`);

        // 파일명 추출
        const filename = s3Key.split('/').pop() || `poster_${Date.now()}.jpg`;
        const originalKey = `CV/Original/${filename}`;
        const thumbnailKey = `CV/Thumbnail/${filename}`;

        // 썸네일 생성 (400x600px, 3:4 비율, 품질 90%)
        const thumbnailBuffer = await sharp(originalBuffer)
          .resize(400, 600, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 90,
            progressive: true
          })
          .toBuffer();

        console.log(`썸네일 크기: ${(thumbnailBuffer.length / 1024).toFixed(2)}KB`);

        // 원본 이미지 업로드
        const originalUploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: originalKey,
          Body: originalBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        });

        // 썸네일 이미지 업로드
        const thumbnailUploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        });

        await Promise.all([
          s3Client.send(originalUploadCommand),
          s3Client.send(thumbnailUploadCommand)
        ]);

        console.log(`마이그레이션 완료: ${s3Key} -> ${originalKey}, ${thumbnailKey}`);

        // 원본 파일 삭제
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
        });

        await s3Client.send(deleteCommand);
        console.log(`원본 파일 삭제 완료: ${s3Key}`);

        totalProcessed++;
        totalOptimized++;
        results.push({
          originalKey: s3Key,
          newOriginalKey: originalKey,
          thumbnailKey,
          originalSize: originalBuffer.length,
          thumbnailSize: thumbnailBuffer.length,
          compressionRatio: ((originalBuffer.length - thumbnailBuffer.length) / originalBuffer.length * 100).toFixed(1)
        });

      } catch (error) {
        console.error(`파일 처리 실패 ${imageUrl}:`, error);
        results.push({
          originalKey: imageUrl,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 메타데이터 업데이트 (썸네일 키로 변경)
    const updatedImages = metadata.images.map((imageUrl: string) => {
      let s3Key = imageUrl;
      if (imageUrl.startsWith('http')) {
        const urlParts = imageUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part.includes('s3'));
        if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
          s3Key = urlParts.slice(bucketIndex + 1).join('/');
          s3Key = s3Key.split('?')[0];
        }
      }

      if (s3Key.includes('/Original/') || s3Key.includes('/Thumbnail/')) {
        return imageUrl; // 이미 마이그레이션된 경우
      }

      // 썸네일 키로 변경
      const filename = s3Key.split('/').pop() || `poster_${Date.now()}.jpg`;
      return `CV/Thumbnail/${filename}`;
    });

    metadata.images = updatedImages;
    metadata.updatedAt = new Date().toISOString();

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
      message: 'CV 이미지 마이그레이션 완료',
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
