import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

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

export async function GET() {
  try {
    const metadataKey = 'Exhibitions/metadata.json';

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
          exhibitions: [],
          message: 'No exhibitions found',
        });
      }

      const metadata = JSON.parse(metadataString) as Record<string, Exhibition>;

      // 전시를 배열로 변환하고 시작 날짜순으로 정렬 (최신순)
      const exhibitions = Object.values(metadata)
        .map((exhibition) => ({
          ...exhibition,
          // S3 키를 전체 URL로 변환 (이미 URL인 경우는 그대로 사용)
          photos: exhibition.photos.map((photoKey) => {
            // 이미 완전한 URL인 경우 그대로 반환
            if (photoKey.startsWith('http')) {
              return photoKey;
            }
            // S3 키인 경우 URL로 변환
            return getS3ImageUrl(photoKey);
          }),
        }))
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      return NextResponse.json({
        success: true,
        exhibitions,
        message: 'Exhibitions fetched successfully',
      });

    } catch (error) {
      const err = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return NextResponse.json({
          success: true,
          exhibitions: [],
          message: 'No exhibitions found',
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Failed to fetch exhibitions:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibitions' }, { status: 500 });
  }
}

