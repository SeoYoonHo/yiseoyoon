import { NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

interface ArtworkMetadata {
  title: string;
  date: string;
  description: string;
  originalImage: string;
  thumbnailImage: string;
  uploadedAt: string;
}

export async function POST() {
  try {
    const metadataKey = 'Gallery/metadata.json';
    let metadata: Record<string, ArtworkMetadata> = {};

    // 1. metadata.json 가져오기
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString) as Record<string, ArtworkMetadata>;
      }
    } catch {
      return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }

    // 2. 빈 키 또는 유효하지 않은 키 찾기
    const invalidKeys: string[] = [];
    const deletedFiles: string[] = [];

    for (const [key, value] of Object.entries(metadata)) {
      // 빈 키이거나 공백만 있는 키
      if (!key || key.trim() === '') {
        invalidKeys.push(key);
        
        // S3에서 해당 파일들 삭제 시도
        try {
          // URL에서 키 추출
          const extractKey = (url: string): string => {
            if (url.startsWith('http://') || url.startsWith('https://')) {
              const urlObj = new URL(url);
              return urlObj.pathname.substring(1);
            }
            return url;
          };

          const originalKey = extractKey(value.originalImage);
          const thumbnailKey = extractKey(value.thumbnailImage);

          // 원본 삭제
          try {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: originalKey,
            }));
            deletedFiles.push(originalKey);
          } catch (e) {
            console.error(`Failed to delete original: ${originalKey}`, e);
          }

          // 썸네일 삭제
          try {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: thumbnailKey,
            }));
            deletedFiles.push(thumbnailKey);
          } catch (e) {
            console.error(`Failed to delete thumbnail: ${thumbnailKey}`, e);
          }
        } catch (e) {
          console.error('Failed to delete files for key:', key, e);
        }
      }
    }

    // 3. 메타데이터에서 유효하지 않은 키 제거
    for (const key of invalidKeys) {
      delete metadata[key];
    }

    // 4. 업데이트된 메타데이터 저장
    if (invalidKeys.length > 0) {
      const putMetadataCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
        CacheControl: 'public, max-age=0, must-revalidate',
      });
      await s3Client.send(putMetadataCommand);
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      invalidKeysRemoved: invalidKeys,
      filesDeleted: deletedFiles,
      remainingArtworks: Object.keys(metadata).length,
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

