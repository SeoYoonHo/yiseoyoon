import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 이미지 파일인지 검사
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/tiff'];
    if (!imageTypes.includes(file.type)) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 1. 해당 폴더의 기존 파일 삭제
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: `${folder}/`,
      });
      
      const listResponse = await s3Client.send(listCommand);
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // 모든 기존 파일 삭제
        for (const obj of listResponse.Contents) {
          if (obj.Key) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: obj.Key,
            });
            await s3Client.send(deleteCommand);
            console.log(`Deleted old file: ${obj.Key}`);
          }
        }
      }
    } catch (deleteError) {
      console.warn('Failed to delete old files:', deleteError);
      // 삭제 실패해도 계속 진행
    }

    // 2. 새 파일 업로드 (배경용으로 최적화된 크기로 리사이즈)
    const key = `${folder}/background.jpg`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // 배경용으로 최적화된 크기로 리사이즈 (1920x1080, 품질 80%)
    const optimizedBuffer = await sharp(originalBuffer)
      .resize(1920, 1080, { 
        fit: 'cover', // 비율 유지하면서 크롭
        position: 'center' // 중앙 기준으로 크롭
      })
      .jpeg({ 
        quality: 80, // 배경용으로는 80% 품질이면 충분
        progressive: true // 점진적 로딩
      })
      .toBuffer();

    // S3에 최적화된 이미지 업로드
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable', // 1년 캐시
      Metadata: {
        'upload-timestamp': new Date().toISOString(),
        'optimized': 'true',
        'original-size': originalBuffer.length.toString(),
        'optimized-size': optimizedBuffer.length.toString(),
      },
    });

    await s3Client.send(command);

    const publicUrl = getS3ImageUrl(key);
    
    return NextResponse.json({ 
      success: true,
      key,
      publicUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
