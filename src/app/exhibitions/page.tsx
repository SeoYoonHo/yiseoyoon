import BackgroundLayout from '@/components/BackgroundLayout';
import ContentTransition from '@/components/ContentTransition';
import exhibitionsData from '@/data/exhibitions.json';

export default function ExhibitionsPage() {
  return (
    <BackgroundLayout>
      <main className="h-full flex flex-col">
        {/* Navigation Space */}
        <div className="h-20"></div>
        
        {/* Content Area - Scrollable within fixed height */}
        <div className="flex-1 overflow-y-auto">
          <ContentTransition>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="space-y-8">
                {exhibitionsData.exhibitions.map((exhibition) => (
                  <div key={exhibition.id} className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                    <div className="aspect-video bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                      <p className="text-white text-xl font-semibold">{exhibition.title}</p>
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{exhibition.title}</h3>
                      <p className="text-gray-600 mb-3">{exhibition.period}, {exhibition.location}</p>
                      <p className="text-gray-700 mb-4 text-sm">{exhibition.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {exhibition.artworks.map((artwork) => (
                          <div key={artwork.id} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500 text-xs">{artwork.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ContentTransition>
        </div>
        
        {/* Footer Space */}
        <div className="h-16"></div>
      </main>
    </BackgroundLayout>
  );
}
