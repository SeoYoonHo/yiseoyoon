import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST(request: NextRequest) {
  try {
    const { category } = await request.json();
    
    if (!category || !['painting', 'drawing'].includes(category)) {
      return NextResponse.json({ 
        success: false, 
        error: '카테고리는 painting 또는 drawing이어야 합니다.' 
      }, { status: 400 });
    }

    const categoryCapitalized = category.charAt(0).toUpperCase() + category.slice(1);
    const oldThumbnailPrefix = `Works/${categoryCapitalized}/Thumbnail/`;
    
    // 기존 썸네일 디렉토리의 모든 파일 조회
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: oldThumbnailPrefix,
    });

    const response = await s3Client.send(listCommand);
    const objects = response.Contents || [];
    
    // Small, Medium, Large 디렉토리가 아닌 파일들만 필터링 (기존 썸네일)
    const oldThumbnails = objects.filter(obj => {
      const key = obj.Key || '';
      // Small/, Medium/, Large/ 디렉토리가 아닌 파일들
      return key.includes(oldThumbnailPrefix) && 
             !key.includes('/Small/') && 
             !key.includes('/Medium/') && 
             !key.includes('/Large/');
    });

    let deletedCount = 0;
    const errors = [];

    // 기존 썸네일 파일들 삭제
    for (const obj of oldThumbnails) {
      if (obj.Key) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: obj.Key,
          });
          await s3Client.send(deleteCommand);
          deletedCount++;
          console.log(`삭제됨: ${obj.Key}`);
        } catch (error) {
          console.error(`삭제 실패: ${obj.Key}`, error);
          errors.push({ key: obj.Key, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${category} 기존 썸네일 이미지 정리가 완료되었습니다.`,
      deletedCount: deletedCount,
      totalFound: oldThumbnails.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('기존 썸네일 정리 오류:', error);
    return NextResponse.json(
      { success: false, error: '기존 썸네일 정리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
