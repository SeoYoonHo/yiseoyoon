'use client';

import { useBackground } from '@/contexts/BackgroundContext';

interface BackgroundLayoutProps {
  readonly children: React.ReactNode;
}

export default function BackgroundLayout({ children }: BackgroundLayoutProps) {
  const { backgroundImageUrl, isImageLoaded } = useBackground();

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background Artwork - Fixed to viewport, never moves */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 bg-cover bg-center bg-no-repeat transition-opacity duration-200 pointer-events-none ${
          isImageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Content - Fixed height, no scroll */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
