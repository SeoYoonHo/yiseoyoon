'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ContentTransition from '@/components/ContentTransition';
import { createPortal } from 'react-dom';
import SlideCarousel from '@/components/SlideCarousel';

interface Exhibition {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  photos: string[];
  createdAt: string;
}

export default function ExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ 
    photos: string[]; 
    currentIndex: number; 
    title: string;
    subtitle?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  // Swiper를 사용하므로 복잡한 상태 관리가 필요 없음

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchExhibitions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/exhibitions/list');
        const data = await response.json();
        
        if (data.success) {
          setExhibitions(data.exhibitions || []);
        } else {
          setError('전시 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('Failed to fetch exhibitions:', err);
        setError('전시 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExhibitions();
  }, []);

  // 연도별로 전시 그룹핑
  const groupedExhibitions = exhibitions.reduce((acc, exhibition) => {
    const year = new Date(exhibition.startDate).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(exhibition);
    return acc;
  }, {} as Record<number, Exhibition[]>);

  const sortedYears = Object.keys(groupedExhibitions)
    .map(Number)
    .sort((a, b) => b - a);

  // 다음/이전 사진 보기
  const handleNextPhoto = () => {
    if (!selectedPhoto) return;
    const nextIndex = (selectedPhoto.currentIndex + 1) % selectedPhoto.photos.length;
    setSelectedPhoto({ ...selectedPhoto, currentIndex: nextIndex });
  };

  const handlePrevPhoto = () => {
    if (!selectedPhoto) return;
    const prevIndex = selectedPhoto.currentIndex === 0 
      ? selectedPhoto.photos.length - 1 
      : selectedPhoto.currentIndex - 1;
    setSelectedPhoto({ ...selectedPhoto, currentIndex: prevIndex });
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  // Swiper가 자동으로 네비게이션을 처리하므로 별도 함수 불필요

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'ArrowRight') handleNextPhoto();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'Escape') handleCloseModal();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPhoto]);

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
                  <p className="mt-4 text-white/80">전시 목록을 불러오는 중...</p>
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

            {!isLoading && !error && exhibitions.length === 0 && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-white/80">
                  <h2 className="text-2xl font-semibold mb-2">아직 등록된 전시가 없습니다</h2>
                  <p className="text-lg opacity-75">곧 멋진 전시들로 채워질 예정입니다.</p>
                </div>
              </div>
            )}

            {!isLoading && !error && exhibitions.length > 0 && (
              <div className="space-y-12">
                {sortedYears.map((year) => (
                  <div key={year}>
                    {/* 연도 헤더 */}
                    <div className="flex items-center mb-8">
                      <div className="w-4 h-4 rounded-full bg-white/40 mr-4"></div>
                      <h2 className="text-3xl font-bold text-white">{year}</h2>
                      <div className="flex-1 h-px bg-white/20 ml-6"></div>
                    </div>

                    {/* 해당 연도의 전시들 - 세로로 배치 */}
                    <div className="space-y-8 pl-6 pr-6">
                        {groupedExhibitions[year].map((exhibition) => (
                          <div 
                            key={exhibition.id} 
                            className="bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden"
                          >
                            {/* 슬라이드 갤러리 */}
                            {exhibition.photos.length > 0 && (
                              <div className="mb-4">
                                <div className="relative w-full aspect-video bg-white/5 rounded-lg overflow-hidden group">
                                  <SlideCarousel 
                                    exhibition={exhibition}
                                    onImageClick={(index) => setSelectedPhoto({ 
                                      photos: exhibition.photos, 
                                      currentIndex: index, 
                                      title: exhibition.title,
                                      subtitle: `${new Date(exhibition.startDate).toLocaleDateString('ko-KR', { 
                                        year: 'numeric', 
                                        month: '2-digit', 
                                        day: '2-digit' 
                                      }).replace(/\. /g, '.')} - ${new Date(exhibition.endDate).toLocaleDateString('ko-KR', { 
                                        year: 'numeric', 
                                        month: '2-digit', 
                                        day: '2-digit' 
                                      }).replace(/\. /g, '.')} (${exhibition.location})`
                                    })}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="p-6">
                              {/* 전시 정보 */}
                              <h3 className="text-xl font-bold text-white mb-2">{exhibition.title}</h3>
                              <p className="text-sm text-white/70 mb-2">
                                {new Date(exhibition.startDate).toLocaleDateString('ko-KR', { 
                                  year: 'numeric', 
                                  month: '2-digit', 
                                  day: '2-digit' 
                                }).replace(/\. /g, '.')} - {new Date(exhibition.endDate).toLocaleDateString('ko-KR', { 
                                  year: 'numeric', 
                                  month: '2-digit', 
                                  day: '2-digit' 
                                }).replace(/\. /g, '.')} ({exhibition.location})
                              </p>
                              {exhibition.description && (
                                <p className="text-xs text-white/60 mb-4 leading-relaxed line-clamp-3">{exhibition.description}</p>
                              )}

                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ContentTransition>
      </div>
      
      {/* Footer Space */}
      <div className="h-16"></div>

      {/* Exhibition Modal - 사진만 표시 */}
      {mounted && selectedPhoto && createPortal(
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm transition-opacity duration-300 opacity-100"
          onClick={handleCloseModal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCloseModal();
            }
          }}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCloseModal();
            }}
            className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 이미지 영역 */}
          <div 
            className="relative w-full h-full flex items-center justify-center px-24 py-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-w-7xl max-h-[80vh]">
              <Image
                src={selectedPhoto.photos[selectedPhoto.currentIndex]}
                alt={`${selectedPhoto.title} - ${selectedPhoto.currentIndex + 1}/${selectedPhoto.photos.length}`}
                fill
                className="object-contain"
                sizes="(max-width: 1536px) 90vw, 1400px"
                priority
              />
            </div>

            {/* 이전 버튼 */}
            {selectedPhoto.photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPhoto();
                }}
                className="absolute left-8 z-10 w-14 h-14 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm shadow-xl cursor-pointer"
                aria-label="Previous photo"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* 다음 버튼 */}
            {selectedPhoto.photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPhoto();
                }}
                className="absolute right-8 z-10 w-14 h-14 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm shadow-xl cursor-pointer"
                aria-label="Next photo"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* 사진 번호 표시 */}
          {selectedPhoto.photos.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {selectedPhoto.currentIndex + 1} / {selectedPhoto.photos.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </main>
  );
}
