# 카카오 OAuth 로그인 설정 가이드

## 1. 카카오 개발자 계정 및 애플리케이션 설정

1. [카카오 개발자 사이트](https://developers.kakao.com)에 접속하여 계정을 생성하거나 로그인합니다.

2. "내 애플리케이션" → "애플리케이션 추가하기"를 클릭합니다.

3. 애플리케이션 정보를 입력합니다:
   - 앱 이름: `yiseoyoon-admin`
   - 사업자명: 개인 또는 회사명

4. 생성된 애플리케이션에서 "앱 키"를 확인합니다:
   - REST API 키를 복사해 둡니다.

5. "카카오 로그인" → "활성화 설정"을 ON으로 변경합니다.

6. "카카오 로그인" → "Redirect URI"에 다음을 추가합니다:
   - 개발 환경: `http://localhost:3000/admin/login/callback`
   - 프로덕션 환경: `https://yourdomain.com/admin/login/callback`

7. "카카오 로그인" → "동의항목"에서 "이메일"을 필수 동의로 설정합니다.

## 2. 환경변수 설정

`.env.local` 파일을 다음과 같이 수정합니다:

```env
# 카카오 OAuth (실제 값으로 변경)
KAKAO_CLIENT_ID=your_actual_kakao_rest_api_key
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/kakao/login

# 클라이언트 사이드용 (실제 값으로 변경)
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_actual_kakao_rest_api_key
NEXT_PUBLIC_KAKAO_REDIRECT_URI=http://localhost:3000/admin/login/callback

# 관리자 이메일 리스트 (실제 이메일로 변경)
ADMIN_ALLOWED_EMAILS=admin@yourdomain.com,your-email@gmail.com

# JWT 시크릿 (프로덕션에서는 안전한 랜덤 문자열로 변경)
JWT_SECRET=your_secure_jwt_secret_key_change_this_in_production
```

## 3. 사용 방법

1. 개발 서버를 실행합니다:
   ```bash
   npm run dev
   ```

2. 브라우저에서 `http://localhost:3000/admin`에 접속합니다.

3. 자동으로 로그인 페이지(`http://localhost:3000/admin/login`)로 리다이렉트됩니다.

4. "카카오로 로그인" 버튼을 클릭합니다.

5. 카카오 로그인 후, 허용된 이메일이면 어드민 페이지에 접근할 수 있습니다.

## 4. 보안 고려사항

- 프로덕션 환경에서는 `JWT_SECRET`을 안전한 랜덤 문자열로 변경하세요.
- `ADMIN_ALLOWED_EMAILS`에 신뢰할 수 있는 이메일만 추가하세요.
- HTTPS를 사용하여 OAuth 콜백을 보호하세요.
- 세션 만료 시간(현재 24시간)을 필요에 따라 조정하세요.

## 5. 문제 해결

### "Email not provided by Kakao" 오류
- 카카오 앱 설정에서 "이메일" 동의항목이 필수로 설정되어 있는지 확인하세요.
- 사용자가 이메일 제공에 동의했는지 확인하세요.

### "Access denied" 오류
- 사용자의 이메일이 `ADMIN_ALLOWED_EMAILS`에 포함되어 있는지 확인하세요.
- 이메일 주소가 정확히 일치하는지 확인하세요 (대소문자 구분 없음).

### "Failed to get access token" 오류
- `KAKAO_CLIENT_ID`와 `KAKAO_REDIRECT_URI`가 올바른지 확인하세요.
- 카카오 앱 설정의 Redirect URI와 일치하는지 확인하세요.
