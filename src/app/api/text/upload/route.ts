import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file || !title) {
      return NextResponse.json({ error: 'File and title are required' }, { status: 400 });
    }

    // PDF 파일인지 검사
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일명을 제목 기반으로 생성 (공백을 언더스코어로 변경)
    let safeFilename = title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_가-힣-]/g, '');
    
    // 빈 문자열이거나 너무 짧은 경우 타임스탬프 사용
    if (!safeFilename || safeFilename.length < 1) {
      safeFilename = `text_${Date.now()}`;
      console.warn('Title resulted in empty filename, using timestamp:', safeFilename);
    }
    
    const originalKey = `Text/${safeFilename}.pdf`;

    // PDF 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // PDF 파일을 S3에 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: originalKey,
      Body: buffer,
      ContentType: 'application/pdf',
      CacheControl: 'public, max-age=31536000',
    });

    await s3Client.send(uploadCommand);

    // Text/metadata.json 파일 가져오기
    const metadataKey = 'Text/metadata.json';
    let metadata: Record<string, {
      title: string;
      pdfUrl: string;
      uploadedAt: string;
    }> = {};

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
      console.log('Text metadata.json not found, creating new one');
    }

    // 새 텍스트 항목 추가
    const textId = safeFilename;
    metadata[textId] = {
      title: title,
      pdfUrl: getS3ImageUrl(originalKey),
      uploadedAt: new Date().toISOString(),
    };

    // 업데이트된 메타데이터를 S3에 업로드
    const uploadMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(uploadMetadataCommand);

    console.log('Text uploaded successfully:', {
      textId,
      title,
      pdfUrl: getS3ImageUrl(originalKey),
    });

    return NextResponse.json({
      success: true,
      message: 'Text uploaded successfully',
      textId,
      title,
      pdfUrl: getS3ImageUrl(originalKey),
    });

  } catch (error) {
    console.error('Text upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload text' },
      { status: 500 }
    );
  }
}
