import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 이미지 파일인지 검사
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/tiff'];
    if (!imageTypes.includes(file.type)) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 1. 해당 폴더의 기존 파일 삭제
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: `${folder}/`,
      });
      
      const listResponse = await s3Client.send(listCommand);
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // 모든 기존 파일 삭제
        for (const obj of listResponse.Contents) {
          if (obj.Key) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: S3_BUCKET,
              Key: obj.Key,
            });
            await s3Client.send(deleteCommand);
            console.log(`Deleted old file: ${obj.Key}`);
          }
        }
      }
    } catch (deleteError) {
      console.warn('Failed to delete old files:', deleteError);
      // 삭제 실패해도 계속 진행
    }

    // 2. 새 파일 업로드 (파일명을 background로 고정하고 원본 확장자 유지)
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${folder}/background.${fileExtension}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // S3에 직접 업로드 (캐시 헤더 포함)
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=0, must-revalidate', // 캐시 비활성화
      Metadata: {
        'upload-timestamp': new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    const publicUrl = getS3ImageUrl(key);
    
    return NextResponse.json({ 
      success: true,
      key,
      publicUrl,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
