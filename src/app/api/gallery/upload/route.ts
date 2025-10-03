import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const description = formData.get('description') as string;

    if (!file || !title || !date) {
      return NextResponse.json({ error: 'File, title, and date are required' }, { status: 400 });
    }

    // 이미지 파일인지 검사
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/tiff'];
    if (!imageTypes.includes(file.type)) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일명을 제목 기반으로 생성 (공백을 언더스코어로 변경)
    // 한글 완성형(가-힣), 영문, 숫자, 언더스코어, 하이픈만 허용
    let safeFilename = title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_가-힣-]/g, '');
    
    // 빈 문자열이거나 너무 짧은 경우 타임스탬프 사용
    if (!safeFilename || safeFilename.length < 1) {
      safeFilename = `artwork_${Date.now()}`;
      console.warn('Title resulted in empty filename, using timestamp:', safeFilename);
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const originalKey = `Gallery/${safeFilename}.${fileExtension}`;
    const thumbnailKey = `Gallery/Thumbnail/${safeFilename}_thumb.jpg`;

    // 1. 원본 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. 썸네일 생성 (300x300)
    let thumbnailBuffer: Buffer;
    try {
      thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (sharpError) {
      console.error('Thumbnail generation error:', sharpError);
      return NextResponse.json({ error: '썸네일 생성에 실패했습니다.' }, { status: 500 });
    }

    // 3. 원본 이미지 S3에 업로드 (메타데이터는 metadata.json에만 저장)
    const uploadOriginalCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: originalKey,
      Body: buffer,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        'upload-timestamp': new Date().toISOString(),
      },
    });

    await s3Client.send(uploadOriginalCommand);

    // 4. 썸네일 이미지 S3에 업로드
    const uploadThumbnailCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await s3Client.send(uploadThumbnailCommand);

    // 5. metadata.json 업데이트
    const metadataKey = 'Gallery/metadata.json';
    let metadata: Record<string, {
      title: string;
      date: string;
      description: string;
      originalImage: string;
      thumbnailImage: string;
      uploadedAt: string;
    }> = {};

    // 기존 metadata.json 가져오기
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });
      const metadataResponse = await s3Client.send(getMetadataCommand);
      const metadataString = await metadataResponse.Body?.transformToString();
      if (metadataString) {
        metadata = JSON.parse(metadataString);
        console.log('Existing metadata loaded:', Object.keys(metadata));
      }
    } catch (getError) {
      // metadata.json이 없으면 새로 만듦
      const error = getError as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        console.log('No existing metadata.json, creating new one');
      } else {
        console.error('Error fetching metadata:', getError);
      }
    }

    // 새 작품 정보 추가
    metadata[safeFilename] = {
      title,
      date,
      description: description || '',
      originalImage: getS3ImageUrl(originalKey),
      thumbnailImage: getS3ImageUrl(thumbnailKey),
      uploadedAt: new Date().toISOString(),
    };

    console.log('Updated metadata with new artwork:', safeFilename);
    console.log('Total artworks in metadata:', Object.keys(metadata).length);

    // metadata.json 업로드
    try {
      const putMetadataCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
        CacheControl: 'public, max-age=0, must-revalidate',
      });

      await s3Client.send(putMetadataCommand);
      console.log('Metadata successfully uploaded to S3');
    } catch (putError) {
      console.error('Failed to upload metadata to S3:', putError);
      // 메타데이터 업데이트 실패 시 에러 반환
      return NextResponse.json({ 
        error: 'Failed to update metadata', 
        details: putError instanceof Error ? putError.message : String(putError)
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      originalKey,
      thumbnailKey,
      message: '작품이 성공적으로 업로드되었습니다.'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '업로드에 실패했습니다.' }, { status: 500 });
  }
}
