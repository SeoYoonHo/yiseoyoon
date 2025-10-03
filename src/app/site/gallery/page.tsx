import GalleryGrid from '@/components/GalleryGrid';
import ContentTransition from '@/components/ContentTransition';
import galleryData from '@/data/gallery.json';

export default function GalleryPage() {
  return (
    <main className="h-full flex flex-col">
      {/* Navigation Space */}
      <div className="h-20"></div>
      
      {/* Content Area - Scrollable within fixed height */}
      <div className="flex-1 overflow-y-auto">
        <ContentTransition>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <GalleryGrid artworks={galleryData.artworks} />
          </div>
        </ContentTransition>
      </div>
      
      {/* Footer Space */}
      <div className="h-16"></div>
    </main>
  );
}
