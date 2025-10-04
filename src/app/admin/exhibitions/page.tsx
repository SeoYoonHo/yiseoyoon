'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface Exhibition {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  photos: string[];
  createdAt: string;
}

export default function AdminExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 새 전시 생성 상태
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newExhibition, setNewExhibition] = useState({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState('');

  // 사진 업로드 상태
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 전시 목록 불러오기
  const fetchExhibitions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/exhibitions/list');
      const data = await response.json();
      if (data.success) {
        setExhibitions(data.exhibitions || []);
      }
    } catch (error) {
      console.error('Failed to fetch exhibitions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 전시 생성
  const handleCreateExhibition = async () => {
    if (!newExhibition.title || !newExhibition.startDate || !newExhibition.endDate || !newExhibition.location) {
      setCreateStatus('모든 필수 항목을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    setCreateStatus('전시를 생성하는 중...');

    try {
      const response = await fetch('/api/exhibitions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExhibition),
      });

      const result = await response.json();

      if (result.success) {
        setCreateStatus('전시가 생성되었습니다!');
        setNewExhibition({ title: '', startDate: '', endDate: '', location: '', description: '' });
        setShowCreateForm(false);
        fetchExhibitions();
      } else {
        setCreateStatus(`생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Create error:', error);
      setCreateStatus('전시 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 사진 업로드
  const handlePhotoUpload = async (exhibitionId: string) => {
    if (!selectedFile) {
      setUploadStatus('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('업로드 중...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('exhibitionId', exhibitionId);

    try {
      const response = await fetch('/api/exhibitions/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('사진이 업로드되었습니다!');
        setSelectedFile(null);
        setSelectedExhibitionId(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchExhibitions();
      } else {
        setUploadStatus(`업로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 사진 삭제
  const handleDeletePhoto = async (exhibitionId: string, photoKey: string) => {
    if (!confirm('이 사진을 삭제하시겠습니까?')) {
      return;
    }

    try {
      // URL에서 키 추출
      const extractKey = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const urlObj = new URL(url);
          return decodeURIComponent(urlObj.pathname.substring(1));
        }
        return url;
      };

      const key = extractKey(photoKey);
      
      const response = await fetch(
        `/api/exhibitions/delete-photo?exhibitionId=${encodeURIComponent(exhibitionId)}&photoKey=${encodeURIComponent(key)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        alert('사진이 삭제되었습니다.');
        fetchExhibitions();
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('사진 삭제 중 오류가 발생했습니다.');
    }
  };

  // 전시 삭제
  const handleDeleteExhibition = async (exhibitionId: string, exhibitionTitle: string) => {
    if (!confirm(`"${exhibitionTitle}" 전시를 삭제하시겠습니까? 모든 사진도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/exhibitions/delete?id=${encodeURIComponent(exhibitionId)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('전시가 삭제되었습니다.');
        fetchExhibitions();
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete exhibition error:', error);
      alert('전시 삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchExhibitions();
  }, []);

  return (
    <div className="w-full h-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 h-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin - Exhibitions 관리</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-all"
          >
            {showCreateForm ? '취소' : '+ 새 전시 추가'}
          </button>
        </div>

        {/* 전시 생성 폼 */}
        {showCreateForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">새 전시 생성</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="exhibition-title" className="block text-sm font-medium text-gray-700 mb-1">
                  전시명 <span className="text-red-500">*</span>
                </label>
                <input
                  id="exhibition-title"
                  type="text"
                  value={newExhibition.title}
                  onChange={(e) => setNewExhibition({ ...newExhibition, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="전시 제목"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="exhibition-start" className="block text-sm font-medium text-gray-700 mb-1">
                    시작 날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="exhibition-start"
                    type="date"
                    value={newExhibition.startDate}
                    onChange={(e) => setNewExhibition({ ...newExhibition, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="exhibition-end" className="block text-sm font-medium text-gray-700 mb-1">
                    종료 날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="exhibition-end"
                    type="date"
                    value={newExhibition.endDate}
                    onChange={(e) => setNewExhibition({ ...newExhibition, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="exhibition-location" className="block text-sm font-medium text-gray-700 mb-1">
                  장소 <span className="text-red-500">*</span>
                </label>
                <input
                  id="exhibition-location"
                  type="text"
                  value={newExhibition.location}
                  onChange={(e) => setNewExhibition({ ...newExhibition, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="전시 장소"
                />
              </div>

              <div>
                <label htmlFor="exhibition-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  id="exhibition-desc"
                  value={newExhibition.description}
                  onChange={(e) => setNewExhibition({ ...newExhibition, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                  placeholder="전시에 대한 설명"
                />
              </div>

              <button
                onClick={handleCreateExhibition}
                disabled={isCreating}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {isCreating ? '생성 중...' : '전시 생성'}
              </button>

              {createStatus && (
                <div className={`p-3 rounded-md ${createStatus.includes('성공') || createStatus.includes('생성되었습니다') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {createStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 전시 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">전시 목록을 불러오는 중...</p>
          </div>
        ) : exhibitions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            아직 등록된 전시가 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {exhibitions.map((exhibition) => (
              <div key={exhibition.id} className="border border-gray-200 rounded-lg p-6">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{exhibition.title}</h3>
                    <button
                      onClick={() => handleDeleteExhibition(exhibition.id, exhibition.title)}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-all"
                    >
                      전시 삭제
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 {new Date(exhibition.startDate).toLocaleDateString('ko-KR')} - {new Date(exhibition.endDate).toLocaleDateString('ko-KR')}</p>
                    <p>📍 {exhibition.location}</p>
                    {exhibition.description && (
                      <p className="text-gray-700 mt-2">{exhibition.description}</p>
                    )}
                  </div>
                </div>

                {/* 사진 업로드 */}
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">사진 추가</h4>
                  <div className="flex gap-2">
                    <input
                      ref={selectedExhibitionId === exhibition.id ? fileInputRef : null}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] || null);
                        setSelectedExhibitionId(exhibition.id);
                      }}
                      className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                    />
                    <button
                      onClick={() => handlePhotoUpload(exhibition.id)}
                      disabled={!selectedFile || selectedExhibitionId !== exhibition.id || isUploading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                    >
                      {isUploading && selectedExhibitionId === exhibition.id ? '업로드 중...' : '업로드'}
                    </button>
                  </div>
                  {uploadStatus && selectedExhibitionId === exhibition.id && (
                    <p className="text-sm mt-2 text-gray-600">{uploadStatus}</p>
                  )}
                </div>

                {/* 사진 목록 */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    전시 사진 ({exhibition.photos.length})
                  </h4>
                  {exhibition.photos.length === 0 ? (
                    <p className="text-sm text-gray-500">아직 업로드된 사진이 없습니다.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {exhibition.photos.map((photoUrl, index) => (
                        <div key={index} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <Image
                              src={photoUrl}
                              alt={`${exhibition.title} photo ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            />
                          </div>
                          <button
                            onClick={() => handleDeletePhoto(exhibition.id, photoUrl)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                            aria-label="Delete photo"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
