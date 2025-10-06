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
    let imageKey: string;
    if (imageUrl.startsWith('http')) {
      // 완전한 URL인 경우 S3 키 추출
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('s3'));
      if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
        imageKey = urlParts.slice(bucketIndex + 1).join('/');
        // 쿼리 파라미터 제거
        imageKey = imageKey.split('?')[0];
      } else {
        return NextResponse.json({ error: 'Invalid S3 URL format' }, { status: 400 });
      }
    } else {
      // 이미 S3 키인 경우
      imageKey = imageUrl;
    }

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

    // 2. 썸네일과 원본 이미지 파일 삭제
    try {
      // 썸네일 삭제
      const deleteThumbnailCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: imageKey,
      });
      await s3Client.send(deleteThumbnailCommand);
      console.log('Thumbnail file deleted:', imageKey);

      // 원본 삭제
      const originalKey = imageKey.replace('/Thumbnail/', '/Original/');
      const deleteOriginalCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: originalKey,
      });
      await s3Client.send(deleteOriginalCommand);
      console.log('Original file deleted:', originalKey);
    } catch (error) {
      console.error('Failed to delete image files:', error);
      // 이미지 파일 삭제 실패해도 계속 진행
    }

    // 3. 메타데이터에서 이미지 제거 (파일명으로 비교)
    console.log('Original images:', metadata.images);
    console.log('Image URL to remove:', imageUrl);
    
    if (metadata.images) {
      const originalLength = metadata.images.length;
      // 파일명 추출
      const fileName = imageKey.split('/').pop();
      console.log('File name to remove:', fileName);
      
      metadata.images = metadata.images.filter((img: string) => {
        const imgFileName = img.split('/').pop()?.split('?')[0];
        return imgFileName !== fileName;
      });
      metadata.updatedAt = new Date().toISOString();
      
      console.log('Filtered images:', metadata.images);
      console.log('Images removed:', originalLength - metadata.images.length);
    }

    // 4. 업데이트된 메타데이터를 S3에 업로드
    console.log('Updated metadata:', JSON.stringify(metadata, null, 2));
    
    const uploadMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    try {
      await s3Client.send(uploadMetadataCommand);
      console.log('Metadata updated successfully');
    } catch (error) {
      console.error('Failed to update metadata:', error);
      return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 });
    }

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
