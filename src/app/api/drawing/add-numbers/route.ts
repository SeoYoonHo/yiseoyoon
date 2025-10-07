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
    // 메타데이터 파일 읽기
    const metadataKey = 'Works/Drawing/metadata.json';
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
    });

    let artworks: any[] = [];
    try {
      const response = await s3Client.send(getCommand);
      const body = await response.Body?.transformToString();
      if (body) {
        artworks = JSON.parse(body);
      }
    } catch (error) {
      console.log('메타데이터 파일이 없습니다. 새로 생성합니다.');
    }

    // createdAt 기준으로 정렬
    artworks.sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // 번호 추가
    artworks.forEach((artwork, index) => {
      artwork.number = index + 1;
    });

    // 메타데이터 파일 업데이트
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(artworks, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putCommand);

    return NextResponse.json({
      success: true,
      message: `${artworks.length}개의 Drawing 작품에 번호가 추가되었습니다.`,
      artworks: artworks.map(artwork => ({
        id: artwork.id,
        title: artwork.title,
        number: artwork.number,
        createdAt: artwork.createdAt
      }))
    });

  } catch (error) {
    console.error('Drawing 번호 추가 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Drawing 번호 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}
