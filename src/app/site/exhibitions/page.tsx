'use client';

import { useState, useEffect } from 'react';
import ContentTransition from '@/components/ContentTransition';
import SlideCarousel from '@/components/SlideCarousel';
import ExhibitionImageModal from '@/components/ExhibitionImageModal';

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
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ 
    photos: string[]; 
    currentIndex: number; 
    title: string;
    subtitle?: string;
  } | null>(null);

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

  useEffect(() => {
    if (!isLoading && !error) {
      // 데이터 로딩 완료 후 애니메이션 시작
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, error]);

  // 전시 목록을 최신순으로 정렬
  const sortedExhibitions = [...exhibitions].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const handleNextPhoto = () => {
    if (!selectedPhoto) return;
    const nextIndex = selectedPhoto.currentIndex + 1;
    if (nextIndex < selectedPhoto.photos.length) {
      setSelectedPhoto({ ...selectedPhoto, currentIndex: nextIndex });
    }
  };

  const handlePrevPhoto = () => {
    if (!selectedPhoto) return;
    const prevIndex = selectedPhoto.currentIndex - 1;
    if (prevIndex >= 0) {
      setSelectedPhoto({ ...selectedPhoto, currentIndex: prevIndex });
    }
  };

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  // Swiper가 자동으로 네비게이션을 처리하므로 별도 함수 불필요


  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>
      
      {/* Content Area - Scrollable within fixed height */}
      <div className="flex-1 overflow-y-auto">
        <ContentTransition>
          <div className={`w-full py-6 sm:py-8 lg:py-12 transition-all duration-1000 ease-out ${
            isVisible 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}>

            {!isLoading && error && (
              <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                <div className="text-center text-white/80">
                  <p className="text-lg sm:text-xl">{error}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && exhibitions.length === 0 && (
              <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                <div className="text-center text-white/80">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">아직 등록된 전시가 없습니다</h2>
                  <p className="text-base sm:text-lg opacity-75">곧 멋진 전시들로 채워질 예정입니다.</p>
                </div>
              </div>
            )}

            {!isLoading && !error && exhibitions.length > 0 && (
              <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
                <div className="space-y-8">
                  {sortedExhibitions.map((exhibition) => (
                          <div 
                            key={exhibition.id} 
                            className="w-full h-[32rem] bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden"
                          >
                            {/* 슬라이드 갤러리 */}
                            {exhibition.photos.length > 0 && (
                              <div className="mb-3 sm:mb-4">
                                <div className="relative w-full h-80 bg-white/5 rounded-lg overflow-hidden group">
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

                            <div className="p-4 sm:p-6">
                              {/* 전시 정보 */}
                              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">{exhibition.title}</h3>
                              <p className="text-xs sm:text-sm text-white/70 mb-2">
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
                                <p className="text-xs sm:text-sm text-white/60 mb-4 leading-relaxed line-clamp-2 sm:line-clamp-3">{exhibition.description}</p>
                              )}

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

      {/* Exhibition Modal */}
      {selectedPhoto && (
        <ExhibitionImageModal
          photos={selectedPhoto.photos}
          currentIndex={selectedPhoto.currentIndex}
          title={selectedPhoto.title}
          isOpen={true}
          onClose={handleCloseModal}
          onNext={handleNextPhoto}
          onPrev={handlePrevPhoto}
        />
      )}
    </main>
  );
}
