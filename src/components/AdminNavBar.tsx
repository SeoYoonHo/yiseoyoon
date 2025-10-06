'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface AdminNavBarProps {
  onLogout?: () => void;
}

export default function AdminNavBar({ onLogout }: Readonly<AdminNavBarProps>) {
  const pathname = usePathname();
  const [isWorksDropdownOpen, setIsWorksDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Home' },
    { href: '/admin/works', label: 'Work' },
    { href: '/admin/exhibitions', label: 'Exhibition' },
    { href: '/admin/text', label: 'Text' },
    { href: '/admin/cv', label: 'CV' },
    { href: '/admin/contact', label: 'Contact' },
    { href: '/admin/backgrounds', label: 'Backgrounds' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 w-full bg-gray-800 z-50 border-b border-gray-600">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          <Link 
            href="/admin"
            className="text-2xl font-bold text-white hover:text-gray-200 transition-colors drop-shadow-md"
          >
            Admin
          </Link>
          <div className="hidden md:flex space-x-8">
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
                    className={`px-4 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive(item.href) || pathname.startsWith('/admin/works/')
                        ? 'bg-white/30 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    {item.label}
                  </Link>
                  
                  {/* Work 드롭다운 메뉴 */}
                  {isWorksDropdownOpen && (
                    <div className="absolute top-full left-0 bg-gray-700 rounded-md shadow-lg z-50 min-w-[120px]">
                      <Link
                        href="/admin/works/painting"
                        onClick={() => setIsWorksDropdownOpen(false)}
                        className={`block px-4 py-2 text-sm font-medium transition-colors ${
                          pathname === '/admin/works/painting'
                            ? 'bg-white/30 text-white'
                            : 'text-white/80 hover:text-white hover:bg-white/20'
                        }`}
                      >
                        Painting
                      </Link>
                      <Link
                        href="/admin/works/drawing"
                        onClick={() => setIsWorksDropdownOpen(false)}
                        className={`block px-4 py-2 text-sm font-medium transition-colors ${
                          pathname === '/admin/works/drawing'
                            ? 'bg-white/30 text-white'
                            : 'text-white/80 hover:text-white hover:bg-white/20'
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
                  className={`px-4 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-white/30 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {item.label}
                </Link>
              )
            ))}
            <Link
              href="/site/home"
              className="px-4 py-3 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              ← Back to Site
            </Link>
            {onLogout && (
              <button
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  }
                  // 로그아웃 후 로그인 페이지로 이동
                  window.location.href = '/admin/login';
                }}
                className="px-4 py-3 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                Logout
              </button>
            )}
          </div>

          {/* 모바일 햄버거 메뉴 버튼 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-gray-200 transition-colors"
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-800 border-t border-gray-600">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                item.label === 'Work' ? (
                  <div key={item.href} className="space-y-1">
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href) || pathname.startsWith('/admin/works/')
                          ? 'bg-white/30 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/20'
                      }`}
                    >
                      {item.label}
                    </Link>
                    <div className="ml-4 space-y-1">
                      <Link
                        href="/admin/works/painting"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === '/admin/works/painting'
                            ? 'bg-white/30 text-white'
                            : 'text-white/80 hover:text-white hover:bg-white/20'
                        }`}
                      >
                        Painting
                      </Link>
                      <Link
                        href="/admin/works/drawing"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === '/admin/works/drawing'
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
              <Link
                href="/site/home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                ← Back to Site
              </Link>
              {onLogout && (
                <button
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    }
                    setIsMobileMenuOpen(false);
                    window.location.href = '/admin/login';
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
