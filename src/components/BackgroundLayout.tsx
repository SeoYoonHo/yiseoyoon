'use client';

import { useBackground } from '@/contexts/BackgroundContext';

interface BackgroundLayoutProps {
  readonly children: React.ReactNode;
}

export default function BackgroundLayout({ children }: BackgroundLayoutProps) {
  const { backgroundImageUrl, isImageLoaded } = useBackground();

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      {/* Background Artwork - Fixed to viewport, never moves */}
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-200 pointer-events-none ${
          backgroundImageUrl && isImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        }}
      >
        {/* 원본 이미지 밝기 유지를 위해 오버레이 제거 */}
      </div>

      {/* Content - Fixed height, no scroll */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
