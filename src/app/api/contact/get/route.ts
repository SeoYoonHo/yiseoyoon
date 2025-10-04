import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const metadataKey = 'Contact/metadata.json';

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
          data: {
            text: '',
            instagramUrl: '',
            updatedAt: new Date().toISOString(),
          },
        });
      }

      const metadata = JSON.parse(metadataBody);

      // 텍스트 파일 가져오기
      let text = '';

      try {
        const getTextCommand = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: 'Contact/text.txt',
        });
        const textResponse = await s3Client.send(getTextCommand);
        const textBody = await textResponse.Body?.transformToString();
        if (textBody) {
          text = textBody;
        }
      } catch (error) {
        console.log('Text file not found');
      }

      return NextResponse.json({
        success: true,
        data: {
          text,
          instagramUrl: metadata.instagramUrl || '',
          updatedAt: metadata.updatedAt || new Date().toISOString(),
        },
      });

    } catch (error) {
      console.log('Contact metadata.json not found');
      return NextResponse.json({
        success: true,
        data: {
          text: '',
          instagramUrl: '',
          updatedAt: new Date().toISOString(),
        },
      });
    }

  } catch (error) {
    console.error('Contact get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Contact' },
      { status: 500 }
    );
  }
}
