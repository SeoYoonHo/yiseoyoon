'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ContentTransition from '@/components/ContentTransition';
import ImageModal from '@/components/ImageModal';
import { getResponsiveThumbnail } from '@/lib/thumbnail';

interface Work {
  id: string;
  title: string;
  year: string;
  description: string;
  originalImage: string;
  thumbnailImage?: string; // 기존 호환성
  thumbnailSmall: string;
  thumbnailMedium: string;
  thumbnailLarge: string;
  category: string;
  createdAt: string;
}

export default function PaintingPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<{
    images: string[];
    currentIndex: number;
    title: string;
    subtitle?: string;
    description?: string;
  } | null>(null);
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchWorks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/painting/list');
        const data = await response.json();
        
        if (data.success) {
          // 연도순으로 정렬 (최신순)
          const sortedWorks = (data.works || []).sort((a: Work, b: Work) => 
            parseInt(b.year) - parseInt(a.year)
          );
          setWorks(sortedWorks);
        } else {
          setError('작품 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('Failed to fetch works:', err);
        setError('작품 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorks();
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

  const handleWorkClick = (work: Work) => {
    setSelectedWork({
      images: [work.originalImage],
      currentIndex: 0,
      title: work.title,
      subtitle: work.year,
      description: work.description,
    });
  };

  const handleCloseModal = () => {
    setSelectedWork(null);
  };

  const handlePrevImage = () => {
    if (selectedWork && selectedWork.currentIndex > 0) {
      setSelectedWork({
        ...selectedWork,
        currentIndex: selectedWork.currentIndex - 1,
      });
    }
  };

  const handleNextImage = () => {
    if (selectedWork && selectedWork.currentIndex < selectedWork.images.length - 1) {
      setSelectedWork({
        ...selectedWork,
        currentIndex: selectedWork.currentIndex + 1,
      });
    }
  };

  const handleYearClick = (year: string) => {
    const yearSection = document.getElementById(`year-${year}`);
    if (yearSection) {
      yearSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveYear(year);
    }
  };

  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>
      
      {/* Content Area - Scrollable within fixed height */}
      <div className="flex-1 overflow-y-auto">
        <ContentTransition>
          <div className={`w-full py-8 transition-all duration-1000 ease-out ${
            isVisible 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}>
            <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">

              {!isLoading && error && (
                <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                  <div className="text-center text-white/80">
                    <p className="text-lg sm:text-xl">{error}</p>
                  </div>
                </div>
              )}

              {!isLoading && !error && works.length === 0 && (
                <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                  <div className="text-center text-white/80">
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">아직 등록된 회화 작품이 없습니다</h2>
                    <p className="text-base sm:text-lg opacity-75">곧 멋진 작품들로 채워질 예정입니다.</p>
                  </div>
                </div>
              )}

              {!isLoading && !error && works.length > 0 && (
                <div className="flex flex-col lg:flex-row gap-8">
                     {/* 왼쪽 타임라인 - 데스크톱에서만 표시 */}
                     <div className="hidden lg:block lg:w-32">
                       <div className="sticky top-24">
                         {/* 타임라인 연도 */}
                         <div className="flex flex-col items-center bg-black/20 backdrop-blur-md rounded-lg p-6 gap-8">
                           {Array.from(new Set(works.map(work => work.year)))
                             .sort((a, b) => parseInt(b) - parseInt(a))
                             .map((year) => (
                               <button
                                 key={year}
                                 onClick={() => handleYearClick(year)}
                                 className={`text-lg sm:text-xl font-bold transition-all duration-300 hover:scale-105 px-3 sm:px-4 py-2 rounded-lg ${
                                   activeYear === year 
                                     ? 'text-black bg-white/90 shadow-lg' 
                                     : 'text-white/80 hover:text-white hover:bg-white/20'
                                 }`}
                               >
                                 {year}
                               </button>
                             ))}
                         </div>
                       </div>
                     </div>

                  {/* 작품 그리드 */}
                  <div className="flex-1">
                    {/* 연도별 그룹화 */}
                    {Array.from(new Set(works.map(work => work.year)))
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .map(year => {
                        const yearWorks = works.filter(work => work.year === year);
                        return (
                          <div key={year} id={`year-${year}`} className="mb-12">
                            {/* 연도 헤더 */}
                            <div className="mb-6">
                              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{year}</h2>
                              <div className="w-16 h-0.5 bg-white/40"></div>
                            </div>
                            
                            {/* 작품 그리드 */}
                            <div className="columns-2 gap-6 space-y-6">
                              {yearWorks.map((work) => (
                                <div 
                                  key={work.id} 
                                  className="group cursor-pointer break-inside-avoid mb-6"
                                  onClick={() => handleWorkClick(work)}
                                >
                                  <div className="bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                                    <Image
                                      src={getResponsiveThumbnail(
                                        work.thumbnailSmall,
                                        work.thumbnailMedium,
                                        work.thumbnailLarge,
                                        work.thumbnailImage
                                      )}
                                      alt={work.title}
                                      width={400}
                                      height={600}
                                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 50vw"
                                    />
                                  </div>
                                  <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-white mb-2">{work.title}</h3>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ContentTransition>
      </div>
      
      {/* Footer Space */}
      <div className="h-16"></div>

      {/* 이미지 모달 */}
      {selectedWork && (
        <ImageModal
          isOpen={true}
          images={selectedWork.images}
          currentIndex={selectedWork.currentIndex}
          title={selectedWork.title}
          subtitle={selectedWork.subtitle}
          description={selectedWork.description}
          onClose={handleCloseModal}
          onNext={selectedWork.images.length > 1 ? handleNextImage : undefined}
          onPrev={selectedWork.images.length > 1 ? handlePrevImage : undefined}
        />
      )}
    </main>
  );
}