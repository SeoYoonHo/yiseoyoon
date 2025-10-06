'use client';

import { useState, useEffect } from 'react';
import ContentTransition from '@/components/ContentTransition';
import Image from 'next/image';
import CVImageModal from '@/components/CVImageModal';

interface CVData {
  name: string;
  leftText: string;
  rightText: string;
  images: string[];
  updatedAt: string;
}

interface SelectedImage {
  url: string;
  title: string;
  index: number;
}

// 텍스트를 전처리해서 마크다운과 줄바꿈을 처리하는 함수
const preprocessText = (text: string) => {
  if (!text) return text;
  
  // 먼저 마크다운 문법을 HTML로 변환
  let processedText = text
    // 볼드체 처리
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 이탤릭체 처리
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 작은 폰트 처리 (~~텍스트~~) - 여러 줄 지원
    .replace(/~~([\s\S]*?)~~/g, '<small>$1</small>')
    // 제목 처리
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 리스트 처리
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li>$1. $2</li>');
  
  // 줄바꿈 처리
  processedText = processedText
    .split('\n')
    .map((line, index, array) => {
      if (line.trim() === '') {
        // 빈 줄인 경우 <br> 태그 추가
        return '<br>';
      } else {
        // 텍스트가 있는 줄은 그대로 유지하되, 마지막 줄이 아니면 <br> 추가
        return index < array.length - 1 ? line + '<br>' : line;
      }
    })
    .join('');
  
  // 리스트 항목들을 ul/ol로 감싸기
  processedText = processedText
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/<\/ul><br><ul>/g, '');
  
  return processedText;
};

export default function CVPage() {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchCVData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/cv/get');
        const data = await response.json();
        
        if (data.success) {
          setCvData(data.data);
        } else {
          setError(data.error || 'CV 데이터를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error fetching CV data:', error);
        setError('CV 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCVData();
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

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <main className="h-full flex flex-col">
        <div className="h-20"></div>
        <div className="flex-1 overflow-y-auto">
          <ContentTransition>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-gray-700">
                  <p className="text-xl">{error}</p>
                </div>
              </div>
            </div>
          </ContentTransition>
        </div>
        <div className="h-16"></div>
      </main>
    );
  }

  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>
      
      {/* Content Area - Scrollable within fixed height */}
      <div className="flex-1 overflow-y-auto">
        <ContentTransition>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* CV Header and Content - Combined Animation */}
            <div className={`mb-12 ${
              isVisible 
                ? 'opacity-100 translate-y-0 transition-all duration-[1000ms] ease-out' 
                : 'opacity-0 translate-y-20'
            }`}>
              {/* CV Header */}
              <div className="mb-12">
                <h1 className="text-gray-900 font-bold mb-4">CV</h1>
                {cvData?.name && (
                  <h2 className="text-gray-800 font-bold mb-8">
                    {cvData.name}
                  </h2>
                )}
              </div>

              {/* CV Content */}
              <div className="grid md:grid-cols-2 gap-12 mb-12">
                {/* Left Text */}
                <div>
                  <div className="text-gray-800 leading-relaxed [&_p]:text-gray-800 [&_p]:leading-relaxed [&_strong]:text-gray-900 [&_strong]:font-semibold [&_em]:italic [&_small]:text-sm [&_small]:text-gray-600 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_br]:block">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: preprocessText(cvData?.leftText || '왼쪽 텍스트가 아직 입력되지 않았습니다.') 
                      }}
                    />
                  </div>
                </div>

                {/* Right Text */}
                <div>
                  <div className="text-gray-800 leading-relaxed [&_p]:text-gray-800 [&_p]:leading-relaxed [&_strong]:text-gray-900 [&_strong]:font-semibold [&_em]:italic [&_small]:text-sm [&_small]:text-gray-600 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:mb-1 [&_br]:block">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: preprocessText(cvData?.rightText || '오른쪽 텍스트가 아직 입력되지 않았습니다.') 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Exhibition Posters */}
            {cvData?.images && cvData.images.length > 0 && (
              <div className={`transition-all duration-1000 ease-out delay-300 ${
                isVisible 
                  ? 'opacity-100' 
                  : 'opacity-0'
              }`}>
                <div className="columns-4 gap-1 space-y-1">
                  {cvData.images.map((imageUrl, index) => (
                    <div
                      key={`poster-${imageUrl}-${index}`}
                      className="relative break-inside-avoid mb-1 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setSelectedImage({ url: imageUrl, title: `Poster ${index + 1}`, index })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedImage({ url: imageUrl, title: `Poster ${index + 1}`, index });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Exhibition poster ${index + 1}`}
                        width={300}
                        height={400}
                        className="w-full h-auto object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
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
      {selectedImage && cvData?.images && (
        <CVImageModal
          images={cvData.images}
          currentIndex={selectedImage.index}
          isOpen={true}
          onClose={() => setSelectedImage(null)}
          onNext={() => {
            if (cvData?.images && selectedImage.index < cvData.images.length - 1) {
              setSelectedImage({
                url: cvData.images[selectedImage.index + 1],
                title: `Poster ${selectedImage.index + 2}`,
                index: selectedImage.index + 1,
              });
            }
          }}
          onPrev={() => {
            if (selectedImage.index > 0 && cvData?.images) {
              setSelectedImage({
                url: cvData.images[selectedImage.index - 1],
                title: `Poster ${selectedImage.index}`,
                index: selectedImage.index - 1,
              });
            }
          }}
        />
      )}
    </main>
  );
}