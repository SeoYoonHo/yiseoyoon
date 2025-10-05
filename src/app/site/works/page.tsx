'use client';

import Link from 'next/link';
import ContentTransition from '@/components/ContentTransition';
import { useState, useEffect } from 'react';

export default function WorksPage() {
  const [cardImages, setCardImages] = useState<{painting: string | null, drawing: string | null}>({painting: null, drawing: null});

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

  // 컴포넌트 마운트 시 카드 이미지 불러오기
  useEffect(() => {
    fetchCardImages();
  }, []);
  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>
      
      {/* Content Area - Scrollable within fixed height */}
      <div className="flex-1 overflow-y-auto">
        <ContentTransition>
          <div className="w-full py-8">
            <div className="w-full mx-auto">
              <div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-[90%] mx-auto"
                style={{ maxHeight: '80vh' }}
              >
                {/* Painting */}
                <Link
                  href="/site/works/painting"
                  className="group relative bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 justify-self-end w-full"
                  style={{ maxHeight: '80vh', maxWidth: 'calc(80vh * 3 / 4)' }}
                >
                  <div className="aspect-[3/4] relative">
                    {cardImages.painting ? (
                      <img
                        src={cardImages.painting}
                        alt="Painting"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <div className="text-center">
                          <div className="w-32 h-32 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2V3zM13 8l4-4 4 4M13 8l4 4M13 8l4 4M13 8l4 4" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">Painting</h2>
                          <p className="text-white/70">Painting</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <div className="text-center text-white">
                        <h2 className="text-2xl font-bold mb-2">Painting</h2>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Drawing */}
                <Link
                  href="/site/works/drawing"
                  className="group relative bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 justify-self-start w-full"
                  style={{ maxHeight: '80vh', maxWidth: 'calc(80vh * 3 / 4)' }}
                >
                  <div className="aspect-[3/4] relative">
                    {cardImages.drawing ? (
                      <img
                        src={cardImages.drawing}
                        alt="Drawing"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <div className="text-center">
                          <div className="w-32 h-32 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">Drawing</h2>
                          <p className="text-white/70">Drawing</p>
                        </div>
                      </div>
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
        </ContentTransition>
      </div>
      
      {/* Footer Space */}
      <div className="h-16"></div>
    </main>
  );
}