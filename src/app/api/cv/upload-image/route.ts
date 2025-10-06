import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // 이미지 파일인지 검사
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!imageTypes.includes(file.type)) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일명을 타임스탬프 기반으로 생성
    const timestamp = Date.now();
    const fileExtension = 'jpg'; // 항상 jpg로 통일
    const originalKey = `CV/Original/poster_${timestamp}.${fileExtension}`;
    const thumbnailKey = `CV/Thumbnail/poster_${timestamp}.${fileExtension}`;

    // 이미지 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

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

    // CV/metadata.json 파일 가져오기
    const metadataKey = 'CV/metadata.json';
    let metadata: {
      name: string;
      leftText: string;
      rightText: string;
      images: string[];
      updatedAt: string;
    } = {
      name: '',
      leftText: '',
      rightText: '',
      images: [],
      updatedAt: new Date().toISOString(),
    };

    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });

      const response = await s3Client.send(getMetadataCommand);
      const metadataBody = await response.Body?.transformToString();
      if (metadataBody) {
        metadata = JSON.parse(metadataBody);
      }
    } catch (error) {
      console.log('CV metadata.json not found, creating new one');
    }

    // 새 썸네일 이미지를 메타데이터에 추가
    if (!metadata.images) {
      metadata.images = [];
    }
    metadata.images.push(thumbnailKey);
    metadata.updatedAt = new Date().toISOString();

    // 업데이트된 메타데이터를 S3에 업로드
    const uploadMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(uploadMetadataCommand);

    console.log('CV image uploaded successfully:', thumbnailKey);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      imageKey: thumbnailKey,
      imageUrl: getS3ImageUrl(thumbnailKey),
    });

  } catch (error) {
    console.error('CV image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
