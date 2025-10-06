import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';
import sharp from 'sharp';

interface Exhibition {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  photos: string[];
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const exhibitionId = formData.get('exhibitionId') as string;

    if (!files || files.length === 0 || !exhibitionId) {
      return NextResponse.json({ error: 'Files and exhibitionId are required' }, { status: 400 });
    }

    // 이미지 파일 검증
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/tiff'];
    const validFiles = files.filter(file => imageTypes.includes(file.type));
    
    if (validFiles.length === 0) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    const metadataKey = 'Exhibitions/metadata.json';
    let metadata: Record<string, Exhibition> = {};

    // 기존 metadata.json 가져오기
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString) as Record<string, Exhibition>;
      }
    } catch {
      return NextResponse.json({ error: 'Exhibition metadata not found' }, { status: 404 });
    }

    // 전시 존재 확인
    if (!metadata[exhibitionId]) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    const uploadedPhotos: string[] = [];
    const errors: string[] = [];

    // 각 파일 처리
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        // 파일명 생성 (타임스탬프 + 인덱스 + jpg)
        const photoFilename = `photo_${Date.now()}_${i}.jpg`;
        const originalKey = `Exhibitions/${exhibitionId}/Original/${photoFilename}`;
        const thumbnailKey = `Exhibitions/${exhibitionId}/Thumbnail/${photoFilename}`;

        // 원본 이미지 처리
        const arrayBuffer = await file.arrayBuffer();
        const originalBuffer = Buffer.from(arrayBuffer);

        // 썸네일 생성 (600x600px, 품질 95%)
        const thumbnailBuffer = await sharp(originalBuffer)
          .resize(600, 600, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 95,
            progressive: true
          })
          .toBuffer();

        // 원본 이미지 업로드
        const originalUploadCommand = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: originalKey,
          Body: originalBuffer,
          ContentType: file.type,
          CacheControl: 'public, max-age=31536000, immutable',
        });

        // 썸네일 이미지 업로드
        const thumbnailUploadCommand = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        });

        await Promise.all([
          s3Client.send(originalUploadCommand),
          s3Client.send(thumbnailUploadCommand)
        ]);

        // 썸네일 키를 업로드된 사진 목록에 추가
        uploadedPhotos.push(thumbnailKey);

      } catch (error) {
        console.error(`파일 ${file.name} 업로드 실패:`, error);
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // 메타데이터에 사진 추가
    metadata[exhibitionId].photos.push(...uploadedPhotos);

    // 업데이트된 metadata.json 업로드
    const putMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(putMetadataCommand);

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedPhotos.length,
      totalFiles: validFiles.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedPhotos.length}개 사진이 업로드되었습니다.${errors.length > 0 ? ` (${errors.length}개 실패)` : ''}`,
    });

  } catch (error) {
    console.error('Multi photo upload error:', error);
    return NextResponse.json({ error: 'Failed to upload photos' }, { status: 500 });
  }
}
