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
                <div className="text-center text-white/80">
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
                <h1 className="text-white font-bold mb-4">CV</h1>
                {cvData?.name && (
                  <h2 className="text-white/90 font-bold mb-8">
                    {cvData.name}
                  </h2>
                )}
              </div>

              {/* CV Content */}
              <div className="grid md:grid-cols-2 gap-12 mb-12">
                {/* Left Text */}
                <div>
                  <div className="text-white/90 leading-relaxed whitespace-pre-line">
                    {cvData?.leftText || '왼쪽 텍스트가 아직 입력되지 않았습니다.'}
                  </div>
                </div>

                {/* Right Text */}
                <div>
                  <div className="text-white/90 leading-relaxed whitespace-pre-line">
                    {cvData?.rightText || '오른쪽 텍스트가 아직 입력되지 않았습니다.'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
                  {cvData.images.map((imageUrl, index) => (
                    <div
                      key={index}
                      className="relative aspect-[3/4] rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setSelectedImage({ url: imageUrl, title: `Poster ${index + 1}`, index })}
                    >
                      <Image
                        src={imageUrl}
                        alt={`Exhibition poster ${index + 1}`}
                        fill
                        className="object-cover"
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