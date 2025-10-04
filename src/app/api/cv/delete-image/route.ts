import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // S3 URL에서 키 추출
    const imageKey = imageUrl.split('/').slice(-2).join('/'); // 'CV/images/filename.jpg'

    const metadataKey = 'CV/metadata.json';

    // 1. metadata.json 가져오기
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
      console.error('Failed to fetch metadata:', error);
      return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }

    // 2. 이미지 파일 삭제
    try {
      const deleteImageCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: imageKey,
      });
      await s3Client.send(deleteImageCommand);
      console.log('Image file deleted:', imageKey);
    } catch (error) {
      console.error('Failed to delete image file:', error);
      // 이미지 파일 삭제 실패해도 계속 진행
    }

    // 3. 메타데이터에서 이미지 제거
    if (metadata.images) {
      metadata.images = metadata.images.filter((img: string) => img !== imageKey);
      metadata.updatedAt = new Date().toISOString();
    }

    // 4. 업데이트된 메타데이터를 S3에 업로드
    const uploadMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(uploadMetadataCommand);

    console.log('CV image deleted successfully:', imageKey);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error) {
    console.error('CV image delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
