import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const metadataKey = 'Gallery/metadata.json';

    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });

      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();

      if (!metadataString) {
        return NextResponse.json({ 
          success: true,
          artworks: [],
          message: 'No artworks found'
        });
      }

      const metadata = JSON.parse(metadataString);
      
      // 메타데이터를 배열로 변환하고 날짜순으로 정렬 (최신순)
      const artworks = Object.entries(metadata).map(([key, value]: [string, any]) => {
        // URL이 이미 전체 경로인지 확인 (http:// 또는 https://로 시작)
        const isFullUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');
        
        return {
          id: key,
          ...value,
          // 상대 경로인 경우에만 전체 URL로 변환
          originalImage: isFullUrl(value.originalImage) ? value.originalImage : getS3ImageUrl(value.originalImage),
          thumbnailImage: isFullUrl(value.thumbnailImage) ? value.thumbnailImage : getS3ImageUrl(value.thumbnailImage),
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return NextResponse.json({ 
        success: true,
        artworks,
        message: 'Artworks fetched successfully'
      });

    } catch (error: any) {
      // metadata.json이 없는 경우
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return NextResponse.json({ 
          success: true,
          artworks: [],
          message: 'No artworks found'
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Failed to fetch gallery metadata:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch gallery metadata' 
    }, { status: 500 });
  }
}

