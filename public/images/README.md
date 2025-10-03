# 이미지 폴더 구조

## 갤러리 이미지
- `gallery/` 폴더에 작품 이미지들을 저장하세요
- 권장 해상도: 최소 1200px (가로)
- 지원 형식: JPG, PNG, WebP
- 파일명 예시: `artwork-01.jpg`, `artwork-02.png`

## 프로필 이미지
- `profile/` 폴더에 작가 프로필 사진을 저장하세요
- 권장 해상도: 800x800px (정사각형)
- 지원 형식: JPG, PNG, WebP
- 파일명 예시: `profile.jpg`

## 사용법
1. 이미지 파일들을 해당 폴더에 업로드
2. `src/app/page.tsx` 파일에서 이미지 경로 수정
3. Next.js Image 컴포넌트가 자동으로 최적화합니다
