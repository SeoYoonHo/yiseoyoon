interface Artwork {
  id: string;
  title: string;
  description: string;
  image: string;
  year?: string;
  medium?: string;
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

  return (
    <div className={`grid grid-cols-1 ${gridCols[columns]} gap-8`}>
      {artworks.map((artwork) => (
        <div key={artwork.id} className="group cursor-pointer">
          <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">{artwork.title}</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{artwork.title}</h3>
          {artwork.year && (
            <p className="text-sm text-gray-500 mb-1">{artwork.year}</p>
          )}
          {artwork.medium && (
            <p className="text-sm text-gray-500 mb-2">{artwork.medium}</p>
          )}
          <p className="text-gray-600">{artwork.description}</p>
        </div>
      ))}
    </div>
  );
}
