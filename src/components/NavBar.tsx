'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/site/home', label: 'Home' },
    { href: '/site/works', label: 'Works' },
    { href: '/site/exhibitions', label: 'Exhibitions' },
    { href: '/site/text', label: 'Text' },
    { href: '/site/about', label: 'About' },
    { href: '/site/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/site/home') {
      return pathname === '/site/home' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-md z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <Link 
            href="/site/home"
            className="text-2xl font-bold text-white hover:text-gray-200 transition-colors drop-shadow-md"
          >
            yiseoyoon
          </Link>
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-md text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-white/30 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/20'
                }`}
              >
                {item.label}
              </Link>
            ))}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors flex items-center gap-2"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              
              {/* Admin Link - Only show on site pages, go to corresponding admin page */}
              {pathname.startsWith('/site') && (
                <Link
                  href={pathname.replace('/site', '/admin')}
                  className="px-4 py-3 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  Admin
                </Link>
              )}
              
              {/* Back to Site Link - Only show on admin page */}
              {pathname.startsWith('/admin') && (
                <Link
                  href="/site/home"
                  className="px-4 py-3 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                >
                  ← Back to Site
                </Link>
              )}
          </div>
        </div>
      </div>
    </nav>
  );
}
