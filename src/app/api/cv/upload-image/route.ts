import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

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
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const imageKey = `CV/images/poster_${timestamp}.${fileExtension}`;

    // 이미지 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 이미지 파일을 S3에 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: imageKey,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000',
    });

    await s3Client.send(uploadCommand);

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

    // 새 이미지를 메타데이터에 추가
    if (!metadata.images) {
      metadata.images = [];
    }
    metadata.images.push(imageKey);
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

    console.log('CV image uploaded successfully:', imageKey);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      imageKey,
      imageUrl: getS3ImageUrl(imageKey),
    });

  } catch (error) {
    console.error('CV image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
