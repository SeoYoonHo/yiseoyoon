import Image from 'next/image';
import { getResponsiveThumbnail } from '@/lib/thumbnail';

interface Artwork {
  id: string;
  title: string;
  description: string;
  year: string;
  originalImage: string;
  thumbnailImage?: string; // 기존 호환성
  thumbnailSmall: string;
  thumbnailMedium: string;
  thumbnailLarge: string;
  category: string;
  createdAt: string;
}

interface WorksGridProps {
  readonly artworks: Artwork[];
}

export default function WorksGrid({ artworks }: WorksGridProps) {
  // artworks가 undefined이거나 null인 경우 빈 배열로 처리
  const safeArtworks = artworks || [];

  return (
    <div className="columns-2 gap-8 space-y-8">
      {safeArtworks.map((artwork) => (
        <div key={artwork.id} className="group cursor-pointer break-inside-avoid mb-8">
          <div className="bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
            <Image
              src={getResponsiveThumbnail(
                artwork.thumbnailSmall,
                artwork.thumbnailMedium,
                artwork.thumbnailLarge,
                artwork.thumbnailImage
              )}
              alt={artwork.title}
              width={400}
              height={600}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 50vw"
            />
          </div>
          <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-white mb-2">{artwork.title}</h3>
        </div>
      ))}
    </div>
  );
}
