'use client';

import { useState, useEffect } from 'react';

interface TextPost {
  id: string;
  title: string;
  pdfUrl: string;
  uploadedAt: string;
}

interface TextMetadata {
  title: string;
}

export default function AdminTextPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<TextMetadata>({
    title: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [texts, setTexts] = useState<TextPost[]>([]);
  const [isLoadingTexts, setIsLoadingTexts] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // PDF 파일인지 확인
      if (file.type !== 'application/pdf') {
        alert('PDF 파일만 업로드 가능합니다.');
        return;
      }
      setSelectedFile(file);
      setUploadStatus('');
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !metadata.title.trim()) {
      alert('파일과 제목을 모두 입력해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('업로드 중...');

    try {
      // 1. Presigned URL 요청
      const presignedResponse = await fetch('/api/text/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          title: metadata.title,
        }),
      });

      const presignedResult = await presignedResponse.json();

      if (!presignedResult.success) {
        throw new Error(presignedResult.error);
      }

      // 2. S3에 직접 업로드
      const uploadResponse = await fetch(presignedResult.presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 업로드에 실패했습니다.');
      }

      // 3. 메타데이터 업데이트
      const metadataResponse = await fetch('/api/text/update-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textId: presignedResult.textId,
          title: metadata.title,
          s3Key: presignedResult.s3Key,
        }),
      });

      const metadataResult = await metadataResponse.json();

      if (metadataResult.success) {
        setUploadStatus('텍스트가 성공적으로 업로드되었습니다!');
        setSelectedFile(null);
        setMetadata({ title: '' });
        
        // 파일 입력 초기화
        const fileInput = document.getElementById('pdf-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        // 텍스트 목록 새로고침
        fetchTexts();
      } else {
        setUploadStatus(`업로드 실패: ${metadataResult.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 텍스트 목록 불러오기
  const fetchTexts = async () => {
    setIsLoadingTexts(true);
    try {
      const response = await fetch('/api/text/list');
      const data = await response.json();
      if (data.success) {
        setTexts(data.texts || []);
      }
    } catch (error) {
      console.error('Error fetching texts:', error);
    } finally {
      setIsLoadingTexts(false);
    }
  };

  // 텍스트 삭제
  const handleDeleteText = async (textId: string, title: string) => {
    if (!confirm(`정말로 "${title}" 텍스트를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingId(textId);
    try {
      const response = await fetch(`/api/text/delete?id=${encodeURIComponent(textId)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('텍스트가 삭제되었습니다.');
        fetchTexts(); // 목록 새로고침
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

  // 컴포넌트 마운트 시 텍스트 목록 불러오기
  useEffect(() => {
    fetchTexts();
  }, []);

  return (
    <div className="w-full h-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 h-full">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-8">Admin - Text 관리</h1>
        
        {/* 텍스트 업로드 섹션 */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">텍스트 업로드</h2>
          
          {/* 파일 선택 */}
          <div className="mb-6">
            <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-700 mb-2">
              PDF 파일 선택
            </label>
            <input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                선택된 파일: {selectedFile.name}
              </p>
            )}
          </div>

          {/* 제목 입력 */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              텍스트 제목 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={metadata.title}
              onChange={handleMetadataChange}
              placeholder="텍스트 제목을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              required
            />
          </div>

          {/* 업로드 버튼 */}
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !metadata.title.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? '업로드 중...' : '텍스트 업로드'}
          </button>

          {/* 업로드 상태 */}
          {uploadStatus && (
            <div className={`mt-4 p-3 rounded-md ${
              uploadStatus.includes('성공') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : uploadStatus.includes('실패') || uploadStatus.includes('오류')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* 업로드된 텍스트 목록 섹션 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">업로드된 텍스트 목록</h2>
          
          {isLoadingTexts ? (
            <div className="text-center py-8">
              <p className="mt-2 text-gray-600">텍스트 목록을 불러오는 중...</p>
            </div>
          ) : texts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">아직 업로드된 텍스트가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {texts.map((text) => (
                <div
                  key={text.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {text.title}
                      </h3>
                      <div className="text-sm text-gray-500">
                        업로드: {new Date(text.uploadedAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteText(text.id, text.title)}
                        disabled={deletingId === text.id}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {deletingId === text.id ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}