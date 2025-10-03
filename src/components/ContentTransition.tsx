'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface ContentTransitionProps {
  readonly children: React.ReactNode;
}

export default function ContentTransition({ children }: ContentTransitionProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== currentPath) {
      // 페이지 변경 시 페이드 아웃
      setIsVisible(false);
      
      // 잠시 후 새 페이지로 페이드 인
      const timer = setTimeout(() => {
        setCurrentPath(pathname);
        setIsVisible(true);
      }, 150); // 150ms 지연

      return () => clearTimeout(timer);
    } else {
      // 초기 로드 시
      setIsVisible(true);
    }
  }, [pathname, currentPath]);

  return (
    <div 
      className={`transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
