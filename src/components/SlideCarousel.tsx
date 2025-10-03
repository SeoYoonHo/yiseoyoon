'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';

// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface Exhibition {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  photos: string[];
  createdAt: string;
}

interface SlideCarouselProps {
  exhibition: Exhibition;
  onImageClick: (index: number) => void;
}

export default function SlideCarousel({
  exhibition,
  onImageClick,
}: SlideCarouselProps) {
  return (
    <div className="relative w-full h-full">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1.5}
        centeredSlides={true}
        loop={false}
        navigation={{
          nextEl: `.swiper-button-next-${exhibition.id}`,
          prevEl: `.swiper-button-prev-${exhibition.id}`,
        }}
        pagination={{
          clickable: true,
          el: `.swiper-pagination-${exhibition.id}`,
        }}
        breakpoints={{
          768: {
            slidesPerView: 1.5,
            spaceBetween: 0,
          },
        }}
        className="w-full h-full"
      >
        {exhibition.photos.map((photo, index) => (
          <SwiperSlide key={`photo-${exhibition.id}-${index}`}>
            <div className="relative w-full h-full">
              <button
                onClick={() => onImageClick(index)}
                className="relative w-full h-full cursor-pointer group overflow-hidden"
              >
                <Image
                  src={photo}
                  alt={`${exhibition.title} - ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 67vw, 533px"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 커스텀 네비게이션 버튼 */}
      {exhibition.photos.length > 1 && (
        <>
          <button
            className={`swiper-button-prev-${exhibition.id} swiper-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl transition-all opacity-0 group-hover:opacity-100`}
            aria-label="Previous image"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          
          <button
            className={`swiper-button-next-${exhibition.id} swiper-button-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl transition-all opacity-0 group-hover:opacity-100`}
            aria-label="Next image"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* 커스텀 페이지네이션 */}
          <div className={`swiper-pagination-${exhibition.id} absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2`}>
            {exhibition.photos.map((_, index) => (
              <span
                key={`pagination-${exhibition.id}-${index}`}
                className="w-2 h-2 rounded-full bg-white/50 cursor-pointer transition-all hover:bg-white/80"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
