'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface BackgroundContextType {
  backgroundImageUrl: string;
  isImageLoaded: boolean;
  isLoading: boolean;
  refreshBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cacheKey, setCacheKey] = useState<number>(Date.now());

  // 현재 경로에 따른 배경 이미지 폴더 결정
  const getBackgroundFolder = (path: string) => {
    if (path.startsWith('/site/works/painting')) return 'Painting';
    if (path.startsWith('/site/works/drawing')) return 'Drawing';
    if (path.startsWith('/site/works')) return 'Works';
    if (path.startsWith('/site/exhibitions')) return 'Exhibitions';
    if (path.startsWith('/site/text')) return 'Text';
    if (path.startsWith('/site/cv')) return 'CV';
    if (path.startsWith('/site/contact')) return 'Contact';
    if (path.startsWith('/site/home') || path === '/') return 'Home';
    return 'Home'; // 기본값
  };

  useEffect(() => {
    const loadBackgroundImage = async () => {
      setIsLoading(true);
      
      try {
        const folder = getBackgroundFolder(pathname);
        // API를 통해 해당 폴더의 배경 이미지 가져오기
        const response = await fetch(`/api/background?folder=${folder}&v=${cacheKey}`);
        const data = await response.json();
        
        if (data.success && data.imageUrl) {
          const imageUrl = `${data.imageUrl}?v=${cacheKey}`;
          setBackgroundImageUrl(imageUrl);
          
          // 프리로딩
          const img = new Image();
          img.onload = () => {
            console.log(`Background image loaded successfully for ${folder}`);
            setIsImageLoaded(true);
            setIsLoading(false);
          };
          img.onerror = () => {
            console.warn(`Failed to load background image for ${folder}`);
            setIsImageLoaded(false);
            setIsLoading(false);
          };
          img.src = imageUrl;
        } else {
          console.warn(`No background image found for ${folder}`);
          setIsImageLoaded(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch background:', error);
        setIsImageLoaded(false);
        setIsLoading(false);
      }
    };

    loadBackgroundImage();
  }, [cacheKey, pathname]);

  const refreshBackground = () => {
    console.log('Refreshing background image...');
    setCacheKey(Date.now());
    setIsImageLoaded(false);
  };

  const contextValue = useMemo(() => ({
    backgroundImageUrl,
    isImageLoaded,
    isLoading,
    refreshBackground
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
