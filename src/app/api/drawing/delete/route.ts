import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID가 제공되지 않았습니다.' }, { status: 400 });
    }

    const metadataKey = 'Works/Drawing/metadata.json';

    // 메타데이터 파일 읽기
    let artworks = [];
    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();
      if (metadataContent) {
        artworks = JSON.parse(metadataContent);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'NoSuchKey') {
        return NextResponse.json({ success: false, error: '메타데이터를 찾을 수 없습니다.' }, { status: 404 });
      }
      throw error;
    }

    // 삭제할 작품 찾기
    const artworkToDelete = artworks.find((artwork: { id: string }) => artwork.id === id);
    if (!artworkToDelete) {
      return NextResponse.json({ success: false, error: '작품을 찾을 수 없습니다.' }, { status: 404 });
    }

    // S3에서 원본 이미지 삭제
    try {
      const deleteOriginalCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: artworkToDelete.originalImage,
      });
      await s3Client.send(deleteOriginalCommand);
    } catch (error) {
      console.error('원본 이미지 삭제 실패:', error);
    }

    // S3에서 모든 썸네일 이미지 삭제 (Small, Medium, Large)
    const thumbnailKeys = [
      artworkToDelete.thumbnailImage,
      artworkToDelete.thumbnailSmall,
      artworkToDelete.thumbnailMedium,
      artworkToDelete.thumbnailLarge
    ].filter(key => key); // undefined 제거

    for (const thumbnailKey of thumbnailKeys) {
      try {
        const deleteThumbnailCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
        });
        await s3Client.send(deleteThumbnailCommand);
        console.log(`썸네일 삭제 완료: ${thumbnailKey}`);
      } catch (error) {
        console.error(`썸네일 이미지 삭제 실패 (${thumbnailKey}):`, error);
      }
    }

    // 메타데이터에서 작품 제거
    const updatedArtworks = artworks.filter((artwork: { id: string }) => artwork.id !== id);

    // 업데이트된 메타데이터 저장
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(updatedArtworks, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);

    return NextResponse.json({
      success: true,
      message: 'Drawing 작품이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('Drawing 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Drawing 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
