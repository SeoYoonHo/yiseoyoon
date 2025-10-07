import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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
    let metadata: { id: string; title: string; fileKey: string; createdAt: string }[] = [];
    try {
      const getMetadataCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: metadataKey,
      });

      const response = await s3Client.send(getMetadataCommand);
      const metadataBody = await response.Body?.transformToString();
      if (metadataBody) {
        const parsed = JSON.parse(metadataBody);
        metadata = Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }

    // 2. 텍스트 항목이 존재하는지 확인
    const textIndex = metadata.findIndex(item => item.id === textId);
    if (textIndex === -1) {
      return NextResponse.json({ error: 'Text not found' }, { status: 404 });
    }

    // 3. PDF 파일 삭제
    const textData = metadata[textIndex];
    const fileKey = textData.fileKey;
    
    // fileKey가 존재하는지 확인
    if (!fileKey || typeof fileKey !== 'string') {
      console.error('Invalid fileKey:', fileKey);
      return NextResponse.json({ error: 'Invalid file key' }, { status: 400 });
    }
    
    // S3 키 처리 (이미 상대경로 형태)
    const pdfKey = fileKey.startsWith('Text/') ? fileKey : `Text/${fileKey}`;
    
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
    metadata.splice(textIndex, 1);

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
