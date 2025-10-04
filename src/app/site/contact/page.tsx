'use client';

import { useState, useEffect } from 'react';
import ContentTransition from '@/components/ContentTransition';

interface ContactData {
  text: string;
  instagramUrl: string;
  updatedAt: string;
}

export default function ContactPage() {
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContactData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/contact/get');
        const data = await response.json();
        
        if (data.success) {
          setContactData(data.data);
        } else {
          setError(data.error || '연락처 정보를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('Error fetching contact data:', error);
        setError('연락처 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactData();
  }, []);

  if (isLoading) {
    return (
      <main className="h-full flex flex-col">
        <div className="h-20"></div>
        <div className="flex-1 overflow-y-auto">
          <ContentTransition>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  <p className="mt-4 text-white/80">연락처 정보를 불러오는 중...</p>
                </div>
              </div>
            </div>
          </ContentTransition>
        </div>
        <div className="h-16"></div>
      </main>
    );
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
            {/* Contact Header */}
            <div className="mb-12">
              <h1 className="text-white font-bold mb-8">Contact</h1>
            </div>

            {/* Contact Content */}
            <div className="mb-12">
              <div className="text-white/90 leading-relaxed whitespace-pre-line max-w-4xl">
                {contactData?.text || '연락처 정보가 아직 입력되지 않았습니다.'}
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
