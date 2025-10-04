import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const metadataKey = 'Text/metadata.json';

    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });

      const response = await s3Client.send(getMetadataCommand);
      const metadataBody = await response.Body?.transformToString();
      
      if (!metadataBody) {
        return NextResponse.json({
          success: true,
          texts: [],
        });
      }

      const metadata = JSON.parse(metadataBody);
      
      // 메타데이터를 배열로 변환하여 반환
      const texts = Object.entries(metadata).map(([id, textData]: [string, any]) => ({
        id,
        title: textData.title,
        pdfUrl: textData.pdfUrl,
        uploadedAt: textData.uploadedAt,
      }));

      // 업로드 날짜 기준으로 정렬 (최신순)
      texts.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      return NextResponse.json({
        success: true,
        texts,
      });

    } catch (error) {
      console.log('Text metadata.json not found');
      return NextResponse.json({
        success: true,
        texts: [],
      });
    }

  } catch (error) {
    console.error('Text list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch texts' },
      { status: 500 }
    );
  }
}
