import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

export async function PUT(request: NextRequest) {
  try {
    const { name, leftText, rightText, images } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

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

    // 기존 메타데이터 가져오기
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

    // 텍스트 파일 업로드
    const leftTextKey = 'CV/left_text.txt';
    const rightTextKey = 'CV/right_text.txt';

    // 왼쪽 텍스트 업로드
    const uploadLeftTextCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: leftTextKey,
      Body: leftText || '',
      ContentType: 'text/plain',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    // 오른쪽 텍스트 업로드
    const uploadRightTextCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: rightTextKey,
      Body: rightText || '',
      ContentType: 'text/plain',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(uploadLeftTextCommand);
    await s3Client.send(uploadRightTextCommand);

    // 메타데이터 업데이트
    metadata.name = name;
    metadata.leftText = leftText || '';
    metadata.rightText = rightText || '';
    // images 배열이 제공된 경우에만 업데이트
    if (images !== undefined) {
      metadata.images = images;
    }
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

    console.log('CV updated successfully:', { name, leftText, rightText, imagesCount: metadata.images.length });

    return NextResponse.json({
      success: true,
      message: 'CV updated successfully',
      metadata,
    });

  } catch (error) {
    console.error('CV update error:', error);
    return NextResponse.json(
      { error: 'Failed to update CV' },
      { status: 500 }
    );
  }
}
