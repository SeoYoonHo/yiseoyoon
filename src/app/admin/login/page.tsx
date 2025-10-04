'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 이미 로그인된 상태인지 확인
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.email);
          // router.push('/admin'); // 자동 리다이렉트 제거하여 사용자가 선택할 수 있게 함
        }
      } catch {
        // 로그인되지 않은 상태
      }
    };

    checkAuth();
  }, [router]);

  const handleKakaoLogin = () => {
    setIsLoading(true);
    setError(null);

    const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || 'your_kakao_rest_api_key';
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/admin/login/callback';
    
    // 카카오 계정 선택을 강제하기 위해 prompt=select_account 추가
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=account_email&prompt=select_account`;
    
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Admin Login
              </h2>
              {currentUser ? (
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    현재 로그인된 계정: <span className="font-semibold text-gray-900">{currentUser}</span>
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/admin')}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      어드민 페이지로 이동
                    </button>
                    <button
                      onClick={async () => {
                        // 서버에서 로그아웃 처리
                        try {
                          await fetch('/api/auth/logout', { method: 'POST' });
                        } catch (error) {
                          console.error('Logout error:', error);
                        }
                        // 클라이언트에서도 쿠키 삭제
                        document.cookie = 'admin-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                        // 카카오 계정 선택을 강제하기 위해 새 탭에서 로그인
                        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code&scope=account_email&prompt=select_account`;
                        window.location.href = kakaoAuthUrl;
                      }}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      다른 카카오 계정으로 로그인
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-center text-sm text-gray-600">
                  카카오 계정으로 로그인하여 관리자 페이지에 접근하세요
                </p>
              )}
            </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!currentUser && (
          <div>
            <button
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.33 0-2.57-.36-3.64-1l-.29-.17L3.55 19.5l.67-4.52-.17-.29C3.36 13.57 3 12.33 3 11c0-4.96 4.04-9 9-9s9 4.04 9 9-4.04 9-9 9zm4.5-6.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                  카카오로 로그인
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
