'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminNavBar from '@/components/AdminNavBar';
// Admin doesn't need background image

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          setIsAuthenticated(true);
        } else if (pathname !== '/admin/login' && pathname !== '/admin/login/callback') {
          // 로그인 페이지와 콜백 페이지가 아닌 경우에만 리다이렉트
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (pathname !== '/admin/login' && pathname !== '/admin/login/callback') {
          router.push('/admin/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 페이지와 콜백 페이지인 경우
  if (pathname === '/admin/login' || pathname === '/admin/login/callback') {
    return <>{children}</>;
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return null;
  }

  // 인증된 경우 - 어드민 전용 레이아웃 (배경 없음)
  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <AdminNavBar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto pt-24">
        {children}
      </main>
    </div>
  );
}
