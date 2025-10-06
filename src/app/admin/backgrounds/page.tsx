'use client';

import { useState, useRef, useEffect } from 'react';

const backgroundTabs = [
  { id: 'Home', name: 'Home', folder: 'Home' },
  { id: 'Works', name: 'Works', folder: 'Works' },
  { id: 'Painting', name: 'Painting', folder: 'Painting' },
  { id: 'Drawing', name: 'Drawing', folder: 'Drawing' },
  { id: 'Exhibitions', name: 'Exhibitions', folder: 'Exhibitions' },
  { id: 'Text', name: 'Text', folder: 'Text' },
  { id: 'CV', name: 'CV', folder: 'CV' },
  { id: 'Contact', name: 'Contact', folder: 'Contact' },
];

export default function AdminBackgroundsPage() {
  const [selectedTab, setSelectedTab] = useState('Home');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [currentBackgroundUrl, setCurrentBackgroundUrl] = useState<string>('');
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 현재 선택된 탭의 배경 이미지 로드
  useEffect(() => {
    const loadCurrentBackground = async () => {
      setIsLoadingBackground(true);
      try {
        const currentTabData = backgroundTabs.find(tab => tab.id === selectedTab);
        const folder = currentTabData?.folder || 'Home';
        console.log('Loading background for folder:', folder);
        
        const response = await fetch(`/api/background?folder=${folder}&v=${Date.now()}`);
        const data = await response.json();
        
        console.log('Background API response:', data);
        
        if (data.success && data.imageUrl) {
          setCurrentBackgroundUrl(data.imageUrl);
        } else {
          console.log('No background image found for folder:', folder);
          setCurrentBackgroundUrl('');
        }
      } catch (error) {
        console.error('Failed to load current background:', error);
        setCurrentBackgroundUrl('');
      } finally {
        setIsLoadingBackground(false);
      }
    };

    loadCurrentBackground();
  }, [selectedTab]);

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
      formData.append('folder', `${backgroundTabs.find(tab => tab.id === selectedTab)?.folder || 'Home'}/Background`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus(`${selectedTab} 배경화면이 성공적으로 업로드되었습니다!`);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // 업로드 성공 후 현재 배경 이미지 새로고침
        const folder = backgroundTabs.find(tab => tab.id === selectedTab)?.folder || 'Home';
        const refreshResponse = await fetch(`/api/background?folder=${folder}&v=${Date.now()}`);
        const refreshData = await refreshResponse.json();
        if (refreshData.success && refreshData.imageUrl) {
          setCurrentBackgroundUrl(refreshData.imageUrl);
        }
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

  const currentTab = backgroundTabs.find(tab => tab.id === selectedTab);

  return (
    <div className="w-full h-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full h-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin - 배경화면 관리</h1>
        
        {/* 탭 선택 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {backgroundTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  setSelectedFile(null);
                  setUploadStatus('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* 현재 선택된 탭 정보 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {currentTab?.name} 배경화면 관리
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">배경 이미지 경로</p>
                <p className="text-sm text-gray-500">{currentTab?.folder}/Background/background.*</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">업로드 대상</p>
                <p className="text-sm text-gray-500">AWS S3 Bucket</p>
              </div>
            </div>
          </div>
        </div>

        {/* 배경화면 관리 섹션 - 미리보기와 업로드를 같은 라인에 */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">배경화면 관리</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 현재 배경 이미지 미리보기 */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">현재 배경 이미지</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {isLoadingBackground ? (
                  <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                    <div className="text-gray-500">로딩 중...</div>
                  </div>
                ) : currentBackgroundUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={currentBackgroundUrl}
                        alt={`${currentTab?.name} 배경 이미지`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>현재 설정된 배경 이미지 미리보기입니다.</p>
                      <p className="text-xs text-gray-500 mt-1">
                        원본 비율 유지, 전체 이미지 표시
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <div className="text-lg mb-2">📷</div>
                      <p>배경 이미지가 설정되지 않았습니다.</p>
                      <p className="text-sm mt-1">오른쪽에서 새 이미지를 업로드하세요.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 배경화면 업로드 섹션 */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-4">새 배경화면 업로드</h4>
              
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
                    {isUploading ? '업로드 중...' : `${currentTab?.name} 배경화면 업로드`}
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
          </div>
        </div>

        {/* 사용법 안내 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">사용법 안내</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• 각 탭별로 다른 배경 이미지를 설정할 수 있습니다.</li>
              <li>• Home: 홈페이지 배경</li>
              <li>• Works: Works 메인 페이지 배경</li>
              <li>• Painting: Painting 페이지 배경</li>
              <li>• Drawing: Drawing 페이지 배경</li>
              <li>• Exhibitions: 전시회 페이지 배경</li>
              <li>• Text: 텍스트 페이지 배경</li>
              <li>• CV: CV 페이지 배경</li>
              <li>• Contact: 연락처 페이지 배경</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
