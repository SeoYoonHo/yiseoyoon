import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const metadataKey = 'CV/metadata.json';

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
            name: '',
            leftText: '',
            rightText: '',
            images: [],
            updatedAt: new Date().toISOString(),
          },
        });
      }

      const metadata = JSON.parse(metadataBody);

      // 텍스트 파일들 가져오기
      let leftText = '';
      let rightText = '';

      try {
        const getLeftTextCommand = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: 'CV/left_text.txt',
        });
        const leftTextResponse = await s3Client.send(getLeftTextCommand);
        const leftTextBody = await leftTextResponse.Body?.transformToString();
        if (leftTextBody) {
          leftText = leftTextBody;
        }
      } catch (error) {
        console.log('Left text file not found');
      }

      try {
        const getRightTextCommand = new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: 'CV/right_text.txt',
        });
        const rightTextResponse = await s3Client.send(getRightTextCommand);
        const rightTextBody = await rightTextResponse.Body?.transformToString();
        if (rightTextBody) {
          rightText = rightTextBody;
        }
      } catch (error) {
        console.log('Right text file not found');
      }

      // 이미지 URL들을 완전한 S3 URL로 변환
      const images = (metadata.images || []).map((imageKey: string) => getS3ImageUrl(imageKey));

      return NextResponse.json({
        success: true,
        data: {
          name: metadata.name || '',
          leftText,
          rightText,
          images,
          updatedAt: metadata.updatedAt || new Date().toISOString(),
        },
      });

    } catch (error) {
      console.log('CV metadata.json not found');
      return NextResponse.json({
        success: true,
        data: {
          name: '',
          leftText: '',
          rightText: '',
          images: [],
          updatedAt: new Date().toISOString(),
        },
      });
    }

  } catch (error) {
    console.error('CV get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV' },
      { status: 500 }
    );
  }
}
