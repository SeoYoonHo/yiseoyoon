'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginCallbackPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessedRef = useRef(false);

  const handleCallback = useCallback(async () => {
    // 중복 실행 방지
    if (hasProcessedRef.current) {
      console.log('Callback already processed, skipping...');
      return;
    }
    
    hasProcessedRef.current = true;
    console.log('Processing callback...');

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setError('로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
      return;
    }

    if (!code) {
      setError('인증 코드를 받지 못했습니다.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Calling /api/auth/kakao/login with code:', code);
      const response = await fetch(`/api/auth/kakao/login?code=${code}`);
      const data = await response.json();

      if (response.ok && data.success) {
        // 로그인 성공 - 어드민 페이지로 리다이렉트
        router.push('/admin');
      } else {
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login callback error:', error);
      setError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <button
              onClick={() => router.push('/admin/login')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              다시 로그인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
