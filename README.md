# yiseoyoon - Personal Art Portfolio

이서윤 작가의 개인 작품 포트폴리오 웹사이트입니다. Next.js 15와 Tailwind CSS 4를 사용하여 구축된 현대적이고 반응형 웹사이트입니다.

## 🎨 프로젝트 개요

이 프로젝트는 작가의 작품을 체계적으로 소개하고 전시하는 개인 포트폴리오 웹사이트입니다. 

### 주요 기능
- **홈페이지**: 대표 작품을 배경으로 한 간결한 메인 페이지
- **Works**: Painting과 Drawing 작품을 카테고리별로 구분하여 표시
- **전시회**: 과거 및 현재 전시회 정보
- **텍스트**: 작가의 글과 생각을 담은 PDF 문서
- **CV**: 작가의 이력, 교육, 기법 등 상세 정보 및 포스터 갤러리
- **연락처**: 작가와의 연락 방법 및 소셜 미디어 링크
- **관리자 페이지**: 콘텐츠 관리, 작품 업로드, 전시회 관리 기능

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Fonts**: Geist Sans & Geist Mono
- **Image Optimization**: Next.js Image Component
- **Cloud Storage**: AWS S3
- **Authentication**: Kakao OAuth
- **Deployment**: Vercel (권장)

## 📁 프로젝트 구조

```
yiseoyoon/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── site/              # 공개 사이트 페이지
│   │   │   ├── home/          # 홈페이지
│   │   │   ├── works/         # 작품 페이지 (Painting/Drawing)
│   │   │   ├── exhibitions/   # 전시회 페이지
│   │   │   ├── text/          # 텍스트 페이지
│   │   │   ├── cv/            # CV 페이지
│   │   │   └── contact/       # 연락처 페이지
│   │   ├── admin/             # 관리자 페이지
│   │   │   ├── works/         # 작품 관리
│   │   │   ├── exhibitions/   # 전시회 관리
│   │   │   ├── cv/            # CV 관리
│   │   │   ├── contact/       # 연락처 관리
│   │   │   └── text/          # 텍스트 관리
│   │   ├── api/               # API 라우트
│   │   │   ├── painting/      # Painting 작품 API
│   │   │   ├── drawing/       # Drawing 작품 API
│   │   │   ├── works/         # Works 카드 이미지 API
│   │   │   ├── exhibitions/   # 전시회 API
│   │   │   ├── cv/            # CV API
│   │   │   ├── contact/       # 연락처 API
│   │   │   └── text/          # 텍스트 API
│   │   ├── layout.tsx         # 공통 레이아웃
│   │   └── page.tsx           # 루트 페이지
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── NavBar.tsx         # 공개 사이트 네비게이션
│   │   ├── AdminNavBar.tsx    # 관리자 네비게이션
│   │   ├── WorksGrid.tsx      # 작품 그리드
│   │   ├── ImageModal.tsx     # 이미지 모달
│   │   └── PDFViewer.tsx      # PDF 뷰어
│   └── lib/                   # 유틸리티 함수
│       └── s3.ts              # S3 관련 함수
├── public/                    # 정적 파일
└── package.json
```

## 🚀 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# AWS S3 설정
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_REGION=ap-northeast-2

# Kakao OAuth 설정
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
KAKAO_REDIRECT_URI=http://localhost:3000/admin/login/callback

# JWT Secret
JWT_SECRET=your_jwt_secret
```

### 2. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 클론
git clone [repository-url]
cd yiseoyoon

# 의존성 설치
pnpm install
```

### 3. 개발 서버 실행방법

```bash
pnpm run dev
```

개발 서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 웹사이트를 확인할 수 있습니다.

### 4. 빌드 및 배포

```bash
# 프로덕션 빌드
pnpm run build

# 프로덕션 서버 실행
pnpm run start
```

## 📝 콘텐츠 관리

모든 콘텐츠는 관리자 페이지(`/admin`)에서 웹 인터페이스를 통해 관리할 수 있습니다.

### 작품 관리
- **Painting 작품**: `/admin/works/painting`에서 업로드, 수정, 삭제
- **Drawing 작품**: `/admin/works/drawing`에서 업로드, 수정, 삭제
- **Works 카드 이미지**: `/admin/works`에서 Painting/Drawing 카테고리 이미지 업로드

### 전시회 관리
- `/admin/exhibitions`에서 전시회 정보 추가, 수정, 삭제
- 전시회 사진 업로드 및 관리

### CV 관리
- `/admin/cv`에서 CV 텍스트 내용 수정
- CV 포스터 이미지 업로드 및 관리

### 텍스트 관리
- `/admin/text`에서 PDF 문서 업로드 및 관리

### 연락처 관리
- `/admin/contact`에서 연락처 정보 수정

## 🎨 디자인 특징

- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **CSS Columns Layout**: 작품과 포스터를 원본 비율로 표시하는 masonry 레이아웃
- **글래스모피즘**: 반투명 요소를 활용한 현대적 디자인
- **타이포그래피**: Geist 폰트를 사용한 깔끔한 텍스트
- **색상 시스템**: 흰색과 회색 기반의 미니멀한 컬러 팔레트
- **애니메이션**: 페이드인, 스케일, 트랜지션 효과

## 🔧 주요 기능

### 작품 관리
- Painting과 Drawing 카테고리별 작품 관리
- 원본 이미지와 썸네일 자동 생성
- 연도별 필터링 및 타임라인 표시
- 작품 클릭 시 모달로 상세 보기

### 이미지 최적화
- AWS S3를 통한 클라우드 스토리지
- Next.js Image 컴포넌트를 통한 이미지 최적화
- 반응형 이미지 로딩

### 인증 시스템
- Kakao OAuth를 통한 관리자 인증
- JWT 토큰 기반 세션 관리

## 📱 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 🤝 기여하기

이 프로젝트는 개인 포트폴리오 웹사이트입니다. 버그 리포트나 개선 제안은 언제든 환영합니다.

## 📄 라이선스

이 프로젝트는 개인 사용을 위한 것입니다.

## 🔗 관련 링크

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [AWS S3 문서](https://docs.aws.amazon.com/s3/)
- [Vercel 배포 가이드](https://vercel.com/docs)
