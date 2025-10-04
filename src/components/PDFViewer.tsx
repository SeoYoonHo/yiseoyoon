'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFViewer({ pdfUrl, title, isOpen, onClose }: PDFViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm transition-opacity duration-300 opacity-100"
      onClick={onClose}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 z-20 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm cursor-pointer"
        aria-label="Close PDF viewer"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* PDF 제목 */}
      <div className="absolute top-6 left-6 z-20">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>

      {/* PDF 뷰어 컨테이너 */}
      <div 
        className="relative w-full h-full flex items-center justify-center px-8 py-16"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* PDF iframe */}
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
            className="w-full h-full border-0"
            title={title}
            loading="lazy"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
