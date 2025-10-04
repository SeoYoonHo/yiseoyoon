# S3 설정 가이드

## 1. AWS S3 버킷 생성

1. AWS 콘솔에 로그인
2. S3 서비스로 이동
3. "버킷 만들기" 클릭
4. 버킷 이름: `yiseoyoon`
5. 리전: `아시아 태평양(서울) ap-northeast-2`
6. 퍼블릭 액세스 차단 설정 해제 (이미지 공개를 위해)

## 2. 버킷 정책 설정

**중요**: 403 오류를 해결하기 위해 반드시 설정해야 합니다.

### AWS 콘솔에서 설정:
1. S3 콘솔 → `yiseoyoon` 버킷 선택
2. **Permissions** 탭 → **Bucket policy** 섹션
3. **Edit** 클릭하여 다음 JSON 설정:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::yiseoyoon/*"
        }
    ]
}
```

4. **Save changes** 클릭

### 퍼블릭 액세스 차단 설정:
1. **Permissions** 탭 → **Block public access** 섹션
2. **Edit** 클릭
3. **Block all public access** 체크 해제
4. 확인 메시지에 `confirm` 입력
5. **Save changes** 클릭

## 2-1. CORS 설정

AWS S3 콘솔에서 CORS 설정:

1. S3 콘솔 → `yiseoyoon` 버킷 선택
2. **Permissions** 탭 → **Cross-origin resource sharing (CORS)** 섹션
3. **Edit** 클릭하여 다음 JSON 설정:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3000",
            "https://localhost:3001",
            "https://yiseoyoon.vercel.app",
            "https://yiseoyoon.com",
            "https://www.yiseoyoon.com"
        ],
        "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
        "MaxAgeSeconds": 3000
    }
]
```

4. **Save changes** 클릭

## 3. 폴더 구조 생성

버킷 내에 다음 폴더 구조를 생성:

```
yiseoyoon/
├── Home/
│   └── Background/
│       └── background.jpg (배경 이미지)
├── Works/
│   └── (갤러리 작품들)
├── Exhibitions/
│   └── (전시회 이미지들)
├── Text/
│   └── (텍스트 포스트 이미지들)
└── About/
    └── (작가 소개 이미지들)
```

## 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# AWS S3 설정
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=yiseoyoon

# S3 Base URL (공개 읽기용)
NEXT_PUBLIC_S3_BASE_URL=https://yiseoyoon.s3.ap-northeast-2.amazonaws.com
```

## 5. IAM 사용자 생성

1. IAM 서비스로 이동
2. "사용자" → "사용자 추가"
3. 사용자 이름: `yiseoyoon-s3-user`
4. 정책 직접 연결: `AmazonS3FullAccess` (또는 커스텀 정책)
5. 액세스 키 생성 후 `.env.local`에 추가

## 6. 첫 번째 이미지 업로드

1. `Home/Background/` 폴더에 `background.jpg` 파일 업로드
2. 관리자 페이지(`/admin`)에서 이미지 업로드 테스트
3. 홈페이지에서 배경 이미지 확인

## 7. 비용 최적화 팁

- **스토리지 클래스**: Standard → IA (Infrequent Access) 사용
- **생명주기 정책**: 30일 후 IA로 이동, 1년 후 Glacier로 이동
- **CloudFront**: CDN 사용으로 전송 비용 절약
- **이미지 압축**: 업로드 전 이미지 최적화

## 8. 보안 고려사항

- 업로드는 서버사이드에서만 수행 (API 라우트)
- 읽기는 클라이언트에서 직접 S3 URL 사용
- CORS 설정으로 특정 도메인에서만 접근 허용
- 정기적인 액세스 키 로테이션

## 9. 문제 해결

### CORS 오류가 발생하는 경우
1. AWS S3 콘솔에서 CORS 설정 확인
2. 도메인이 CORS 설정에 포함되어 있는지 확인
3. 브라우저 캐시 삭제

### 403 Forbidden 오류가 발생하는 경우
1. **버킷 정책 설정 확인** (가장 중요)
   - S3 콘솔 → 버킷 → Permissions → Bucket policy
   - 퍼블릭 읽기 권한이 설정되어 있는지 확인
2. **퍼블릭 액세스 차단 해제**
   - Permissions → Block public access → Edit
   - 모든 체크박스 해제 후 저장
3. **파일 경로 확인**
   - `Home/Background/background.jpg` 파일이 존재하는지 확인
4. **CORS 설정 확인**
   - Permissions → CORS 설정이 올바른지 확인

### 이미지가 표시되지 않는 경우
1. 버킷 정책 확인
2. 파일 경로 확인
3. CORS 설정 확인
4. 환경 변수 확인

### 업로드가 실패하는 경우
1. IAM 권한 확인
2. API 라우트 로그 확인
3. 네트워크 연결 확인
4. 파일 크기 제한 확인
