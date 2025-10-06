'use client';

import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <div className="w-full h-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full h-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin - Home</h1>
        
        <div className="space-y-8">
          {/* 관리 기능 안내 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">관리 기능</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/admin/works"
                className="bg-blue-50 hover:bg-blue-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Works 관리</h3>
                <p className="text-sm text-blue-600">Painting과 Drawing 작품을 관리합니다.</p>
              </Link>
              
              <Link
                href="/admin/exhibitions"
                className="bg-green-50 hover:bg-green-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-lg font-semibold text-green-800 mb-2">Exhibitions 관리</h3>
                <p className="text-sm text-green-600">전시회 정보를 관리합니다.</p>
              </Link>
              
              <Link
                href="/admin/cv"
                className="bg-purple-50 hover:bg-purple-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-lg font-semibold text-purple-800 mb-2">CV 관리</h3>
                <p className="text-sm text-purple-600">CV 내용과 포스터를 관리합니다.</p>
              </Link>
              
              <Link
                href="/admin/text"
                className="bg-orange-50 hover:bg-orange-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Text 관리</h3>
                <p className="text-sm text-orange-600">PDF 문서를 관리합니다.</p>
              </Link>
              
              <Link
                href="/admin/contact"
                className="bg-pink-50 hover:bg-pink-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-lg font-semibold text-pink-800 mb-2">Contact 관리</h3>
                <p className="text-sm text-pink-600">연락처 정보를 관리합니다.</p>
              </Link>
              
              <Link
                href="/admin/backgrounds"
                className="bg-red-50 hover:bg-red-100 rounded-lg p-6 transition-colors"
              >
                <h3 className="text-lg font-semibold text-red-800 mb-2">Backgrounds 관리</h3>
                <p className="text-sm text-red-600">각 페이지별 배경화면을 관리합니다.</p>
              </Link>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">빠른 링크</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/site/home"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                사이트 보기
              </Link>
              <Link
                href="/admin/backgrounds"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                배경화면 관리
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}