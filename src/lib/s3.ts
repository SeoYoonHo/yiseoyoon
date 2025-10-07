import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME || 'yiseoyoon';
export const S3_BASE_URL = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://yiseoyoon.s3.ap-northeast-2.amazonaws.com';

// S3 경로 헬퍼 함수들
export const getS3ImageUrl = (path: string): string => {
  // 빈 문자열이나 undefined인 경우 처리
  if (!path || typeof path !== 'string') {
    console.warn('Invalid path provided to getS3ImageUrl:', path);
    return '/placeholder.jpg';
  }
  
  // 이미 전체 URL인 경우 그대로 반환
  if (path.startsWith('http')) {
    return path;
  }
  
  // 상대 경로인 경우 절대 URL로 변환
  if (path.startsWith('/')) {
    // 이미 /로 시작하는 경우 S3_BASE_URL과 결합
    const timestamp = Date.now();
    return `${S3_BASE_URL}${path}?t=${timestamp}`;
  }
  
  // 캐시 무효화를 위한 타임스탬프 추가
  const timestamp = Date.now();
  const url = `${S3_BASE_URL}/${path}`;
  return `${url}?t=${timestamp}`;
};

// 캐시 최적화된 이미지 URL 생성
export const getCachedS3ImageUrl = (path: string, version?: string): string => {
  // 이미 전체 URL인 경우 그대로 반환
  if (path.startsWith('http')) {
    return path;
  }
  
  const baseUrl = `${S3_BASE_URL}/${path}`;
  if (version) {
    return `${baseUrl}?v=${version}`;
  }
  // 버전이 없으면 타임스탬프 사용
  const timestamp = Date.now();
  return `${baseUrl}?t=${timestamp}`;
};

// Home/Background 폴더의 배경 이미지 URL 생성 (확장자 자동 감지)
export const getBackgroundImageUrl = async (): Promise<string> => {
  const basePath = 'Home/Background/background';
  const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  // 기본값으로 jpg 사용
  return getS3ImageUrl(`${basePath}.jpg`);
};

// 배경 이미지 URL 생성 (확장자 포함)
export const getS3ImageUrlWithExtension = (basePath: string, extension?: string): string => {
  if (extension) {
    return `${S3_BASE_URL}/${basePath}.${extension}`;
  }
  return `${S3_BASE_URL}/${basePath}`;
};
