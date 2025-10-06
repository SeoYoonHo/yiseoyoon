'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function NavBar() {
  const pathname = usePathname();
  const [instagramUrl, setInstagramUrl] = useState('https://instagram.com');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWorksDropdownOpen, setIsWorksDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchInstagramUrl = async () => {
      try {
        const response = await fetch('/api/contact/get');
        const data = await response.json();
        
        if (data.success && data.data.instagramUrl) {
          setInstagramUrl(data.data.instagramUrl);
        }
      } catch (error) {
        console.error('Error fetching instagram URL:', error);
      }
    };

    fetchInstagramUrl();
  }, []);

  const navItems = [
    { href: '/site/home', label: 'Home' },
    { href: '/site/works', label: 'Work' },
    { href: '/site/exhibitions', label: 'Exhibition' },
    { href: '/site/text', label: 'Text' },
    { href: '/site/cv', label: 'CV' },
    { href: '/site/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/site/home') {
      return pathname === '/site/home' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-200">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link 
            href="/site/home"
            className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Seoyoon Yi
          </Link>
          <div className="hidden sm:flex space-x-2 md:space-x-4 lg:space-x-6 xl:space-x-8">
            {navItems.map((item) => (
              item.label === 'Work' ? (
                <div
                  key={item.href}
                  className="relative flex"
                  onMouseEnter={() => setIsWorksDropdownOpen(true)}
                  onMouseLeave={() => setIsWorksDropdownOpen(false)}
                >
                  <Link
                    href={item.href}
                    className={`px-2 md:px-3 lg:px-4 py-2 md:py-3 rounded-md text-sm md:text-base font-medium transition-colors ${
                      isActive(item.href) || pathname.startsWith('/site/works/')
                        ? 'bg-gray-200 text-gray-900'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                  
                  {/* Work 드롭다운 메뉴 */}
                  {isWorksDropdownOpen && (
                    <div className="absolute top-full left-0 bg-white/95 backdrop-blur-md rounded-md shadow-lg z-50 min-w-[120px] border border-gray-200">
                      <Link
                        href="/site/works/painting"
                        onClick={() => setIsWorksDropdownOpen(false)}
                        className={`block px-4 py-2 text-sm font-medium transition-colors ${
                          pathname === '/site/works/painting'
                            ? 'bg-gray-200 text-gray-900'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Painting
                      </Link>
                      <Link
                        href="/site/works/drawing"
                        onClick={() => setIsWorksDropdownOpen(false)}
                        className={`block px-4 py-2 text-sm font-medium transition-colors ${
                          pathname === '/site/works/drawing'
                            ? 'bg-gray-200 text-gray-900'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        Drawing
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2 md:px-3 lg:px-4 py-2 md:py-3 rounded-md text-sm md:text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 md:px-3 lg:px-4 py-2 md:py-3 rounded-md text-sm md:text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1 md:gap-2"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              
              
              {/* Back to Site Link - Only show on admin page */}
              {pathname.startsWith('/admin') && (
                <Link
                  href="/site/home"
                  className="px-2 md:px-3 lg:px-4 py-2 md:py-3 rounded-md text-sm md:text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  ← Back to Site
                </Link>
              )}
          </div>

          {/* 모바일 햄버거 메뉴 버튼 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-200">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                item.label === 'Work' ? (
                  <div key={item.href} className="space-y-1">
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href) || pathname.startsWith('/site/works/')
                          ? 'bg-white/30 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/20'
                      }`}
                    >
                      {item.label}
                    </Link>
                    <div className="ml-4 space-y-1">
                      <Link
                        href="/site/works/painting"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === '/site/works/painting'
                            ? 'bg-white/30 text-white'
                            : 'text-white/80 hover:text-white hover:bg-white/20'
                        }`}
                      >
                        Painting
                      </Link>
                      <Link
                        href="/site/works/drawing"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === '/site/works/drawing'
                            ? 'bg-white/30 text-white'
                            : 'text-white/80 hover:text-white hover:bg-white/20'
                        }`}
                      >
                        Drawing
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-white/30 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </a>
              {pathname.startsWith('/admin') && (
                <Link
                  href="/site/home"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  ← Back to Site
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
