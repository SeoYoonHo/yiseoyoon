'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CVData {
  name: string;
  leftText: string;
  rightText: string;
  images: string[];
  updatedAt: string;
}

export default function AdminCVPage() {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  
  // 순서 변경 관련 상태
  const [isReordering, setIsReordering] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  
  // Form states
  const [name, setName] = useState('');
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Status messages
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const fetchCVData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cv/get');
      const data = await response.json();
      
      if (data.success) {
        const cvData = data.data;
        setCvData(cvData);
        setName(cvData.name || '');
        setLeftText(cvData.leftText || '');
        setRightText(cvData.rightText || '');
      } else {
        console.error('Failed to fetch CV data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching CV data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCVData();
  }, []);

  const handleUpdateCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setUpdateStatus('이름은 필수입니다.');
      return;
    }

    setIsUpdating(true);
    setUpdateStatus('업데이트 중...');

    try {
      const response = await fetch('/api/cv/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          leftText: leftText.trim(),
          rightText: rightText.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUpdateStatus('CV가 성공적으로 업데이트되었습니다!');
        await fetchCVData(); // 데이터 새로고침
      } else {
        setUpdateStatus(`업데이트 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating CV:', error);
      setUpdateStatus('업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus('이미지 파일을 선택해주세요.');
      return;
    }

    setIsUploadingImage(true);
    setUploadStatus('이미지 업로드 중...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/cv/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('이미지가 성공적으로 업로드되었습니다!');
        setSelectedFile(null);
        // 파일 입력 초기화
        const fileInput = document.getElementById('imageFile') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        await fetchCVData(); // 데이터 새로고침
      } else {
        setUploadStatus(`업로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadStatus('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!confirm('정말로 이 이미지를 삭제하시겠습니까?')) {
      return;
    }

    setDeletingImageUrl(imageUrl);
    try {
      const response = await fetch(`/api/cv/delete-image?imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('이미지가 삭제되었습니다.');
        await fetchCVData(); // 데이터 새로고침
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingImageUrl(null);
    }
  };

  // 순서 변경 시작
  const startReorder = () => {
    if (cvData?.images && cvData.images.length > 1) {
      setOriginalImages([...cvData.images]);
      setIsReordering(true);
      setSelectedImageIndex(null);
    }
  };

  // 순서 변경 취소
  const cancelReorder = () => {
    if (cvData && originalImages.length > 0) {
      setCvData({ ...cvData, images: [...originalImages] });
    }
    setIsReordering(false);
    setSelectedImageIndex(null);
  };

  // 이미지 순서 이동
  const moveImage = (fromIndex: number, direction: 'left' | 'right') => {
    if (!cvData) return;

    const newImages = [...cvData.images];
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;

    if (toIndex >= 0 && toIndex < newImages.length) {
      [newImages[fromIndex], newImages[toIndex]] = [newImages[toIndex], newImages[fromIndex]];
      setCvData({ ...cvData, images: newImages });
    }
  };

  // 이미지 순서를 서버에 저장
  const saveImageOrder = async () => {
    if (!cvData) return;

    try {
      const response = await fetch('/api/cv/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cvData.name,
          leftText: cvData.leftText,
          rightText: cvData.rightText,
          images: cvData.images,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('이미지 순서가 성공적으로 저장되었습니다!');
        setIsReordering(false);
        setSelectedImageIndex(null);
        await fetchCVData(); // 데이터 새로고침
      } else {
        setUploadStatus(`순서 저장 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving image order:', error);
      setUploadStatus('순서 저장 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="w-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-8">Admin - CV 관리</h1>

        {/* CV 업데이트 섹션 */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">CV 정보 업데이트</h2>
          <form onSubmit={handleUpdateCV} className="space-y-6">
            {/* 이름 입력 */}
            <div>
              <label htmlFor="cvName" className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cvName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="작가 이름을 입력하세요"
                required
              />
            </div>

            {/* 양옆 텍스트 입력 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="leftText" className="block text-sm font-medium text-gray-700 mb-1">
                  왼쪽 텍스트
                </label>
                <textarea
                  id="leftText"
                  rows={12}
                  value={leftText}
                  onChange={(e) => setLeftText(e.target.value)}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="왼쪽에 표시될 텍스트를 입력하세요"
                />
              </div>
              <div>
                <label htmlFor="rightText" className="block text-sm font-medium text-gray-700 mb-1">
                  오른쪽 텍스트
                </label>
                <textarea
                  id="rightText"
                  rows={12}
                  value={rightText}
                  onChange={(e) => setRightText(e.target.value)}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="오른쪽에 표시될 텍스트를 입력하세요"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? '업데이트 중...' : 'CV 업데이트'}
            </button>
          </form>
          {updateStatus && (
            <p className={`mt-4 text-center text-sm ${updateStatus.includes('실패') ? 'text-red-600' : 'text-green-600'}`}>
              {updateStatus}
            </p>
          )}
        </div>

        {/* 이미지 업로드 섹션 */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">전시 포스터 이미지 업로드</h2>
          <form onSubmit={handleUploadImage} className="space-y-4">
            <div>
              <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                이미지 파일 선택 <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isUploadingImage}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingImage ? '업로드 중...' : '이미지 업로드'}
            </button>
          </form>
          {uploadStatus && (
            <p className={`mt-4 text-center text-sm ${uploadStatus.includes('실패') ? 'text-red-600' : 'text-green-600'}`}>
              {uploadStatus}
            </p>
          )}
        </div>

        {/* 업로드된 이미지 목록 섹션 */}
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
            <h2 className="text-xl font-semibold text-gray-800">업로드된 포스터 이미지</h2>
            {cvData?.images && cvData.images.length > 1 && (
              <div className="flex gap-2 justify-center sm:justify-end">
                {isReordering ? (
                  <>
                    <button
                      onClick={cancelReorder}
                      className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-all"
                    >
                      취소
                    </button>
                    <button
                      onClick={saveImageOrder}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-all"
                    >
                      완료
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startReorder}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-all"
                  >
                    순서 변경
                  </button>
                )}
              </div>
            )}
          </div>
          {cvData?.images && cvData.images.length === 0 && (
            <p className="text-gray-500">아직 업로드된 이미지가 없습니다.</p>
          )}
          {cvData?.images && cvData.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cvData.images.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <div className={`relative aspect-[3/4] rounded-lg overflow-hidden shadow-md ${
                    isReordering && selectedImageIndex === index
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}>
                    <Image
                      src={imageUrl}
                      alt={`CV Poster ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    
                    {/* 순서 변경 모드에서 이미지 선택 */}
                    {isReordering && (
                      <button
                        onClick={() => setSelectedImageIndex(selectedImageIndex === index ? null : index)}
                        className={`absolute inset-0 flex items-center justify-center ${
                          selectedImageIndex === index
                            ? 'bg-blue-500/50'
                            : 'bg-black/0 hover:bg-black/20'
                        } transition-all`}
                      >
                        {selectedImageIndex === index && (
                          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                            선택됨
                          </div>
                        )}
                      </button>
                    )}
                    
                    {/* 순서 변경 버튼들 */}
                    {isReordering && selectedImageIndex === index && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <button
                          onClick={() => moveImage(index, 'left')}
                          disabled={index === 0}
                          className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => moveImage(index, 'right')}
                          disabled={index === cvData.images.length - 1}
                          className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          →
                        </button>
                      </div>
                    )}
                    
                    {/* 삭제 버튼 - 순서 변경 모드가 아닐 때만 표시 */}
                    {!isReordering && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteImage(imageUrl);
                        }}
                        disabled={deletingImageUrl === imageUrl}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Delete image ${index + 1}`}
                      >
                        {deletingImageUrl === imageUrl ? (
                          <span className="text-xs">삭제 중...</span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 text-center">Poster {index + 1}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}