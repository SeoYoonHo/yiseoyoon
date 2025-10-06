import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function GET() {
  try {
    const paintingKey = 'Works/Painting/card.jpg';
    const drawingKey = 'Works/Drawing/card.jpg';

    let paintingUrl = null;
    let drawingUrl = null;

    // Painting 카드 이미지 확인
    try {
      const paintingCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: paintingKey,
      });
      await s3Client.send(paintingCommand);
      paintingUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${paintingKey}?t=${Date.now()}`;
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'NoSuchKey') {
        console.error('Painting 카드 이미지 조회 오류:', error);
      }
    }

    // Drawing 카드 이미지 확인
    try {
      const drawingCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: drawingKey,
      });
      await s3Client.send(drawingCommand);
      drawingUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${drawingKey}?t=${Date.now()}`;
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'NoSuchKey') {
        console.error('Drawing 카드 이미지 조회 오류:', error);
      }
    }

    return NextResponse.json({
      success: true,
      images: {
        painting: paintingUrl,
        drawing: drawingUrl
      }
    });

  } catch (error) {
    console.error('카드 이미지 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '카드 이미지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
