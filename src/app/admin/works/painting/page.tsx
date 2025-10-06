'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getS3ImageUrl } from '@/lib/s3';

interface ArtworkMetadata {
  title: string;
  year: string;
  description: string;
}

interface Artwork {
  id: string;
  title: string;
  year: string;
  description: string;
  originalImage: string;
  thumbnailImage?: string; // 기존 호환성
  thumbnailSmall: string;
  thumbnailMedium: string;
  thumbnailLarge: string;
  uploadedAt: string;
}

export default function AdminPaintingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<ArtworkMetadata>({
    title: '',
    year: '',
    description: ''
  });
  const [defaultMetadata, setDefaultMetadata] = useState<ArtworkMetadata>({
    title: 'Untitled',
    year: new Date().getFullYear().toString(),
    description: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadMode, setUploadMode] = useState<'single' | 'multi'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  
  // 작품 목록 관련 상태
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // 수정 관련 상태
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [editForm, setEditForm] = useState<ArtworkMetadata>({
    title: '',
    year: '',
    description: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 필터링 관련 상태
  const [selectedYear, setSelectedYear] = useState<string>('all');

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
        
        // 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadStatus('지원하지 않는 파일 형식입니다. 이미지 파일만 업로드 가능합니다.');
        setSelectedFile(null);
        setPreviewUrl('');
      }
    }
  };

  // 여러 파일 선택 핸들러
  const handleMultiFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => allowedTypes.includes(file.type));
      if (validFiles.length !== files.length) {
        setUploadStatus('일부 파일이 지원하지 않는 형식입니다.');
      }
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        setUploadStatus('');
        
        // 미리보기 생성
        const urls: string[] = [];
        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            urls.push(reader.result as string);
            if (urls.length === validFiles.length) {
              setPreviewUrls([...urls]);
            }
          };
          reader.readAsDataURL(file);
        });
      }
    }
  };

  const handleMetadataChange = (field: keyof ArtworkMetadata, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('파일을 선택해주세요.');
      return;
    }

    if (!metadata.title || !metadata.year) {
      setUploadStatus('제목과 연도는 필수 입력 항목입니다.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('업로드 중...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', metadata.title);
      formData.append('year', metadata.year);
      formData.append('description', metadata.description);

      const response = await fetch('/api/painting/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus('Painting 작품이 성공적으로 업로드되었습니다!');
        // 폼 초기화
        setSelectedFile(null);
        setPreviewUrl('');
        setMetadata({ title: '', year: '', description: '' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // 작품 목록 새로고침
        fetchArtworks();
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
    setPreviewUrl('');
    setUploadStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 여러 파일 업로드 핸들러
  const handleMultiUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus('파일을 선택해주세요.');
      return;
    }

    if (!defaultMetadata.title || !defaultMetadata.year) {
      setUploadStatus('기본 제목과 연도를 입력해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('업로드 중...');

    try {
      const formData = new FormData();
      
      // 여러 파일 추가
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // 기본 메타데이터 추가
      formData.append('defaultTitle', defaultMetadata.title);
      formData.append('defaultYear', defaultMetadata.year);
      formData.append('defaultDescription', defaultMetadata.description);

      const response = await fetch('/api/painting/upload-multi', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus(`${result.uploadedCount}개의 Painting 작품이 성공적으로 업로드되었습니다!`);
        // 폼 초기화
        setSelectedFiles([]);
        setPreviewUrls([]);
        setDefaultMetadata({ 
          title: 'Untitled', 
          year: new Date().getFullYear().toString(), 
          description: '' 
        });
        if (multiFileInputRef.current) {
          multiFileInputRef.current.value = '';
        }
        // 작품 목록 새로고침
        fetchArtworks();
      } else {
        setUploadStatus(`업로드 실패: ${result.error}`);
      }
    } catch (error) {
      setUploadStatus('업로드 중 오류가 발생했습니다.');
      console.error('Multi upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMultiFiles = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setUploadStatus('');
    if (multiFileInputRef.current) {
      multiFileInputRef.current.value = '';
    }
  };

  // 작품 목록 불러오기
  const fetchArtworks = async () => {
    setIsLoadingArtworks(true);
    try {
      const response = await fetch('/api/painting/list');
      const data = await response.json();
      if (data.success) {
        setArtworks(data.works || []);
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error);
    } finally {
      setIsLoadingArtworks(false);
    }
  };

  // 작품 삭제
  const handleDeleteArtwork = async (artworkId: string) => {
    if (!confirm('정말로 이 작품을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(artworkId);
    try {
      const response = await fetch(`/api/painting/delete?id=${encodeURIComponent(artworkId)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('작품이 삭제되었습니다.');
        fetchArtworks(); // 목록 새로고침
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 작품 수정 시작
  const handleStartEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setEditForm({
      title: artwork.title,
      year: artwork.year,
      description: artwork.description || ''
    });
  };

  // 작품 수정 취소
  const handleCancelEdit = () => {
    setEditingArtwork(null);
    setEditForm({ title: '', year: '', description: '' });
  };

  // 작품 수정 저장
  const handleUpdateArtwork = async () => {
    if (!editingArtwork) return;

    if (!editForm.title || !editForm.year) {
      alert('제목과 연도는 필수 입력 항목입니다.');
      return;
    }

    setIsUpdating(true);
    try {
        const response = await fetch('/api/painting/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingArtwork.id,
          title: editForm.title,
          year: editForm.year,
          description: editForm.description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('작품이 수정되었습니다.');
        setEditingArtwork(null);
        setEditForm({ title: '', year: '', description: '' });
        fetchArtworks(); // 목록 새로고침
      } else {
        alert(`수정 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 필터링된 작품 목록
  const filteredArtworks = selectedYear === 'all' 
    ? artworks 
    : artworks.filter(artwork => artwork.year === selectedYear);

  // 연도별로 작품 그룹핑 (필터링된 작품 기준)
  const groupedArtworks = filteredArtworks.reduce((acc, artwork) => {
    const year = parseInt(artwork.year);
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(artwork);
    return acc;
  }, {} as Record<number, Artwork[]>);

  // 연도를 내림차순으로 정렬
  const sortedYears = Object.keys(groupedArtworks)
    .map(Number)
    .sort((a, b) => b - a);

  // 사용 가능한 연도 목록 (모든 작품 기준)
  const availableYears = Array.from(new Set(artworks.map(artwork => parseInt(artwork.year))))
    .sort((a, b) => b - a);

  // 컴포넌트 마운트 시 작품 목록 불러오기
  useEffect(() => {
    fetchArtworks();
  }, []);

  return (
    <div className="w-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin - Painting 관리</h1>
        
        {/* 작품 업로드 섹션 */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Painting 작품 업로드</h2>
          
          {/* 업로드 모드 선택 */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setUploadMode('single')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  uploadMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                단일 업로드
              </button>
              <button
                onClick={() => setUploadMode('multi')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  uploadMode === 'multi'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                여러 파일 업로드
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* 단일 업로드 */}
            {uploadMode === 'single' && (
              <>
                {/* 파일 선택 */}
                <div>
                  <label htmlFor="artwork-image" className="block text-sm font-medium text-gray-700 mb-2">
                    작품 이미지 선택
                  </label>
                  <input
                    id="artwork-image"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    지원 형식: 모든 이미지 파일 (JPG, PNG, WebP, GIF, BMP, SVG, TIFF 등)
                  </p>
                </div>

            {/* 미리보기 */}
            {previewUrl && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex gap-4">
                  <div className="w-48 h-48 flex-shrink-0 relative">
                    <Image 
                      src={previewUrl} 
                      alt="Preview" 
                      fill
                      className="object-cover rounded-lg"
                      loading="lazy"
                      sizes="192px"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      선택된 파일: {selectedFile?.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      크기: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB
                    </p>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      제거
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 메타데이터 입력 */}
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-800">작품 정보</h3>
              
              <div>
                <label htmlFor="artwork-title" className="block text-sm font-medium text-gray-700 mb-2">
                  작품 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  id="artwork-title"
                  type="text"
                  value={metadata.title}
                  onChange={(e) => handleMetadataChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="예: 봄날의 풍경"
                />
              </div>

              <div>
                <label htmlFor="artwork-year" className="block text-sm font-medium text-gray-700 mb-2">
                  제작 연도 <span className="text-red-500">*</span>
                </label>
                <input
                  id="artwork-year"
                  type="number"
                  min="1900"
                  max="2030"
                  value={metadata.year}
                  onChange={(e) => handleMetadataChange('year', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="예: 2024"
                />
              </div>

              <div>
                <label htmlFor="artwork-description" className="block text-sm font-medium text-gray-700 mb-2">
                  작품 설명
                </label>
                <textarea
                  id="artwork-description"
                  value={metadata.description}
                  onChange={(e) => handleMetadataChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="작품에 대한 설명을 입력하세요..."
                />
              </div>
            </div>

            {/* 업로드 버튼 */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || !metadata.title || !metadata.year}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                {isUploading ? '업로드 중...' : '작품 업로드'}
              </button>
            </div>

            {/* 상태 메시지 */}
            {uploadStatus && (
              <div className={`p-3 rounded-md ${getStatusClassName(uploadStatus)}`}>
                {uploadStatus}
              </div>
            )}
              </>
            )}

            {/* 여러 파일 업로드 */}
            {uploadMode === 'multi' && (
              <>
                {/* 여러 파일 선택 */}
                <div>
                  <label htmlFor="multi-artwork-images" className="block text-sm font-medium text-gray-700 mb-2">
                    작품 이미지들 선택 (여러 개)
                  </label>
                  <input
                    id="multi-artwork-images"
                    ref={multiFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultiFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    여러 파일을 동시에 선택할 수 있습니다. 지원 형식: 모든 이미지 파일
                  </p>
                </div>

                {/* 여러 파일 미리보기 */}
                {previewUrls.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <Image 
                            src={url} 
                            alt={`Preview ${index + 1}`} 
                            width={128}
                            height={128}
                            className="w-full h-32 object-cover rounded-lg"
                            loading="lazy"
                            sizes="128px"
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        선택된 파일: {selectedFiles.length}개
                      </p>
                      <button
                        onClick={handleRemoveMultiFiles}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        모두 제거
                      </button>
                    </div>
                  </div>
                )}

                {/* 기본 메타데이터 입력 */}
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-800">기본 작품 정보</h3>
                  <p className="text-sm text-gray-600">
                    모든 작품에 적용될 기본 정보입니다. 개별 작품은 업로드 후 수정할 수 있습니다.
                  </p>
                  
                  <div>
                    <label htmlFor="default-title" className="block text-sm font-medium text-gray-700 mb-2">
                      기본 제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="default-title"
                      type="text"
                      value={defaultMetadata.title}
                      onChange={(e) => setDefaultMetadata(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="예: 봄날의 풍경"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      여러 파일인 경우 &quot;봄날의 풍경 1&quot;, &quot;봄날의 풍경 2&quot; 형태로 자동 번호가 추가됩니다.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="default-year" className="block text-sm font-medium text-gray-700 mb-2">
                      제작 연도 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="default-year"
                      type="number"
                      min="1900"
                      max="2030"
                      value={defaultMetadata.year}
                      onChange={(e) => setDefaultMetadata(prev => ({ ...prev, year: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="예: 2024"
                    />
                  </div>

                  <div>
                    <label htmlFor="default-description" className="block text-sm font-medium text-gray-700 mb-2">
                      기본 설명
                    </label>
                    <textarea
                      id="default-description"
                      value={defaultMetadata.description}
                      onChange={(e) => setDefaultMetadata(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="모든 작품에 적용될 기본 설명..."
                    />
                  </div>
                </div>

                {/* 여러 파일 업로드 버튼 */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleMultiUpload}
                    disabled={selectedFiles.length === 0 || isUploading || !defaultMetadata.title || !defaultMetadata.year}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                  >
                    {isUploading ? '업로드 중...' : `${selectedFiles.length}개 작품 업로드`}
                  </button>
                </div>

                {/* 상태 메시지 */}
                {uploadStatus && (
                  <div className={`p-3 rounded-md ${getStatusClassName(uploadStatus)}`}>
                    {uploadStatus}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 작품 목록 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">업로드된 Painting 작품 목록</h2>
            
            {/* 연도 필터 */}
            <div className="flex items-center gap-2">
              <label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
                연도별 필터:
              </label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="all">전체 ({artworks.length}개)</option>
                {availableYears.map(year => (
                  <option key={year} value={year.toString()}>
                    {year}년 ({artworks.filter(artwork => artwork.year === year.toString()).length}개)
                  </option>
                ))}
              </select>
            </div>
          </div>
          

          {!isLoadingArtworks && filteredArtworks.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                {selectedYear === 'all' 
                  ? '아직 업로드된 Painting 작품이 없습니다.' 
                  : `${selectedYear}년에 해당하는 Painting 작품이 없습니다.`}
              </p>
            </div>
          )}

          {!isLoadingArtworks && filteredArtworks.length > 0 && (
            <div className="space-y-8">
              {sortedYears.map((year) => (
                <div key={year} className="space-y-4">
                  {/* 연도 헤더 */}
                  <div className="flex items-center mb-6">
                    <div className="w-3 h-3 rounded-full bg-blue-600 mr-3"></div>
                    <h3 className="text-2xl font-bold text-gray-900">{year}</h3>
                    <div className="flex-1 h-px bg-gray-300 ml-4"></div>
                  </div>

                  {/* 해당 연도의 작품들 */}
                  {groupedArtworks[year].map((artwork) => (
                <div 
                  key={artwork.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingArtwork?.id === artwork.id ? (
                    // 수정 모드
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-32 h-32 flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={getS3ImageUrl(artwork.thumbnailSmall || artwork.thumbnailImage || artwork.originalImage)}
                            alt={artwork.title}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <label htmlFor={`edit-title-${artwork.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                              제목 <span className="text-red-500">*</span>
                            </label>
                            <input
                              id={`edit-title-${artwork.id}`}
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-year-${artwork.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                              연도 <span className="text-red-500">*</span>
                            </label>
                            <input
                              id={`edit-year-${artwork.id}`}
                              type="number"
                              min="1900"
                              max="2030"
                              value={editForm.year}
                              onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              placeholder="예: 2024"
                            />
                          </div>
                          <div>
                            <label htmlFor={`edit-desc-${artwork.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                              설명
                            </label>
                            <textarea
                              id={`edit-desc-${artwork.id}`}
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleUpdateArtwork}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                        >
                          {isUpdating ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 일반 모드
                    <div className="flex gap-4">
                      {/* 썸네일 */}
                      <div className="w-32 h-32 flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={getS3ImageUrl(artwork.thumbnailSmall || artwork.thumbnailImage || artwork.originalImage)}
                          alt={artwork.title}
                          fill
                          className="object-cover"
                          sizes="128px"
                        />
                      </div>

                      {/* 작품 정보 */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {artwork.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          제작 연도: {artwork.year}년
                        </p>
                        {artwork.description && (
                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                            {artwork.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          업로드: {new Date(artwork.uploadedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleStartEdit(artwork)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-all"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteArtwork(artwork.id)}
                          disabled={deletingId === artwork.id}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                        >
                          {deletingId === artwork.id ? '삭제 중...' : '삭제'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
