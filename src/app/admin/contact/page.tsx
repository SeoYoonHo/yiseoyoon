'use client';

import { useState, useEffect } from 'react';

interface ContactData {
  text: string;
  instagramUrl: string;
  updatedAt: string;
}

export default function AdminContactPage() {
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form states
  const [text, setText] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  
  // Status messages
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const fetchContactData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/contact/get');
      const data = await response.json();
      
      if (data.success) {
        const contactData = data.data;
        setContactData(contactData);
        setText(contactData.text || '');
        setInstagramUrl(contactData.instagramUrl || '');
      } else {
        console.error('Failed to fetch contact data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching contact data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, []);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUpdating(true);
    setUpdateStatus('업데이트 중...');

    try {
      const response = await fetch('/api/contact/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          instagramUrl: instagramUrl.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUpdateStatus('연락처 정보가 성공적으로 업데이트되었습니다!');
        await fetchContactData(); // 데이터 새로고침
      } else {
        setUpdateStatus(`업데이트 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      setUpdateStatus('업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 h-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
              <p className="mt-4 text-gray-600">연락처 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 h-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin - Contact 관리</h1>

        {/* Contact 업데이트 섹션 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">연락처 정보 업데이트</h2>
          <form onSubmit={handleUpdateContact} className="space-y-6">
            {/* 텍스트 입력 */}
            <div>
              <label htmlFor="contactText" className="block text-sm font-medium text-gray-700 mb-1">
                연락처 텍스트
              </label>
              <textarea
                id="contactText"
                rows={8}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="연락처 정보를 입력하세요 (이메일, 전화번호, 주소 등)"
              />
            </div>

            {/* 인스타그램 URL 입력 */}
            <div>
              <label htmlFor="instagramUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                id="instagramUrl"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="https://instagram.com/your-username"
              />
              <p className="mt-1 text-sm text-gray-500">
                인스타그램 프로필 URL을 입력하세요. 예: https://instagram.com/your-username
              </p>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? '업데이트 중...' : '연락처 정보 업데이트'}
            </button>
          </form>
          {updateStatus && (
            <p className={`mt-4 text-center text-sm ${updateStatus.includes('실패') ? 'text-red-600' : 'text-green-600'}`}>
              {updateStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
