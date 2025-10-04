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
        centeredSlides={false}
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
          640: {
            slidesPerView: 'auto',
            spaceBetween: 8,
          },
          768: {
            slidesPerView: 'auto',
            spaceBetween: 8,
          },
          1024: {
            slidesPerView: 'auto',
            spaceBetween: 12,
          },
          1280: {
            slidesPerView: 'auto',
            spaceBetween: 12,
          },
          1536: {
            slidesPerView: 'auto',
            spaceBetween: 16,
          },
        }}
        className="w-full h-full"
      >
        {exhibition.photos.map((photo, index) => (
          <SwiperSlide key={`photo-${exhibition.id}-${index}`} className="!w-auto">
            <div className="relative h-80 w-auto">
              <button
                onClick={() => onImageClick(index)}
                className="relative w-auto h-full cursor-pointer group overflow-hidden rounded-lg"
              >
                <Image
                  src={photo}
                  alt={`${exhibition.title} - ${index + 1}`}
                  width={0}
                  height={320}
                  className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg"></div>
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* 커스텀 네비게이션 버튼 */}
      {exhibition.photos.length > 0 && (
        <>
          <button
            className={`swiper-button-prev-${exhibition.id} swiper-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl transition-all`}
            aria-label="Previous image"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          <button
            className={`swiper-button-next-${exhibition.id} swiper-button-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl transition-all`}
            aria-label="Next image"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
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
