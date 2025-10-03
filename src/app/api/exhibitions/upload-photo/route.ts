import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

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
    const file = formData.get('file') as File;
    const exhibitionId = formData.get('exhibitionId') as string;

    if (!file || !exhibitionId) {
      return NextResponse.json({ error: 'File and exhibitionId are required' }, { status: 400 });
    }

    // 이미지 파일 검증
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/tiff'];
    if (!imageTypes.includes(file.type)) {
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

    // 파일명 생성 (타임스탬프 + 원본 확장자)
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const photoFilename = `photo_${Date.now()}.${fileExtension}`;
    const photoKey = `Exhibitions/${exhibitionId}/${photoFilename}`;

    // S3에 사진 업로드
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: photoKey,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await s3Client.send(uploadCommand);

    // 메타데이터에 사진 추가
    metadata[exhibitionId].photos.push(photoKey);

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
      photoUrl: getS3ImageUrl(photoKey),
      photoKey,
      message: 'Photo uploaded successfully',
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}

