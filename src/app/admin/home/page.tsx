'use client';

import { useState, useRef } from 'react';
// Admin doesn't use background context

export default function AdminHomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Admin doesn't need background refresh functionality

  const getStatusClassName = (status: string) => {
    if (status.includes('성공')) {
      return 'bg-green-50 text-green-700 border border-green-200';
    }
    if (status.includes('실패') || status.includes('오류')) {
      return 'bg-red-50 text-red-700 border border-red-200';
    }
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  };

  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/svg+xml',
    'image/tiff'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setUploadStatus('');
      } else {
        setUploadStatus('지원하지 않는 파일 형식입니다. 이미지 파일만 업로드 가능합니다.');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('업로드 중...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('folder', 'Home/Background');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('배경화면이 성공적으로 업로드되었습니다! 배경을 새로고침합니다...');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // 배경 업로드 완료
        setTimeout(() => {
          setUploadStatus('배경화면이 업데이트되었습니다!');
        }, 1000);
      } else {
        setUploadStatus(`업로드 실패: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus('업로드 중 오류가 발생했습니다.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full h-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full h-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin - Home 관리</h1>
        
        {/* 배경화면 업로드 섹션 */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">배경화면 관리</h2>
          
          <div className="space-y-4">
            {/* 파일 선택 */}
            <div>
              <label htmlFor="background-image" className="block text-sm font-medium text-gray-700 mb-2">
                배경화면 이미지 선택
              </label>
              <input
                id="background-image"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                지원 형식: 모든 이미지 파일 (JPG, PNG, WebP, GIF, BMP, SVG, TIFF 등)
              </p>
            </div>

            {/* 선택된 파일 정보 */}
            {selectedFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      선택된 파일: {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-gray-500">
                      업로드될 이름: background.{selectedFile.name.split('.').pop()}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    제거
                  </button>
                </div>
              </div>
            )}

            {/* 업로드 버튼 */}
            <div className="flex gap-4">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {isUploading ? '업로드 중...' : '배경화면 업로드'}
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-all"
              >
                페이지 새로고침
              </button>
            </div>

            {/* 상태 메시지 */}
            {uploadStatus && (
              <div className={`p-3 rounded-md ${getStatusClassName(uploadStatus)}`}>
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* 현재 설정 정보 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">현재 설정</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">배경 이미지 경로</p>
                <p className="text-sm text-gray-500">Home/Background/background.*</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">업로드 대상</p>
                <p className="text-sm text-gray-500">AWS S3 Bucket</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}