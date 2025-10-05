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

export async function PUT(request: NextRequest) {
  try {
    const { id, title, date, description } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID가 제공되지 않았습니다.' }, { status: 400 });
    }

    if (!title || !date) {
      return NextResponse.json({ success: false, error: '제목과 날짜는 필수 입력 항목입니다.' }, { status: 400 });
    }

    const metadataKey = 'Works/Drawing/metadata.json';

    // 메타데이터 파일 읽기
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
        return NextResponse.json({ success: false, error: '메타데이터를 찾을 수 없습니다.' }, { status: 404 });
      }
      throw error;
    }

    // 수정할 작품 찾기
    const artworkIndex = artworks.findIndex((artwork: { id: string }) => artwork.id === id);
    if (artworkIndex === -1) {
      return NextResponse.json({ success: false, error: '작품을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 작품 정보 업데이트
    artworks[artworkIndex] = {
      ...artworks[artworkIndex],
      title,
      date,
      description: description || '',
      updatedAt: new Date().toISOString(),
    };

    // 업데이트된 메타데이터 저장
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(artworks, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);

    return NextResponse.json({
      success: true,
      message: 'Drawing 작품이 성공적으로 수정되었습니다.',
      artwork: artworks[artworkIndex]
    });

  } catch (error) {
    console.error('Drawing 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Drawing 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
