# yiseoyoon - Personal Art Portfolio

이서윤 작가의 개인 작품 포트폴리오 웹사이트입니다. Next.js 15와 Tailwind CSS 4를 사용하여 구축된 현대적이고 반응형 웹사이트입니다.

## 🎨 프로젝트 개요

이 프로젝트는 작가의 작품을 체계적으로 소개하고 전시하는 개인 포트폴리오 웹사이트입니다. 

### 주요 기능
- **홈페이지**: 대표 작품을 배경으로 한 간결한 메인 페이지
- **갤러리**: 전체 작품을 그리드 형태로 표시
- **전시회**: 과거 및 현재 전시회 정보
- **텍스트**: 작가의 글과 생각을 담은 블로그 형태의 섹션
- **작가 소개**: 작가의 이력, 교육, 기법 등 상세 정보
- **연락처**: 작가와의 연락 방법 및 소셜 미디어 링크
- **관리자 페이지**: 콘텐츠 관리 및 배경 이미지 변경 기능

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Fonts**: Geist Sans & Geist Mono
- **Image Optimization**: Next.js Image Component
- **Deployment**: Vercel (권장)

## 📁 프로젝트 구조

```
yiseoyoon/
├── src/
│   ├── app/                    # Next.js App Router 페이지
│   │   ├── page.tsx           # 홈페이지
│   │   ├── layout.tsx         # 공통 레이아웃
│   │   ├── gallery/           # 갤러리 페이지
│   │   ├── exhibitions/       # 전시회 페이지
│   │   ├── text/             # 텍스트 페이지
│   │   ├── about/            # 작가 소개 페이지
│   │   ├── contact/          # 연락처 페이지
│   │   └── admin/            # 관리자 페이지
│   ├── components/           # 재사용 가능한 컴포넌트
│   │   ├── NavBar.tsx        # 네비게이션 바
│   │   ├── BackgroundLayout.tsx # 배경 레이아웃
│   │   ├── GalleryGrid.tsx   # 갤러리 그리드
│   │   ├── TextGrid.tsx      # 텍스트 그리드
│   │   └── Footer.tsx        # 푸터
│   └── data/                 # 정적 데이터
│       ├── site-config.json  # 사이트 설정
│       ├── gallery.json      # 갤러리 작품 데이터
│       ├── exhibitions.json  # 전시회 데이터
│       ├── text.json         # 텍스트 포스트 데이터
│       └── about.json        # 작가 정보 데이터
├── public/
│   └── images/               # 이미지 파일들
│       ├── featured/         # 대표 작품 이미지
│       └── text/            # 텍스트 포스트 이미지
└── package.json
```

## 🚀 시작하기

### 1. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 클론
git clone [repository-url]
cd yiseoyoon

# 의존성 설치
pnpm install
```

### 2. 개발 서버 실행방법

```bash
pnpm run dev
```

개발 서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 웹사이트를 확인할 수 있습니다.

### 3. 빌드 및 배포

```bash
# 프로덕션 빌드
pnpm run build

# 프로덕션 서버 실행
pnpm run start
```

## 📝 콘텐츠 관리

### 작품 추가/수정
`src/data/gallery.json` 파일을 수정하여 갤러리 작품을 관리할 수 있습니다.

### 전시회 정보 수정
`src/data/exhibitions.json` 파일을 수정하여 전시회 정보를 관리할 수 있습니다.

### 텍스트 포스트 추가
`src/data/text.json` 파일을 수정하여 작가의 글을 관리할 수 있습니다.

### 사이트 설정 변경
`src/data/site-config.json` 파일을 수정하여 사이트 제목, 부제목, 설명 등을 변경할 수 있습니다.

### 이미지 관리
- 대표 작품 이미지: `public/images/featured/` 폴더
- 텍스트 포스트 이미지: `public/images/text/` 폴더
- 갤러리 작품 이미지: `public/images/gallery/` 폴더

## 🎨 디자인 특징

- **반응형 디자인**: 모든 디바이스에서 최적화된 경험
- **일관된 배경**: 모든 페이지에서 동일한 배경 이미지 사용
- **글래스모피즘**: 반투명 요소를 활용한 현대적 디자인
- **타이포그래피**: Geist 폰트를 사용한 깔끔한 텍스트
- **색상 시스템**: 흰색과 회색 기반의 미니멀한 컬러 팔레트

## 🔧 관리자 기능

`/admin` 경로에서 다음 기능을 사용할 수 있습니다:
- 사이트 설정 변경 (제목, 부제목, 설명)
- 배경 이미지 관리
- 갤러리 작품 관리 (추후 구현 예정)
- 전시회 정보 관리 (추후 구현 예정)

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
- [Vercel 배포 가이드](https://vercel.com/docs)
# yiseoyoon
