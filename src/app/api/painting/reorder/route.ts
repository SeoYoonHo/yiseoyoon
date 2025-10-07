import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function POST(request: NextRequest) {
  try {
    const { artworks } = await request.json();

    if (!artworks || !Array.isArray(artworks)) {
      return NextResponse.json(
        { success: false, error: '잘못된 요청 데이터입니다.' },
        { status: 400 }
      );
    }

    // 메타데이터 파일 읽기
    const metadataKey = 'Works/Painting/metadata.json';
    let existingMetadata: any[] = [];

    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();
      if (metadataContent) {
        existingMetadata = JSON.parse(metadataContent);
      }
    } catch (error) {
      console.log('메타데이터 파일이 없습니다.');
      return NextResponse.json(
        { success: false, error: '메타데이터 파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 클라이언트에서 보낸 새로운 순서를 반영하여 메타데이터 업데이트
    const updatedMetadata = [...existingMetadata];
    
    // 각 작품의 새로운 번호 적용
    artworks.forEach(({ id, number }: { id: string; number: number }) => {
      const artworkIndex = updatedMetadata.findIndex(artwork => artwork.id === id);
      if (artworkIndex !== -1) {
        updatedMetadata[artworkIndex].number = number;
      }
    });

    // 연도별로 번호 재할당 (연속된 번호 보장)
    const artworksByYear: { [year: string]: any[] } = {};
    updatedMetadata.forEach((artwork: any) => {
      const year = artwork.year;
      if (!artworksByYear[year]) {
        artworksByYear[year] = [];
      }
      artworksByYear[year].push(artwork);
    });

    // 각 연도별로 번호 재할당 (클라이언트 순서 유지)
    Object.keys(artworksByYear).forEach(year => {
      // 연도 내에서 number 기준으로 정렬 (클라이언트에서 보낸 순서 유지)
      artworksByYear[year].sort((a: any, b: any) => (a.number || 0) - (b.number || 0));
      
      // 연도별로 1부터 시작하는 연속된 number 할당
      artworksByYear[year].forEach((artwork: any, index: number) => {
        artwork.number = index + 1;
      });
    });

    // 모든 작품을 다시 하나의 배열로 합치기
    const finalMetadata: any[] = [];
    Object.keys(artworksByYear).forEach(year => {
      finalMetadata.push(...artworksByYear[year]);
    });

    // 메타데이터 파일 업데이트
    const putMetadataCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(finalMetadata, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putMetadataCommand);

    return NextResponse.json({
      success: true,
      message: '순서가 성공적으로 저장되었습니다.',
      updatedCount: artworks.length,
    });

  } catch (error) {
    console.error('Painting 순서 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: '순서 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
