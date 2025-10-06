import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
    console.log('배경 이미지 최적화 마이그레이션 시작...');

    // 모든 Background 폴더 찾기
    const folders = ['Home', 'Works', 'Painting', 'Drawing', 'Exhibitions', 'Text', 'CV', 'Contact'];
    let totalProcessed = 0;
    let totalOptimized = 0;
    const results = [];

    for (const folder of folders) {
      const folderPath = `${folder}/Background/`;
      console.log(`\n=== 처리 중인 폴더: ${folderPath} ===`);

      try {
        // 해당 폴더의 모든 파일 조회
        const listCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: folderPath,
        });

        const response = await s3Client.send(listCommand);
        const objects = response.Contents || [];
        
        console.log(`S3 응답 - 총 ${objects.length}개 파일 발견`);

        // 모든 파일을 필터링 (background.jpg 포함)
        const originalFiles = objects.filter(obj => {
          const key = obj.Key || '';
          return key.includes(folderPath) && 
                 obj.Size && obj.Size > 0;
        });

        console.log(`${folder} 폴더에서 ${originalFiles.length}개의 원본 파일 발견`);
        console.log(`전체 파일 목록:`, objects.map(obj => ({ key: obj.Key, size: obj.Size })));
        console.log(`원본 파일 목록:`, originalFiles.map(obj => ({ key: obj.Key, size: obj.Size })));

        for (const obj of originalFiles) {
          if (!obj.Key) continue;

          try {
            console.log(`처리 중: ${obj.Key}`);

            // 원본 이미지 다운로드
            const getCommand = new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: obj.Key,
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

            // 배경용으로 최적화된 크기로 리사이즈
            const optimizedBuffer = await sharp(originalBuffer)
              .resize(1920, 1080, { 
                fit: 'cover',
                position: 'center'
              })
              .jpeg({ 
                quality: 80,
                progressive: true
              })
              .toBuffer();

            console.log(`최적화된 크기: ${(optimizedBuffer.length / 1024 / 1024).toFixed(2)}MB`);

            // 최적화된 이미지를 background.jpg로 업로드
            const optimizedKey = `${folderPath}background.jpg`;
            const putCommand = new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: optimizedKey,
              Body: optimizedBuffer,
              ContentType: 'image/jpeg',
              CacheControl: 'public, max-age=31536000, immutable',
              Metadata: {
                'upload-timestamp': new Date().toISOString(),
                'optimized': 'true',
                'original-size': originalBuffer.length.toString(),
                'optimized-size': optimizedBuffer.length.toString(),
                'migrated-from': obj.Key,
              },
            });

            await s3Client.send(putCommand);
            console.log(`최적화된 이미지 업로드 완료: ${optimizedKey}`);

            // 원본 파일 삭제
            const deleteCommand = new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: obj.Key,
            });

            await s3Client.send(deleteCommand);
            console.log(`원본 파일 삭제 완료: ${obj.Key}`);

            totalProcessed++;
            totalOptimized++;
            results.push({
              folder,
              originalKey: obj.Key,
              optimizedKey,
              originalSize: originalBuffer.length,
              optimizedSize: optimizedBuffer.length,
              compressionRatio: ((originalBuffer.length - optimizedBuffer.length) / originalBuffer.length * 100).toFixed(1)
            });

          } catch (error) {
            console.error(`파일 처리 실패 ${obj.Key}:`, error);
            results.push({
              folder,
              originalKey: obj.Key,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

      } catch (error) {
        console.error(`${folder} 폴더 처리 실패:`, error);
        results.push({
          folder,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '배경 이미지 최적화 마이그레이션 완료',
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
