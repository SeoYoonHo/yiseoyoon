import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface UpdateExhibitionRequest {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateExhibitionRequest = await request.json();
    const { id, title, startDate, endDate, location, description } = body;

    if (!id || !title || !startDate || !endDate || !location) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const metadataKey = 'Exhibitions/metadata.json';

    try {
      // 기존 메타데이터 가져오기
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: metadataKey,
      });

      const response = await s3Client.send(getObjectCommand);
      const metadataText = await response.Body?.transformToString() || '{}';
      const exhibitionsMetadata = JSON.parse(metadataText);

      // 해당 전시 찾기 (객체 형태에서 ID로 검색)
      const exhibition = exhibitionsMetadata[id];
      
      if (!exhibition) {
        return NextResponse.json(
          { success: false, error: '전시를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 전시 정보 업데이트
      exhibitionsMetadata[id] = {
        ...exhibition,
        title,
        startDate,
        endDate,
        location,
        description,
        updatedAt: new Date().toISOString(),
      };

      // 메타데이터 저장
      const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: metadataKey,
        Body: JSON.stringify(exhibitionsMetadata, null, 2),
        ContentType: 'application/json',
      });

      await s3Client.send(putObjectCommand);

      return NextResponse.json({
        success: true,
        message: '전시가 성공적으로 업데이트되었습니다.',
        exhibition: exhibitionsMetadata[id],
      });

    } catch (error) {
      console.error('Update exhibition error:', error);
      return NextResponse.json(
        { success: false, error: '전시 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json(
      { success: false, error: '잘못된 요청입니다.' },
      { status: 400 }
    );
  }
}
