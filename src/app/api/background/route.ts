import { NextRequest, NextResponse } from 'next/server';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, getS3ImageUrl } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderParam = searchParams.get('folder') || 'Home';
    const folder = `${folderParam}/Background`;
    
    console.log('Background API called with folderParam:', folderParam);
    console.log('Searching for folder:', folder);
    
    // S3에서 해당 폴더의 파일 목록 가져오기
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: `${folder}/`,
    });
    
    const listResponse = await s3Client.send(listCommand);
    
    console.log('S3 list response:', {
      contentsCount: listResponse.Contents?.length || 0,
      contents: listResponse.Contents?.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      }))
    });
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log('No contents found in S3 for folder:', folder);
      return NextResponse.json({ 
        success: false,
        error: 'No background image found' 
      });
    }
    
    // 폴더를 제외하고 실제 파일만 필터링 (Size > 0)
    const files = listResponse.Contents.filter(item => item.Size && item.Size > 0);
    
    console.log('Filtered files (Size > 0):', files.length);
    
    if (files.length === 0) {
      console.log('No files with size > 0 found');
      return NextResponse.json({ 
        success: false,
        error: 'No background image file found' 
      });
    }
    
    // 첫 번째 실제 파일 선택
    const firstFile = files[0];
    if (!firstFile.Key) {
      console.log('First file has no key');
      return NextResponse.json({ 
        success: false,
        error: 'Invalid file key' 
      });
    }
    
    const imageUrl = getS3ImageUrl(firstFile.Key);
    console.log('Generated image URL:', imageUrl);
    
    return NextResponse.json({ 
      success: true,
      imageUrl,
      key: firstFile.Key,
      lastModified: firstFile.LastModified
    });
  } catch (error) {
    console.error('Background fetch error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch background' 
    }, { status: 500 });
  }
}
