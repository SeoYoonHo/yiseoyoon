import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

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
    // Exhibitions 폴더의 모든 객체 나열
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Exhibitions/',
    });

    const response = await s3Client.send(listCommand);
    const objects = response.Contents || [];

    // 전시별로 그룹화
    const exhibitions: Record<string, { thumbnails: string[]; originals: string[] }> = {};
    
    for (const obj of objects) {
      const key = obj.Key || '';
      if (key.includes('/Thumbnail/') || key.includes('/Original/')) {
        const parts = key.split('/');
        if (parts.length >= 3) {
          const exhibitionId = parts[1];
          if (!exhibitions[exhibitionId]) {
            exhibitions[exhibitionId] = {
              thumbnails: [],
              originals: []
            };
          }
          
          if (key.includes('/Thumbnail/')) {
            exhibitions[exhibitionId].thumbnails.push(key);
          } else if (key.includes('/Original/')) {
            exhibitions[exhibitionId].originals.push(key);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      exhibitions,
      totalObjects: objects.length,
      message: 'S3 objects listed successfully',
    });

  } catch (error) {
    console.error('Failed to list S3 objects:', error);
    return NextResponse.json({ error: 'Failed to list S3 objects' }, { status: 500 });
  }
}
