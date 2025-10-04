'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNavBar() {
  const pathname = usePathname();

  const adminTabs = [
    { name: 'Home', href: '/admin/home' },
    { name: 'Works', href: '/admin/works' },
    { name: 'Exhibitions', href: '/admin/exhibitions' },
    { name: 'Text', href: '/admin/text' },
    { name: 'CV', href: '/admin/cv' },
    { name: 'Contact', href: '/admin/contact' },
  ];

  return (
    <nav className="bg-red-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* 어드민 로고 */}
          <div className="flex items-center">
            <span className="text-xl font-bold">Admin Panel</span>
          </div>

          {/* 어드민 메뉴 */}
          <div className="flex space-x-8">
            {adminTabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={`text-base font-medium px-4 py-2 rounded-md transition-all ${
                  pathname === tab.href
                    ? 'bg-red-700 text-white'
                    : 'text-red-100 hover:bg-red-700 hover:text-white'
                }`}
              >
                {tab.name}
              </Link>
            ))}
          </div>

          {/* 사이트 보기 버튼 - 현재 어드민 페이지에 맞는 사이트 페이지로 이동 */}
          <div className="flex items-center">
            <Link
              href={pathname.replace('/admin', '/site')}
              className="bg-white text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-all"
            >
              View Site
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
