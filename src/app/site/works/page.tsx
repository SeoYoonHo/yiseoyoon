'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ContentTransition from '@/components/ContentTransition';
import ImageModal from '@/components/ImageModal';

interface Artwork {
  id: string;
  title: string;
  date: string;
  description: string;
  originalImage: string;
  thumbnailImage: string;
  uploadedAt: string;
}

export default function WorksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchArtworks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/works/list');
        const data = await response.json();
        
        if (data.success) {
          setArtworks(data.artworks || []);
        } else {
          setError('작품 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('Failed to fetch artworks:', err);
        setError('작품 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  // 연도별로 작품 그룹핑
  const groupedArtworks = artworks.reduce((acc, artwork) => {
    const year = new Date(artwork.date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(artwork);
    return acc;
  }, {} as Record<number, Artwork[]>);

  // 연도를 내림차순으로 정렬
  const sortedYears = Object.keys(groupedArtworks)
    .map(Number)
    .sort((a, b) => b - a);

  // 부드러운 스크롤 함수
  const scrollToYear = (year: number) => {
    const element = document.getElementById(`year-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenModal = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setCurrentImageIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedArtwork(null);
    setCurrentImageIndex(0);
  };

  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>
      
      {/* Content Area - Scrollable within fixed height */}
      <div className="flex-1 overflow-y-auto">
        <ContentTransition>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  <p className="mt-4 text-white/80">작품을 불러오는 중...</p>
                </div>
              </div>
            )}

            {!isLoading && error && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-white/80">
                  <p className="text-xl">{error}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && artworks.length === 0 && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-white/80">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-24 w-24 mx-auto mb-4 opacity-50" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h2 className="text-2xl font-semibold mb-2">아직 등록된 작품이 없습니다</h2>
                  <p className="text-lg opacity-75">곧 멋진 작품들로 채워질 예정입니다.</p>
                </div>
              </div>
            )}

            {!isLoading && !error && artworks.length > 0 && (
              <div className="flex">
                {/* 타임라인 (왼쪽) */}
                <div className="w-32 flex-shrink-0 relative">
                  <div className="sticky top-32">
                    {sortedYears.map((year, index) => (
                      <div key={year} className="mb-8">
                        <button
                          onClick={() => scrollToYear(year)}
                          className="block text-white/90 hover:text-white font-bold text-2xl mb-2 transition-colors cursor-pointer"
                        >
                          {year}
                        </button>
                        <div className="w-1 h-16 bg-white/20 ml-4"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 작품 영역 (오른쪽) */}
                <div className="flex-1 pl-8">
                  {sortedYears.map((year) => (
                    <div key={year} id={`year-${year}`} className="mb-16">
                      {/* 연도 구분선 */}
                      <div className="flex items-center mb-8">
                        <div className="w-4 h-4 rounded-full bg-white/40 mr-4"></div>
                        <h2 className="text-3xl font-bold text-white">{year}</h2>
                        <div className="flex-1 h-px bg-white/20 ml-6"></div>
                      </div>

                      {/* 해당 연도의 작품들 */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pl-8">
                        {groupedArtworks[year].map((artwork) => (
                          <button
                            key={artwork.id}
                            onClick={() => handleOpenModal(artwork)}
                            className="group cursor-pointer bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl text-left"
                          >
                            <div className="relative aspect-square">
                              <Image
                                src={artwork.thumbnailImage}
                                alt={artwork.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300"></div>
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-white mb-1 truncate">
                                {artwork.title}
                              </h3>
                              <p className="text-sm text-white/70">
                                {new Date(artwork.date).toLocaleDateString('ko-KR', {
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ContentTransition>
      </div>
      
      {/* Footer Space */}
      <div className="h-16"></div>

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedArtwork}
        images={selectedArtwork ? [selectedArtwork.originalImage] : []}
        currentIndex={currentImageIndex}
        title={selectedArtwork?.title || ''}
        subtitle={
          selectedArtwork
            ? new Date(selectedArtwork.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : ''
        }
        description={selectedArtwork?.description}
        onClose={handleCloseModal}
      />
    </main>
  );
}
