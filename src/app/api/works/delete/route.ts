import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artworkId = searchParams.get('id');

    if (!artworkId) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    const metadataKey = 'Works/metadata.json';

    // 1. metadata.json 가져오기
    let metadata: Record<string, any> = {};
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString);
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }

    // 2. 해당 작품 정보 확인
    const artwork = metadata[artworkId];
    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    // 3. S3에서 원본 이미지와 썸네일 삭제
    try {
      // URL에서 S3 키 추출 (https://bucket.s3.region.amazonaws.com/key 형식)
      const extractS3Key = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const urlObj = new URL(url);
          return urlObj.pathname.substring(1); // 앞의 / 제거
        }
        return url; // 이미 키 형식인 경우
      };

      const originalKey = extractS3Key(artwork.originalImage);
      const thumbnailKey = extractS3Key(artwork.thumbnailImage);

      // 원본 이미지 삭제
      const deleteOriginalCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: originalKey,
      });
      await s3Client.send(deleteOriginalCommand);
      console.log(`Deleted original image: ${originalKey}`);

      // 썸네일 이미지 삭제
      const deleteThumbnailCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: thumbnailKey,
      });
      await s3Client.send(deleteThumbnailCommand);
      console.log(`Deleted thumbnail image: ${thumbnailKey}`);
    } catch (deleteError) {
      console.error('Failed to delete images from S3:', deleteError);
      return NextResponse.json({ error: 'Failed to delete images from S3' }, { status: 500 });
    }

    // 4. metadata.json에서 작품 정보 제거
    delete metadata[artworkId];

    // 5. 업데이트된 metadata.json 업로드
    try {
      const putMetadataCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
        CacheControl: 'public, max-age=0, must-revalidate',
      });
      await s3Client.send(putMetadataCommand);
    } catch (updateError) {
      console.error('Failed to update metadata:', updateError);
      return NextResponse.json({ error: 'Failed to update metadata' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Artwork deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

