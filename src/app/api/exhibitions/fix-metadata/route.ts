import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST() {
  try {
    console.log('메타데이터 복구 시작...');

    // 기존 메타데이터 가져오기
    const metadataKey = 'Exhibitions/metadata.json';
    let metadata: Record<string, { photos: string[]; [key: string]: unknown }> = {};

    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString);
      }
    } catch (error) {
      console.error('메타데이터 가져오기 실패:', error);
      return NextResponse.json({ success: false, error: '메타데이터를 가져올 수 없습니다.' }, { status: 500 });
    }

    // S3에서 실제 파일들 확인
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Exhibitions/',
    });

    const response = await s3Client.send(listCommand);
    const objects = response.Contents || [];

    // 전시별로 썸네일 파일들 수집
    const exhibitionThumbnails: Record<string, string[]> = {};
    
    for (const obj of objects) {
      const key = obj.Key || '';
      if (key.includes('/Thumbnail/')) {
        const parts = key.split('/');
        if (parts.length >= 3) {
          const exhibitionId = parts[1];
          if (!exhibitionThumbnails[exhibitionId]) {
            exhibitionThumbnails[exhibitionId] = [];
          }
          exhibitionThumbnails[exhibitionId].push(key);
        }
      }
    }

    // 메타데이터 업데이트
    let updatedCount = 0;
    for (const [exhibitionId, thumbnails] of Object.entries(exhibitionThumbnails)) {
      if (metadata[exhibitionId]) {
        metadata[exhibitionId].photos = thumbnails;
        updatedCount++;
        console.log(`${exhibitionId}: ${thumbnails.length}개 썸네일 추가`);
      }
    }

    // 업데이트된 메타데이터 저장
    const putMetadataCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(putMetadataCommand);
    console.log('메타데이터 업데이트 완료');

    return NextResponse.json({
      success: true,
      message: '메타데이터 복구 완료',
      updatedCount,
      exhibitions: Object.keys(exhibitionThumbnails)
    });

  } catch (error) {
    console.error('메타데이터 복구 오류:', error);
    return NextResponse.json(
      { success: false, error: '메타데이터 복구 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
