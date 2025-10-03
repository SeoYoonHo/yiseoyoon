'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface BackgroundContextType {
  backgroundImageUrl: string;
  isImageLoaded: boolean;
  isLoading: boolean;
  refreshBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cacheKey, setCacheKey] = useState<number>(Date.now());

  useEffect(() => {
    const loadBackgroundImage = async () => {
      setIsLoading(true);
      
      try {
        // API를 통해 Background 폴더의 첫 번째 파일 가져오기
        const response = await fetch(`/api/background?v=${cacheKey}`);
        const data = await response.json();
        
        if (data.success && data.imageUrl) {
          const imageUrl = `${data.imageUrl}?v=${cacheKey}`;
          setBackgroundImageUrl(imageUrl);
          
          // 프리로딩
          const img = new Image();
          img.onload = () => {
            console.log('Background image loaded successfully');
            setIsImageLoaded(true);
            setIsLoading(false);
          };
          img.onerror = () => {
            console.warn('Failed to load background image');
            setIsImageLoaded(false);
            setIsLoading(false);
          };
          img.src = imageUrl;
        } else {
          console.warn('No background image found');
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
  }, [cacheKey]);

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
