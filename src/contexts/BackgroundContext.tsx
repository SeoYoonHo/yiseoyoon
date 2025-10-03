'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import siteConfig from '@/data/site-config.json';
import { getS3ImageUrl } from '@/lib/s3';

interface BackgroundContextType {
  backgroundImageUrl: string;
  isImageLoaded: boolean;
  isLoading: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 이미 로드된 경우 다시 로드하지 않음
    if (backgroundImageUrl && isImageLoaded) {
      setIsLoading(false);
      return;
    }

    const loadBackgroundImage = () => {
      const basePath = siteConfig.featuredBackground?.image || 'Home/Background/background';
      const imageUrl = getS3ImageUrl(`${basePath}`);
      
      // 즉시 URL 설정 (캐시된 이미지의 경우 즉시 표시)
      setBackgroundImageUrl(imageUrl);
      setIsImageLoaded(true);
      setIsLoading(false);
      
      // 백그라운드에서 프리로딩
      const img = new Image();
      img.onload = () => {
        console.log('Background image preloaded successfully');
      };
      img.onerror = () => {
        console.warn('Failed to preload background image');
      };
      img.src = imageUrl;
    };

    loadBackgroundImage();
  }, [backgroundImageUrl, isImageLoaded]);

  const contextValue = useMemo(() => ({
    backgroundImageUrl,
    isImageLoaded,
    isLoading
  }), [backgroundImageUrl, isImageLoaded, isLoading]);

  return (
    <BackgroundContext.Provider value={contextValue}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
