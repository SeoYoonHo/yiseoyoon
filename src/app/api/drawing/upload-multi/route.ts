import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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
    const files = formData.getAll('files') as File[];
    const defaultTitle = formData.get('defaultTitle') as string;
    const defaultYear = formData.get('defaultYear') as string;
    const defaultDescription = formData.get('defaultDescription') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    // 기본값 설정
    const baseTitle = defaultTitle || 'Untitled';
    const baseYear = defaultYear || new Date().getFullYear().toString();
    const baseDescription = defaultDescription || '';

    const uploadedArtworks = [];
    const errors = [];

    // 각 파일에 대해 처리
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // 파일 크기 제한 (50MB)
        if (file.size > 50 * 1024 * 1024) {
          errors.push({ fileName: file.name, error: '파일 크기는 50MB를 초과할 수 없습니다.' });
          continue;
        }

        // 파일을 ArrayBuffer로 변환
        const buffer = Buffer.from(await file.arrayBuffer());

        // 고유한 파일명 생성 (각 파일마다 다른 타임스탬프)
        const timestamp = Date.now() + i;
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const originalKey = `Works/Drawing/Original/${timestamp}.${fileExtension}`;
        const thumbnailSmallKey = `Works/Drawing/Thumbnail/Small/${timestamp}.jpg`;
        const thumbnailMediumKey = `Works/Drawing/Thumbnail/Medium/${timestamp}.jpg`;
        const thumbnailLargeKey = `Works/Drawing/Thumbnail/Large/${timestamp}.jpg`;

        // 개별 작품 제목 생성 (기본값 + 번호)
        const artworkTitle = files.length > 1 ? `${baseTitle} ${i + 1}` : baseTitle;

        // 원본 이미지 업로드
        const originalUploadCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: originalKey,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            title: sanitizeMetadataValue(artworkTitle),
            year: sanitizeMetadataValue(baseYear),
            description: sanitizeMetadataValue(baseDescription),
            category: sanitizeMetadataValue('drawing'),
            uploadedAt: sanitizeMetadataValue(new Date().toISOString()),
          },
        });

        await s3Client.send(originalUploadCommand);

        // 반응형 썸네일 생성 및 업로드
        const thumbnailSizes = [
          { key: thumbnailSmallKey, size: 300, name: 'Small' },
          { key: thumbnailMediumKey, size: 500, name: 'Medium' },
          { key: thumbnailLargeKey, size: 800, name: 'Large' }
        ];

        for (const { key, size, name } of thumbnailSizes) {
          const thumbnailBuffer = await sharp(buffer)
            .resize(size, size, { 
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 90 })
            .toBuffer();

          const thumbnailUploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            Metadata: {
              title: sanitizeMetadataValue(artworkTitle),
              year: sanitizeMetadataValue(baseYear),
              description: sanitizeMetadataValue(baseDescription),
              category: sanitizeMetadataValue('drawing'),
              uploadedAt: sanitizeMetadataValue(new Date().toISOString()),
              isThumbnail: 'true',
              thumbnailSize: sanitizeMetadataValue(name),
            },
          });

          await s3Client.send(thumbnailUploadCommand);
        }

        // 메타데이터 생성
        const metadata = {
          id: timestamp.toString(),
          title: artworkTitle,
          year: baseYear,
          description: baseDescription,
          originalImage: originalKey,
          thumbnailSmall: thumbnailSmallKey,
          thumbnailMedium: thumbnailMediumKey,
          thumbnailLarge: thumbnailLargeKey,
          category: 'drawing',
          createdAt: new Date().toISOString(),
        };

        uploadedArtworks.push(metadata);

      } catch (error) {
        console.error(`파일 ${file.name} 업로드 오류:`, error);
        errors.push({ 
          fileName: file.name, 
          error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
        });
      }
    }

    // 메타데이터 파일 업데이트
    if (uploadedArtworks.length > 0) {
      const metadataKey = `Works/Drawing/metadata.json`;
      
      // 기존 메타데이터 불러오기
      let existingMetadata = [];
      try {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: metadataKey,
        });
        const response = await s3Client.send(getCommand);
        const existingData = await response.Body?.transformToString();
        if (existingData) {
          existingMetadata = JSON.parse(existingData);
        }
      } catch (error) {
        console.log('메타데이터 파일이 없습니다. 새로 생성합니다.');
      }

      // 새 메타데이터 추가
      existingMetadata.push(...uploadedArtworks);

      // 메타데이터 파일 업로드
      const { PutObjectCommand: PutMetadataCommand } = await import('@aws-sdk/client-s3');
      const metadataUploadCommand = new PutMetadataCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
        Body: JSON.stringify(existingMetadata, null, 2),
        ContentType: 'application/json',
      });

      await s3Client.send(metadataUploadCommand);
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedArtworks.length}개의 Drawing 작품이 성공적으로 업로드되었습니다.`,
      uploadedCount: uploadedArtworks.length,
      totalFiles: files.length,
      artworks: uploadedArtworks,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Drawing 다중 업로드 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Drawing 다중 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
