import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exhibitionId = searchParams.get('exhibitionId');
    const photoKey = searchParams.get('photoKey');

    if (!exhibitionId || !photoKey) {
      return NextResponse.json({ 
        error: 'Exhibition ID and photo key are required' 
      }, { status: 400 });
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

    // S3에서 사진 삭제 (썸네일 + 원본)
    try {
      // 썸네일 삭제
      const deleteThumbnailCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: photoKey, // 썸네일 키
      });
      await s3Client.send(deleteThumbnailCommand);
      console.log('썸네일 삭제 완료:', photoKey);

      // 원본 파일 키 생성 (Thumbnail을 Original로 변경)
      const originalKey = photoKey.replace('/Thumbnail/', '/Original/');
      const deleteOriginalCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: originalKey,
      });
      await s3Client.send(deleteOriginalCommand);
      console.log('원본 삭제 완료:', originalKey);

    } catch (deleteError) {
      console.error('Failed to delete photos from S3:', deleteError);
    }

    // 메타데이터에서 사진 제거
    metadata[exhibitionId].photos = metadata[exhibitionId].photos.filter(
      (key) => key !== photoKey
    );

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
      message: 'Photo deleted successfully',
    });

  } catch (error) {
    console.error('Photo deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}

