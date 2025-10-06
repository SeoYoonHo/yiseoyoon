'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface ImageModalProps {
  readonly isOpen: boolean;
  readonly images: readonly string[];
  readonly currentIndex: number;
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string;
  readonly onClose: () => void;
  readonly onNext?: () => void;
  readonly onPrev?: () => void;
}

export default function ImageModal({
  isOpen,
  images,
  currentIndex,
  title,
  subtitle,
  description,
  onClose,
  onNext,
  onPrev,
}: ImageModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // 모달 열릴 때
      document.body.style.overflow = 'hidden';
      setTimeout(() => setIsVisible(true), 10);
    } else {
      // 모달 닫힐 때
      setIsVisible(false);
      const timer = setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!mounted || !isOpen) return null;

  const showNavigation = images.length > 1 && onNext && onPrev;

  const modalContent = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={`fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={`relative w-full h-full transition-transform duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm cursor-pointer"
          aria-label="Close modal"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 이미지와 정보를 함께 표시 */}
        <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 md:px-24 py-8 sm:py-12 md:py-16">
          <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
            <Image
              src={images[currentIndex]}
              alt={`${title} - ${currentIndex + 1}/${images.length}`}
              width={1400}
              height={900}
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
              sizes="(max-width: 1536px) 90vw, 1400px"
              priority
            />
          </div>

          {/* 정보 영역 - 이미지 바로 아래 */}
          <div className="w-full max-w-4xl mt-4 sm:mt-6 px-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 text-center">{title}</h2>

            {subtitle && <p className="text-xs sm:text-sm text-white/70 mb-3 text-center">{subtitle}</p>}

            {description && (
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed whitespace-pre-wrap text-center">{description}</p>
            )}

            {/* 이미지 번호 표시 */}
            {images.length > 1 && (
              <div className="mt-3 sm:mt-4 text-center">
                <span className="inline-block bg-white/10 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
                  {currentIndex + 1} / {images.length}
                </span>
              </div>
            )}
          </div>

          {/* 이전 버튼 */}
          {showNavigation && (
            <button
              onClick={onPrev}
              className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm shadow-xl"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* 다음 버튼 */}
          {showNavigation && (
            <button
              onClick={onNext}
              className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm shadow-xl"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

