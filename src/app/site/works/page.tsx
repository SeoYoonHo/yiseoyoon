'use client';

import Link from 'next/link';
import Image from 'next/image';
import ContentTransition from '@/components/ContentTransition';
import { useState, useEffect, useRef } from 'react';

export default function WorksPage() {
  const [cardImages, setCardImages] = useState<{painting: string | null, drawing: string | null}>({painting: null, drawing: null});
  const [isVisible, setIsVisible] = useState(false);
  const [imageAnimations, setImageAnimations] = useState<{painting: boolean, drawing: boolean}>({painting: false, drawing: false});
  const paintingRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<HTMLDivElement>(null);

  // 카드 이미지 불러오기
  const fetchCardImages = async () => {
    try {
      const response = await fetch('/api/works/card-images/get');
      const data = await response.json();
      if (data.success) {
        setCardImages(data.images);
      }
    } catch (error) {
      console.error('Failed to fetch card images:', error);
    }
  };

  // 컴포넌트 마운트 시 카드 이미지 불러오기 및 애니메이션 시작
  useEffect(() => {
    fetchCardImages();
    
    // 단순하게 1초 후 애니메이션 시작
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer로 이미지 애니메이션 처리
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (target.dataset.type === 'painting') {
              setImageAnimations(prev => ({ ...prev, painting: true }));
            } else if (target.dataset.type === 'drawing') {
              setImageAnimations(prev => ({ ...prev, drawing: true }));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (paintingRef.current) observer.observe(paintingRef.current);
    if (drawingRef.current) observer.observe(drawingRef.current);

    return () => observer.disconnect();
  }, []);
  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>
      
      {/* Content Area - Scrollable within fixed height */}
      <div className="flex-1 overflow-y-auto">
        <ContentTransition>
          <div className={`w-full py-8 transition-all duration-2000 ease-out ${
            isVisible 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}>
            <div className="w-full mx-auto">
              <div 
                className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-[90%] mx-auto"
                style={{ maxHeight: '80vh' }}
              >
                {/* Painting */}
                <div ref={paintingRef} data-type="painting">
                  <Link
                    href="/site/works/painting"
                    className="group relative bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 w-full"
                    style={{ maxHeight: '80vh', maxWidth: 'calc(80vh * 3 / 4)' }}
                  >
                    <div className="aspect-[3/4] relative">
                      {cardImages.painting ? (
                        <Image
                          src={cardImages.painting}
                          alt="Painting"
                          fill
                          className={`object-cover group-hover:scale-105 transition-all duration-1000 ${
                            imageAnimations.painting 
                              ? 'opacity-100 scale-100' 
                              : 'opacity-0 scale-95'
                          }`}
                          loading="lazy"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full"></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <div className="text-center text-white">
                          <h2 className="text-2xl font-bold mb-2">Painting</h2>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Drawing */}
                <div ref={drawingRef} data-type="drawing">
                  <Link
                    href="/site/works/drawing"
                    className="group relative bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 w-full"
                    style={{ maxHeight: '80vh', maxWidth: 'calc(80vh * 3 / 4)' }}
                  >
                    <div className="aspect-[3/4] relative">
                      {cardImages.drawing ? (
                        <Image
                          src={cardImages.drawing}
                          alt="Drawing"
                          fill
                          className={`object-cover group-hover:scale-105 transition-all duration-1000 ${
                            imageAnimations.drawing 
                              ? 'opacity-100 scale-100' 
                              : 'opacity-0 scale-95'
                          }`}
                          loading="lazy"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full"></div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <div className="text-center text-white">
                          <h2 className="text-2xl font-bold mb-2">Drawing</h2>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ContentTransition>
      </div>
      
      {/* Footer Space */}
      <div className="h-16"></div>
    </main>
  );
}