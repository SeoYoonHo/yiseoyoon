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
    // 메타데이터 파일 읽기
    const metadataKey = 'Works/Painting/metadata.json';
    let artworks: any[] = [];

    try {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
      });
      const response = await s3Client.send(getCommand);
      const metadataContent = await response.Body?.transformToString();
      if (metadataContent) {
        artworks = JSON.parse(metadataContent);
      }
    } catch (error) {
      console.log('메타데이터 파일이 없습니다.');
      return NextResponse.json(
        { success: false, error: '메타데이터 파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 연도별로 그룹핑
    const artworksByYear: { [year: string]: any[] } = {};
    artworks.forEach(artwork => {
      const year = artwork.year;
      if (!artworksByYear[year]) {
        artworksByYear[year] = [];
      }
      artworksByYear[year].push(artwork);
    });

    // 각 연도별로 number 재할당
    Object.keys(artworksByYear).forEach(year => {
      // 연도 내에서 createdAt 기준으로 정렬
      artworksByYear[year].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // 연도별로 1부터 시작하는 number 할당
      artworksByYear[year].forEach((artwork, index) => {
        artwork.number = index + 1;
      });
    });

    // 모든 작품을 다시 하나의 배열로 합치기
    const updatedArtworks: any[] = [];
    Object.keys(artworksByYear).forEach(year => {
      updatedArtworks.push(...artworksByYear[year]);
    });

    // 메타데이터 파일 업데이트
    const putMetadataCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
      Body: JSON.stringify(updatedArtworks, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putMetadataCommand);

    // 결과 요약
    const yearSummary = Object.keys(artworksByYear).map(year => ({
      year,
      count: artworksByYear[year].length
    }));

    return NextResponse.json({
      success: true,
      message: '연도별 번호 재할당이 완료되었습니다.',
      totalArtworks: updatedArtworks.length,
      yearSummary: yearSummary
    });

  } catch (error) {
    console.error('Painting 연도별 번호 재할당 오류:', error);
    return NextResponse.json(
      { success: false, error: '연도별 번호 재할당에 실패했습니다.' },
      { status: 500 }
    );
  }
}
