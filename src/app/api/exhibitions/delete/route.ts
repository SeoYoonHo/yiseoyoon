import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exhibitionId = searchParams.get('id');

    if (!exhibitionId) {
      return NextResponse.json({ error: 'Exhibition ID is required' }, { status: 400 });
    }

    const metadataKey = 'Exhibitions/metadata.json';
    let metadata: Record<string, Exhibition> = {};

    // 1. metadata.json 가져오기
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString) as Record<string, Exhibition>;
      }
    } catch {
      return NextResponse.json({ error: 'Exhibition metadata not found' }, { status: 404 });
    }

    // 2. 전시 존재 확인
    if (!metadata[exhibitionId]) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    // 3. S3에서 전시 폴더의 모든 파일 삭제
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: `Exhibitions/${exhibitionId}/`,
      });
      
      const listResponse = await s3Client.send(listCommand);
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        for (const obj of listResponse.Contents) {
          if (obj.Key) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: obj.Key,
            });
            await s3Client.send(deleteCommand);
            console.log(`Deleted: ${obj.Key}`);
          }
        }
      }
    } catch (deleteError) {
      console.error('Failed to delete exhibition files:', deleteError);
    }

    // 4. 메타데이터에서 전시 제거
    delete metadata[exhibitionId];

    // 5. 업데이트된 metadata.json 업로드
    const putMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(putMetadataCommand);

    return NextResponse.json({
      success: true,
      message: 'Exhibition deleted successfully',
    });

  } catch (error) {
    console.error('Exhibition deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete exhibition' }, { status: 500 });
  }
}

