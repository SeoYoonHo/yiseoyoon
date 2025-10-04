# AWS S3 설정 가이드 (간단 버전)

## 1. AWS 계정 및 S3 버킷 설정

### 1.1 AWS 콘솔 접속
- https://aws.amazon.com/console/ 에서 AWS 계정으로 로그인

### 1.2 S3 버킷 생성
1. S3 서비스 선택
2. "버킷 만들기" 클릭
3. 버킷 이름: `yiseoyoon`
4. 리전: `아시아 태평양(서울) ap-northeast-2`
5. "퍼블릭 액세스 차단 설정"에서 "새 퍼블릭 ACL 및 퍼블릭 객체 업로드 차단" 체크 해제
6. "버킷 만들기" 클릭

### 1.3 버킷 정책 설정
1. 생성된 `yiseoyoon` 버킷 클릭
2. "권한" 탭 선택
3. "버킷 정책" 섹션에서 "편집" 클릭
4. 다음 JSON 입력:

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

5. "변경 사항 저장" 클릭

### 1.4 퍼블릭 액세스 차단 해제
1. "권한" 탭에서 "퍼블릭 액세스 차단" 섹션
2. "편집" 클릭
3. 모든 체크박스 해제
4. "변경 사항 저장" 클릭

## 2. IAM 사용자 생성

### 2.1 IAM 서비스 접속
1. AWS 콘솔에서 IAM 서비스 선택

### 2.2 사용자 생성
1. "사용자" → "사용자 추가"
2. 사용자 이름: `yiseoyoon-admin`
3. "정책 직접 연결" 선택
4. `AmazonS3FullAccess` 정책 선택
5. "다음: 태그" → "다음: 검토" → "사용자 만들기"

### 2.3 액세스 키 생성
1. 생성된 사용자 클릭
2. "보안 자격 증명" 탭 선택
3. "액세스 키 만들기" 클릭
4. "애플리케이션 외부에서 사용" 선택
5. "다음" → "액세스 키 만들기"
6. **중요**: 액세스 키 ID와 비밀 액세스 키를 안전하게 저장

## 3. 환경변수 설정

`.env.local` 파일에 실제 AWS 자격 증명 추가:

```env
# AWS S3 Configuration (실제 값으로 변경)
AWS_ACCESS_KEY_ID=AKIA... (실제 액세스 키 ID)
AWS_SECRET_ACCESS_KEY=... (실제 비밀 액세스 키)
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=yiseoyoon
NEXT_PUBLIC_S3_BASE_URL=https://yiseoyoon.s3.ap-northeast-2.amazonaws.com

# 카카오 OAuth (실제 값으로 변경)
KAKAO_CLIENT_ID=your_actual_kakao_rest_api_key
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/kakao/login

# Public environment variables
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_actual_kakao_rest_api_key
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/admin/login/callback

# Admin Access Control (실제 이메일로 변경)
ADMIN_ALLOWED_EMAILS=your-email@gmail.com,admin@yourdomain.com

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_key_change_this_in_production
```

## 4. 테스트

1. 개발 서버 재시작: `npm run dev`
2. 어드민 페이지 접속: `http://localhost:3000/admin`
3. 카카오 로그인 후 데이터 업로드 테스트

## 5. 첫 번째 데이터 추가

### 5.1 배경 이미지 추가
1. `Home/Background/` 폴더에 `background.jpg` 파일을 S3에 업로드
2. 또는 어드민 홈페이지에서 배경 이미지 업로드

### 5.2 작품 추가
1. 어드민 페이지 → Works 탭
2. 작품 이미지와 정보 업로드

### 5.3 기타 콘텐츠
- Exhibitions: 전시 정보 추가
- Text: PDF 파일 업로드
- CV: 작가 정보 및 포스터 이미지
- Contact: 연락처 정보

## 6. 비용 예상

- **S3 스토리지**: 월 1GB = 약 $0.023
- **데이터 전송**: 월 1GB = 약 $0.09
- **API 요청**: 1,000건 = 약 $0.0004

**총 예상 비용**: 월 $1-5 (소규모 개인 사이트 기준)
