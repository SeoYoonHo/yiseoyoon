import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const textId = searchParams.get('id');

    if (!textId) {
      return NextResponse.json({ error: 'Text ID is required' }, { status: 400 });
    }

    const metadataKey = 'Text/metadata.json';

    // 1. metadata.json 가져오기
    let metadata: Record<string, any> = {};
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
      console.error('Failed to fetch metadata:', error);
      return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }

    // 2. 텍스트 항목이 존재하는지 확인
    if (!metadata[textId]) {
      return NextResponse.json({ error: 'Text not found' }, { status: 404 });
    }

    // 3. PDF 파일 삭제
    const textData = metadata[textId];
    const pdfUrl = textData.pdfUrl;
    
    // S3 URL에서 키 추출
    const pdfKey = pdfUrl.split('/').slice(-2).join('/'); // 'Text/filename.pdf'
    
    try {
      const deletePdfCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: pdfKey,
      });
      await s3Client.send(deletePdfCommand);
      console.log('PDF file deleted:', pdfKey);
    } catch (error) {
      console.error('Failed to delete PDF file:', error);
      // PDF 파일 삭제 실패해도 계속 진행
    }

    // 4. 메타데이터에서 항목 제거
    delete metadata[textId];

    // 5. 업데이트된 메타데이터를 S3에 업로드
    const uploadMetadataCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: metadataKey,
      Body: JSON.stringify(metadata, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=0, must-revalidate',
    });

    await s3Client.send(uploadMetadataCommand);

    console.log('Text deleted successfully:', textId);

    return NextResponse.json({
      success: true,
      message: 'Text deleted successfully',
    });

  } catch (error) {
    console.error('Text delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete text' },
      { status: 500 }
    );
  }
}
