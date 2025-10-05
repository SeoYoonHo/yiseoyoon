import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;


function sanitizeMetadataValue(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const paintingFile = formData.get('paintingFile') as File;
    const drawingFile = formData.get('drawingFile') as File;
    const type = formData.get('type') as string; // 'painting' or 'drawing'

    if (!type || (!paintingFile && !drawingFile)) {
      return NextResponse.json({ success: false, error: '타입과 파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    const file = type === 'Painting' ? paintingFile : drawingFile;
    if (!file) {
      return NextResponse.json({ success: false, error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 });
    }

    // 기존 이미지 삭제
    try {
      const listResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `Works/${type}/`
      }));

      if (listResponse.Contents) {
        for (const object of listResponse.Contents) {
          if (object.Key && object.Key.includes('card')) {
            await s3Client.send(new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: object.Key
            }));
          }
        }
      }
    } catch (error) {
      console.error('기존 카드 이미지 삭제 실패:', error);
    }

    // 파일을 ArrayBuffer로 변환
    const buffer = Buffer.from(await file.arrayBuffer());

    // 카드 이미지 최적화 (3:4 비율, 적당한 크기)
    const optimizedBuffer = await sharp(buffer)
      .resize(600, 800, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // 파일 확장자 추출
    const key = `Works/${type}/card.jpg`;

    // S3에 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: optimizedBuffer,
      ContentType: 'image/jpeg',
      Metadata: {
        type: sanitizeMetadataValue(type),
        uploadedAt: sanitizeMetadataValue(new Date().toISOString()),
      },
    });

    await s3Client.send(uploadCommand);

    return NextResponse.json({
      success: true,
      message: `${type} 카드 이미지가 성공적으로 업로드되었습니다.`,
      key: key
    });

  } catch (error) {
    console.error('카드 이미지 업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: '카드 이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
