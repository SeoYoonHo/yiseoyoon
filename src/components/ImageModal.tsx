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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // 모달 열릴 때
      document.body.style.overflow = 'hidden';
      setImageLoaded(false);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      // 모달 닫힐 때
      setIsVisible(false);
      setImageLoaded(false);
      const timer = setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 모달이 열릴 때 초기 이미지 설정
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(currentIndex);
      setImageLoaded(true);
    }
  }, [isOpen]);

  // 이미지 인덱스가 변경될 때 페이드 애니메이션
  useEffect(() => {
    if (isOpen && images.length > 0 && currentIndex !== currentImageIndex) {
      // 기존 이미지 페이드 아웃
      setImageLoaded(false);
      
      // 페이드 아웃 완료 후 새 이미지로 변경
      const fadeOutTimer = setTimeout(() => {
        setCurrentImageIndex(currentIndex);
        // 새 이미지 페이드 인
        setTimeout(() => {
          setImageLoaded(true);
        }, 50);
      }, 200);
      
      return () => clearTimeout(fadeOutTimer);
    }
  }, [currentIndex, currentImageIndex]);

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
    <div
      className={`fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all cursor-pointer"
        aria-label="Close modal"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 이미지와 정보를 함께 표시 */}
      <div className="flex flex-col items-center justify-center h-full px-4 sm:px-8 md:px-24 py-8 sm:py-12 md:py-16">
        <div className="relative max-w-7xl flex items-center justify-center">
          <div 
            className={`relative w-full h-full transition-opacity duration-200 ease-in-out ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              key={`image-${currentImageIndex}`}
              src={images[currentImageIndex]}
              alt={`${title} - ${currentImageIndex + 1}/${images.length}`}
              width={1400}
              height={900}
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
              sizes="(max-width: 1536px) 90vw, 1400px"
              priority
            />
          </div>
        </div>

        {/* 정보 영역 - 이미지 바로 아래 */}
        <div className="w-full max-w-4xl mt-8 sm:mt-12 px-4">
          {title && <h2 className="text-base sm:text-lg font-normal text-gray-900 mb-2 text-center">{title}</h2>}
          {subtitle && <p className="text-xs sm:text-sm text-gray-600 mb-3 text-center">{subtitle}</p>}
          {description && (
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap text-center">{description}</p>
          )}

          {/* 이미지 번호 표시 */}
          {images.length > 1 && (
            <div className="mt-3 sm:mt-4 text-center">
              <span className="inline-block bg-gray-200 text-gray-700 px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
                {currentImageIndex + 1} / {images.length}
              </span>
            </div>
          )}
        </div>

        {/* 이전 버튼 */}
        {images.length > 1 && currentIndex > 0 && onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all cursor-pointer"
            aria-label="Previous image"
          >
            <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 다음 버튼 */}
        {images.length > 1 && currentIndex < images.length - 1 && onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all cursor-pointer"
            aria-label="Next image"
          >
            <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

