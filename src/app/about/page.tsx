import BackgroundLayout from '@/components/BackgroundLayout';
import ContentTransition from '@/components/ContentTransition';
import aboutData from '@/data/about.json';

export default function AboutPage() {
  const { artist } = aboutData;

  return (
    <BackgroundLayout>
      <main className="h-full flex flex-col">
        {/* Navigation Space */}
        <div className="h-20"></div>
        
        {/* Content Area - Scrollable within fixed height */}
        <div className="flex-1 overflow-y-auto">
          <ContentTransition>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
                <div>
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Artist Photo</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-md">{artist.name}</h3>
                  {artist.biography.map((paragraph, index) => (
                    <p key={`biography-${index}`} className="text-white/90 mb-4 leading-relaxed drop-shadow-sm text-sm">
                      {paragraph}
                    </p>
                  ))}
                  <div className="space-y-2">
                    <p className="text-white/90 drop-shadow-sm text-sm">
                      <span className="font-semibold">Exhibition Career:</span> {artist.career.exhibitions}
                    </p>
                    <p className="text-white/90 drop-shadow-sm text-sm">
                      <span className="font-semibold">Awards:</span> {artist.career.awards}
                    </p>
                    <p className="text-white/90 drop-shadow-sm text-sm">
                      <span className="font-semibold">Location:</span> {artist.career.location}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Education</h4>
                  <ul className="space-y-2">
                    {artist.education.map((edu, index) => (
                      <li key={`education-${index}`} className="text-gray-700 flex items-start text-sm">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Main Techniques</h4>
                  <div className="flex flex-wrap gap-2">
                    {artist.techniques.map((technique, index) => (
                      <span 
                        key={`technique-${index}`}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {technique}
                      </span>
                    ))}
                  </div>
                </div>
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
