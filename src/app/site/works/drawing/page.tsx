'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ContentTransition from '@/components/ContentTransition';
import ImageModal from '@/components/ImageModal';
import { getResponsiveThumbnail } from '@/lib/thumbnail';
import { getS3ImageUrl } from '@/lib/s3';

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
  number?: number; // 번호 필드 추가
}

export default function DrawingPage() {
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
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set());
  const [screenSize, setScreenSize] = useState<'mobile' | 'desktop'>('desktop');
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const fetchWorks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/drawing/list');
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
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, error]);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setScreenSize(window.innerWidth >= 1024 ? 'desktop' : 'mobile');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Intersection Observer로 이미지 애니메이션 처리
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const workId = entry.target.getAttribute('data-work-id');
            if (workId) {
              setVisibleImages(prev => new Set([...prev, workId]));
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    // 모든 이미지 요소 관찰
    imageRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [works]);

  const handleWorkClick = (work: Work) => {
    // 현재 연도의 모든 작품을 가져와서 모달에 전달
    const currentYearWorks = works.filter(w => w.year === work.year).sort((a, b) => (a.number || 0) - (b.number || 0));
    const currentIndex = currentYearWorks.findIndex(w => w.id === work.id);
    
    setSelectedWork({
      images: currentYearWorks.map(w => w.originalImage),
      currentIndex: currentIndex,
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
      const currentYearWorks = works.filter(w => w.year === selectedWork.subtitle).sort((a, b) => (a.number || 0) - (b.number || 0));
      const prevIndex = selectedWork.currentIndex - 1;
      const prevWork = currentYearWorks[prevIndex];
      
      setSelectedWork({
        ...selectedWork,
        currentIndex: prevIndex,
        title: prevWork.title,
        description: prevWork.description,
      });
    }
  };

  const handleNextImage = () => {
    if (selectedWork && selectedWork.currentIndex < selectedWork.images.length - 1) {
      const currentYearWorks = works.filter(w => w.year === selectedWork.subtitle).sort((a, b) => (a.number || 0) - (b.number || 0));
      const nextIndex = selectedWork.currentIndex + 1;
      const nextWork = currentYearWorks[nextIndex];
      
      setSelectedWork({
        ...selectedWork,
        currentIndex: nextIndex,
        title: nextWork.title,
        description: nextWork.description,
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
          <div className={`w-full py-8 transition-all duration-2000 ease-out ${
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
                    <h2 className="text-xl sm:text-2xl font-semibold mb-2">아직 등록된 Drawing 작품이 없습니다</h2>
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
                         <div className="flex flex-col items-center bg-white/95 backdrop-blur-md rounded-lg p-6 gap-8">
                           {Array.from(new Set(works.map(work => work.year)))
                             .sort((a, b) => parseInt(b) - parseInt(a))
                             .map((year) => (
                               <button
                                 key={year}
                                 onClick={() => handleYearClick(year)}
                                 className={`text-lg sm:text-xl font-bold transition-all duration-300 hover:scale-105 px-3 sm:px-4 py-2 rounded-lg ${
                                   activeYear === year 
                                     ? 'text-white bg-gray-800 shadow-lg' 
                                     : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
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
                        const yearWorks = works.filter(work => work.year === year)
                          .sort((a, b) => (a.number || 0) - (b.number || 0)); // 번호 순서로 정렬
                        
                        // 각 열별로 작품 분배 (화면 크기에 따라 컬럼 수 결정)
                        const cols = screenSize === 'desktop' ? 3 : 2;
                        const columnWorks: Work[][] = Array.from({ length: cols }, () => []);
                        
                        // 각 작품을 열별로 분배 (number 값 기준)
                        yearWorks.forEach((work) => {
                          const positionInYear = work.number || 1; // number 값 기준 (1부터 시작)
                          const colIndex = (positionInYear - 1) % cols; // 열 인덱스 (0, 1, 2)
                          columnWorks[colIndex].push(work);
                        });
                        
                        return (
                          <div key={year} id={`year-${year}`} className="mb-12">
                            {/* 연도 헤더 */}
                            <div className="mb-6">
                              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{year}</h2>
                            </div>
                            
                            {/* 작품 그리드 - 별도 컬럼 */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                              {columnWorks.map((column, colIndex) => (
                                <div key={colIndex} className="space-y-6">
                                  {column.map((work) => (
                                    <div 
                                      key={work.id} 
                                      className={`transition-all duration-1000 ${
                                        visibleImages.has(work.id)
                                          ? 'opacity-100 scale-100' 
                                          : 'opacity-0 scale-95'
                                      }`}
                                      ref={(el) => {
                                        if (el) {
                                          imageRefs.current.set(work.id, el);
                                        }
                                      }}
                                      data-work-id={work.id}
                                    >
                                      <div 
                                        className="group cursor-pointer"
                                        onClick={() => handleWorkClick(work)}
                                      >
                                        <div className="rounded-lg mb-4 overflow-hidden relative">
                                          <Image
                                            src={getS3ImageUrl(getResponsiveThumbnail(
                                              work.thumbnailSmall,
                                              work.thumbnailMedium,
                                              work.thumbnailLarge,
                                              work.thumbnailImage
                                            ))}
                                            alt={work.title}
                                            width={400}
                                            height={600}
                                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 33vw"
                                          />
                                        </div>
                                        <h3 className="text-[10px] sm:text-xs md:text-sm font-normal text-gray-900 mb-2">{work.title}</h3>
                                      </div>
                                    </div>
                                  ))}
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