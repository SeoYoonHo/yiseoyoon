
import Link from 'next/link';
import siteConfig from '@/data/site-config.json';
import BackgroundLayout from '@/components/BackgroundLayout';
import ContentTransition from '@/components/ContentTransition';

export default function HomePage() {
  const { siteSettings } = siteConfig;

  return (
    <BackgroundLayout>
      <main className="h-full flex flex-col">
        {/* Navigation Space */}
        <div className="h-20"></div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center">
          <ContentTransition>
            <div className="text-center text-white">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">
                {siteSettings.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 drop-shadow-md">
                {siteSettings.subtitle}
              </p>
              <p className="text-lg mb-12 max-w-2xl mx-auto drop-shadow-md">
                {siteSettings.description}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/gallery"
                  className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-full hover:bg-white/30 transition-all border border-white/30"
                >
                  View Works
                </Link>
                <Link
                  href="/about"
                  className="bg-white text-gray-900 px-8 py-3 rounded-full hover:bg-gray-100 transition-all"
                >
                  About Artist
                </Link>
              </div>
            </div>
          </ContentTransition>
        </div>

        {/* Footer Space */}
        <div className="h-8"></div>
      </main>
    </BackgroundLayout>
  );
}
