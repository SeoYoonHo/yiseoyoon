import { getS3ImageUrl } from './s3';

/**
 * 화면 크기에 따라 적절한 썸네일 이미지를 선택하는 함수
 */
export function getResponsiveThumbnail(
  thumbnailSmall: string,
  thumbnailMedium: string,
  thumbnailLarge: string,
  fallback?: string
): string {
  // 기본값으로 fallback 또는 small 사용
  const defaultThumbnail = fallback || thumbnailSmall;
  
  // 클라이언트 사이드에서는 JavaScript로 처리
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    
    if (width >= 1024) {
      // 데스크톱 (1024px 이상) - Large
      const selectedPath = thumbnailLarge || thumbnailMedium || thumbnailSmall || defaultThumbnail;
      return getS3ImageUrl(selectedPath);
    } else if (width >= 768) {
      // 태블릿 (768px 이상) - Medium
      const selectedPath = thumbnailMedium || thumbnailSmall || defaultThumbnail;
      return getS3ImageUrl(selectedPath);
    } else {
      // 모바일 (768px 미만) - Small
      const selectedPath = thumbnailSmall || defaultThumbnail;
      return getS3ImageUrl(selectedPath);
    }
  }
  
  // 서버 사이드에서는 기본값 반환 (S3 URL로 변환)
  return getS3ImageUrl(defaultThumbnail);
}

/**
 * CSS 클래스를 사용한 반응형 썸네일 선택
 * Tailwind CSS의 responsive classes를 활용
 */
export function getThumbnailSrcSet(
  thumbnailSmall: string,
  thumbnailMedium: string,
  thumbnailLarge: string
): string {
  return `${thumbnailSmall} 300w, ${thumbnailMedium} 500w, ${thumbnailLarge} 800w`;
}

/**
 * 반응형 썸네일의 sizes 속성
 */
export function getThumbnailSizes(): string {
  return '(max-width: 768px) 300px, (max-width: 1024px) 500px, 800px';
}
