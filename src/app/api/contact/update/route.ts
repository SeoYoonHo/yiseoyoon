import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

export async function PUT(request: NextRequest) {
  try {
    const { text, instagramUrl } = await request.json();

    const metadataKey = 'Contact/metadata.json';
    let metadata: {
      text: string;
      instagramUrl: string;
      updatedAt: string;
    } = {
      text: '',
      instagramUrl: '',
      updatedAt: new Date().toISOString(),
    };

    // 기존 메타데이터 가져오기
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });

      const response = await s3Client.send(getMetadataCommand);
      const metadataBody = await response.Body?.transformToString();
      if (metadataBody) {
        metadata = JSON.parse(metadataBody);
      }
    } catch (error) {
      console.log('Contact metadata.json not found, creating new one');
    }

    // 텍스트 파일 업로드
    const textKey = 'Contact/text.txt';

    const uploadTextCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: textKey,
      Body: text || '',
      ContentType: 'text/plain',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(uploadTextCommand);

    // 메타데이터 업데이트
    metadata.text = text || '';
    metadata.instagramUrl = instagramUrl || '';
    metadata.updatedAt = new Date().toISOString();

    // 업데이트된 메타데이터를 S3에 업로드
    const uploadMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(uploadMetadataCommand);

    console.log('Contact updated successfully:', { text, instagramUrl });

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
      metadata,
    });

  } catch (error) {
    console.error('Contact update error:', error);
    return NextResponse.json(
      { error: 'Failed to update Contact' },
      { status: 500 }
    );
  }
}
