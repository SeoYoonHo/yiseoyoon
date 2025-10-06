'use client';

import { useState, useEffect } from 'react';
import ContentTransition from '@/components/ContentTransition';
import PDFViewer from '@/components/PDFViewer';

interface TextPost {
  id: string;
  title: string;
  pdfUrl: string;
  uploadedAt: string;
}

export default function TextPage() {
  const [texts, setTexts] = useState<TextPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<TextPost | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchTexts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/text/list');
        const data = await response.json();
        
        if (data.success) {
          setTexts(data.texts || []);
        } else {
          setError(data.error || '텍스트를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error fetching texts:', error);
        setError('텍스트를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTexts();
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

  const handleTextClick = (text: TextPost) => {
    setSelectedText(text);
  };

  const handleClosePDF = () => {
    setSelectedText(null);
  };

  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>
      
      {/* Content Area - Scrollable within fixed height */}
      <div className="flex-1 overflow-y-auto">
        <ContentTransition>
          <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-1000 ease-out ${
            isVisible 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}>

            {!isLoading && error && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-gray-700">
                  <p className="text-xl">{error}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && texts.length === 0 && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-gray-700">
                  <p className="text-xl">아직 업로드된 텍스트가 없습니다.</p>
                </div>
              </div>
            )}

            {!isLoading && !error && texts.length > 0 && (
              <div className="space-y-4">
                {texts.map((text) => (
                  <div
                    key={text.id}
                    onClick={() => handleTextClick(text)}
                    className="bg-white/5 backdrop-blur-sm rounded-lg p-6 cursor-pointer hover:bg-white/10 transition-all border border-gray-300"
                  >
                    <h3 className="text-lg font-normal text-gray-900 hover:text-gray-700 transition-colors">
                      {text.title}
                    </h3>
                    <div className="mt-2 text-sm text-gray-600">
                      업로드: {new Date(text.uploadedAt).toLocaleDateString('ko-KR')}
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

      {/* PDF Viewer Modal */}
      {selectedText && (
        <PDFViewer
          pdfUrl={selectedText.pdfUrl}
          title={selectedText.title}
          isOpen={true}
          onClose={handleClosePDF}
        />
      )}
    </main>
  );
}
