'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface Artwork {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly description: string;
  readonly originalImage: string;
  readonly thumbnailImage: string;
  readonly uploadedAt: string;
}

interface GalleryModalProps {
  readonly artwork: Artwork | null;
  readonly onClose: () => void;
}

export default function GalleryModal({ artwork, onClose }: GalleryModalProps) {
  useEffect(() => {
    if (artwork) {
      // 모달 열릴 때 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      // 모달 닫힐 때 스크롤 복원
      document.body.style.overflow = 'unset';
    }

    // ESC 키로 모달 닫기
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (artwork) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [artwork, onClose]);

  if (!artwork) return null;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm pt-20 pb-4"
      onClick={onClose}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div 
        className="relative w-[95vw] h-full bg-black rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full transition-all"
          aria-label="Close modal"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이미지 영역 */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-8">
          <div className="relative w-full h-full">
            <Image
              src={artwork.originalImage}
              alt={artwork.title}
              fill
              className="object-contain"
              sizes="95vw"
              priority
            />
          </div>
        </div>

        {/* 정보 영역 - 이미지 아래 */}
        <div className="w-full bg-black/80 backdrop-blur-sm px-8 py-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-2">
              {artwork.title}
            </h2>
            
            <p className="text-sm text-white/70 mb-3">
              {new Date(artwork.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            {artwork.description && (
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                {artwork.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

