import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder');

    if (!folder) {
      return NextResponse.json({ success: false, error: 'Folder parameter is required' }, { status: 400 });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME!;
    const backgroundPath = `${folder}/Background/`;

    // 해당 폴더의 모든 배경 이미지 파일 찾기
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: backgroundPath,
    });

    const listResponse = await s3Client.send(listCommand);
    const objects = listResponse.Contents || [];

    if (objects.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No background images found for this folder' 
      }, { status: 404 });
    }

    // 모든 배경 이미지 파일 삭제
    const deletePromises = objects.map(object => {
      if (object.Key) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: object.Key,
        });
        return s3Client.send(deleteCommand);
      }
      return Promise.resolve();
    });

    await Promise.all(deletePromises);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${objects.length} background image(s) from ${folder}`,
      deletedCount: objects.length
    });

  } catch (error) {
    console.error('Background deletion error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete background images' 
    }, { status: 500 });
  }
}
