'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 이미 로그인된 상태인지 확인
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          router.push('/admin');
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
    
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            카카오 계정으로 로그인하여 관리자 페이지에 접근하세요
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <button
            onClick={handleKakaoLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                로그인 중...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11c-1.442.919-3.33 1.1-5.044.798C4.844 20.103 3.75 18.958 3.75 17.5c0-1.458 1.094-2.603 2.979-2.767-.714-2.055-.714-4.433 0-6.488C3.844 7.603 3.75 6.458 3.75 5c0-1.458 1.094-2.603 2.979-2.767C7.343 1.11 9.231.93 10.673.01A13.5 13.5 0 0 1 12 3Z"/>
                </svg>
                카카오로 로그인
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
