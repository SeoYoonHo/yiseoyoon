import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

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

    const metadataKey = `Works/${category.charAt(0).toUpperCase() + category.slice(1)}/metadata.json`;

    // 기존 메타데이터 불러오기
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
        return NextResponse.json({ 
          success: false, 
          error: '메타데이터를 찾을 수 없습니다.' 
        }, { status: 404 });
      }
      throw error;
    }

    // date 필드에서 연도 추출하여 year 필드로 변환
    const updatedArtworks = artworks.map((artwork: { date?: string; year?: string; [key: string]: unknown }) => {
      let year = '';
      
      if (artwork.date) {
        // date가 "YYYY-MM-DD" 형식인 경우
        if (typeof artwork.date === 'string' && artwork.date.includes('-')) {
          year = artwork.date.split('-')[0];
        }
        // date가 "YYYY" 형식인 경우
        else if (typeof artwork.date === 'string' && /^\d{4}$/.test(artwork.date)) {
          year = artwork.date;
        }
        // 기타 경우 - Date 객체로 변환 시도
        else {
          try {
            year = new Date(artwork.date).getFullYear().toString();
          } catch {
            year = new Date().getFullYear().toString(); // 기본값으로 현재 연도 사용
          }
        }
      }
      
      // year 필드가 이미 있는 경우는 그대로 유지
      if (artwork.year) {
        year = artwork.year;
      }

      return {
        ...artwork,
        year: year || new Date().getFullYear().toString(),
        // date 필드는 제거하지 않고 유지 (호환성을 위해)
      };
    });

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
      message: `${category} 작품들의 연도 데이터가 성공적으로 마이그레이션되었습니다.`,
      migratedCount: updatedArtworks.length
    });

  } catch (error) {
    console.error('연도 마이그레이션 오류:', error);
    return NextResponse.json(
      { success: false, error: '연도 마이그레이션 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
