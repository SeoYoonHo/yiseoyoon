'use client';

import { useBackground } from '@/contexts/BackgroundContext';

interface BackgroundLayoutProps {
  readonly children: React.ReactNode;
}

export default function BackgroundLayout({ children }: BackgroundLayoutProps) {
  const { backgroundImageUrl, isImageLoaded } = useBackground();

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      {/* Background Artwork - 가운데에 적당한 크기로 표시 */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none ${
          backgroundImageUrl && isImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {backgroundImageUrl && (
          <div 
            className="w-full h-full max-w-6xl max-h-[80vh] bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${backgroundImageUrl})`,
            }}
          />
        )}
      </div>

      {/* Content - Fixed height, no scroll */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
