'use client';

import { useEffect } from 'react';

export default function ConsoleSuppressor() {
  useEffect(() => {
    // 브라우저 콘솔 경고 억제
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      // 자동 스크롤 관련 경고 필터링
      if (message.includes('Skipping auto-scroll behavior') || 
          message.includes('position: sticky') || 
          message.includes('position: fixed')) {
        return; // 경고 무시
      }
      // 다른 경고는 정상 출력
      originalWarn.apply(console, args);
    };

    // cleanup
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null; // 렌더링하지 않음
}
