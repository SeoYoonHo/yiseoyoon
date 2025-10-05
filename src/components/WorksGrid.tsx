interface Artwork {
  id: string;
  title: string;
  description: string;
  date: string;
  originalImage: string;
  thumbnailImage: string;
  category: string;
  createdAt: string;
}

interface WorksGridProps {
  readonly artworks: Artwork[];
  readonly columns?: 2 | 3 | 4;
}

export default function WorksGrid({ artworks, columns = 3 }: WorksGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4'
  };

  // artworks가 undefined이거나 null인 경우 빈 배열로 처리
  const safeArtworks = artworks || [];

  return (
    <div className={`grid grid-cols-1 ${gridCols[columns]} gap-8`}>
      {safeArtworks.map((artwork) => (
        <div key={artwork.id} className="group cursor-pointer">
          <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
            <img 
              src={artwork.thumbnailImage} 
              alt={artwork.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{artwork.title}</h3>
          <p className="text-sm text-white/70 mb-1">{artwork.date}</p>
          <p className="text-white/80">{artwork.description}</p>
        </div>
      ))}
    </div>
  );
}
