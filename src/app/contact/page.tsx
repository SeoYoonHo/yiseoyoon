import BackgroundLayout from '@/components/BackgroundLayout';
import ContentTransition from '@/components/ContentTransition';

export default function ContactPage() {
  return (
    <BackgroundLayout>
      <main className="h-full flex flex-col">
        {/* Navigation Space */}
        <div className="h-20"></div>
        
        {/* Content Area - Scrollable within fixed height */}
        <div className="flex-1 overflow-y-auto">
          <ContentTransition>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-white/90 backdrop-blur-sm rounded-lg text-center shadow-lg">
                  <div className="text-xl mb-3">📧</div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600 text-sm">contact@example.com</p>
                </div>
                <div className="p-4 bg-white/90 backdrop-blur-sm rounded-lg text-center shadow-lg">
                  <div className="text-xl mb-3">📱</div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Phone</h3>
                  <p className="text-gray-600 text-sm">010-0000-0000</p>
                </div>
                <div className="p-4 bg-white/90 backdrop-blur-sm rounded-lg text-center shadow-lg">
                  <div className="text-xl mb-3">📍</div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-600 text-sm">Seoul, Korea</p>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Social Media</h3>
                <div className="flex justify-center space-x-3">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span>📷</span>
                    Instagram
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span>📘</span>
                    Facebook
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
                  >
                    <span>🐦</span>
                    Twitter
                  </a>
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
