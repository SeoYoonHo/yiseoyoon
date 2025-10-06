'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface ExhibitionImageModalProps {
  readonly isOpen: boolean;
  readonly photos: readonly string[];
  readonly currentIndex: number;
  readonly title: string;
  readonly onClose: () => void;
  readonly onNext?: () => void;
  readonly onPrev?: () => void;
}

export default function ExhibitionImageModal({
  isOpen,
  photos,
  currentIndex,
  title,
  onClose,
  onNext,
  onPrev,
}: ExhibitionImageModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);

  // 썸네일 경로를 원본 경로로 변환하는 함수
  const getOriginalImageUrl = (thumbnailUrl: string) => {
    // URL이 비어있거나 유효하지 않은 경우 그대로 반환
    if (!thumbnailUrl || typeof thumbnailUrl !== 'string') {
      return thumbnailUrl;
    }
    
    // 이미 완전한 URL인 경우, Thumbnail을 Original로 교체
    if (thumbnailUrl.includes('/Thumbnail/')) {
      return thumbnailUrl.replace('/Thumbnail/', '/Original/');
    }
    
    // S3 키만 있는 경우, Original 경로로 변환
    if (thumbnailUrl.includes('Thumbnail/')) {
      return thumbnailUrl.replace('Thumbnail/', 'Original/');
    }
    
    // 변환할 수 없는 경우 원본 반환
    return thumbnailUrl;
  };

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
    if (isOpen && photos.length > 0 && currentIndex !== currentImageIndex) {
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm transition-all duration-300 ${
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
        className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm cursor-pointer"
        aria-label="Close modal"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 이미지 영역 */}
      <div 
        className="relative w-full h-full flex items-center justify-center px-24 py-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full max-w-7xl max-h-[80vh]">
          <div 
            className={`relative w-full h-full transition-opacity duration-200 ease-in-out ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              key={`image-${currentImageIndex}`}
              src={getOriginalImageUrl(photos[currentImageIndex])}
              alt={`${title} - ${currentImageIndex + 1}/${photos.length}`}
              fill
              className="object-contain"
              sizes="(max-width: 1536px) 90vw, 1400px"
              priority
            />
          </div>
        </div>

        {/* 이전 버튼 */}
        {photos.length > 1 && currentIndex > 0 && onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-8 top-1/2 -translate-y-1/2 z-10 w-14 h-14 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm shadow-xl cursor-pointer"
            aria-label="Previous photo"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 다음 버튼 */}
        {photos.length > 1 && currentIndex < photos.length - 1 && onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-10 w-14 h-14 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-all backdrop-blur-sm shadow-xl cursor-pointer"
            aria-label="Next photo"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* 사진 번호 표시 */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
          {currentImageIndex + 1} / {photos.length}
        </div>
      )}
    </div>,
    document.body
  );
}
