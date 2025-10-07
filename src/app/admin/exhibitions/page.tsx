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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 사진 펼치기 상태
  const [expandedPhotos, setExpandedPhotos] = useState<Set<string>>(new Set());
  
  // 사진 순서 변경 상태
  const [reorderingExhibition, setReorderingExhibition] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [originalPhotos, setOriginalPhotos] = useState<Record<string, string[]>>({});

  // 사진 순서 변경 시작
  const startReorder = (exhibitionId: string) => {
    const exhibition = exhibitions.find(e => e.id === exhibitionId);
    if (exhibition) {
      // 원래 순서 저장
      setOriginalPhotos(prev => ({
        ...prev,
        [exhibitionId]: [...exhibition.photos]
      }));
    }
    setReorderingExhibition(exhibitionId);
    setSelectedPhotoIndex(null);
  };

  // 사진 순서 변경 취소
  const cancelReorder = () => {
    if (reorderingExhibition) {
      // 원래 순서로 복원
      setExhibitions(prev => 
        prev.map(e => 
          e.id === reorderingExhibition 
            ? { ...e, photos: originalPhotos[reorderingExhibition] || e.photos }
            : e
        )
      );
    }
    setReorderingExhibition(null);
    setSelectedPhotoIndex(null);
  };

  // 사진 순서를 서버에 저장하는 함수
  const savePhotoOrder = async (exhibitionId: string, photoKeys: string[]) => {
    try {
      const response = await fetch('/api/exhibitions/reorder-photos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exhibitionId,
          photoKeys,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to save photo order:', result.error);
        // 실패 시 원래 상태로 복원
        fetchExhibitions();
      }
    } catch (error) {
      console.error('Save photo order error:', error);
      // 에러 시 원래 상태로 복원
      fetchExhibitions();
    }
  };

  // 사진 순서 변경 (왼쪽/오른쪽 이동) - 로컬에서만 변경
  const movePhoto = (exhibitionId: string, photoIndex: number, direction: 'left' | 'right') => {
    const exhibition = exhibitions.find(e => e.id === exhibitionId);
    if (!exhibition || photoIndex < 0 || photoIndex >= exhibition.photos.length) return;

    const newIndex = direction === 'left' ? photoIndex - 1 : photoIndex + 1;
    if (newIndex < 0 || newIndex >= exhibition.photos.length) return;

    const newPhotos = [...exhibition.photos];
    [newPhotos[photoIndex], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[photoIndex]];

    // 로컬 상태만 업데이트 (서버 저장은 완료 버튼에서)
    setExhibitions(prev => 
      prev.map(e => 
        e.id === exhibitionId 
          ? { ...e, photos: newPhotos }
          : e
      )
    );

    // 선택된 인덱스 업데이트
    setSelectedPhotoIndex(newIndex);
  };

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

  // 이미지를 썸네일로 리사이즈하는 함수
  const resizeImageToThumbnail = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();

      img.onload = () => {
        if (ctx) {
          // 이미지 비율을 유지하면서 크기만 줄이기
          const maxSize = 600;
          
          let { width, height } = img;
          
          // 비율을 유지하면서 최대 크기에 맞춤
          if (width > maxSize || height > maxSize) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = maxSize;
              height = width / aspectRatio;
            } else {
              height = maxSize;
              width = height * aspectRatio;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // 이미지를 비율 유지하면서 그리기
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(thumbnailFile);
            } else {
              reject(new Error('Canvas to blob conversion failed'));
            }
          }, 'image/jpeg', 0.9);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      img.onerror = () => reject(new Error('Image loading failed'));
      img.src = URL.createObjectURL(file);
    });
  };

  // 다중 사진 업로드
  const handleMultiPhotoUpload = async (exhibitionId: string) => {
    if (selectedFiles.length === 0) {
      setUploadStatus('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('썸네일 생성 및 업로드 중...');

    try {
      // 1. 썸네일 생성
      console.log('Exhibition 썸네일 생성 시작');
      const thumbnailPromises = selectedFiles.map(file => resizeImageToThumbnail(file));
      const thumbnailFiles = await Promise.all(thumbnailPromises);
      
      console.log('Exhibition 썸네일 생성 완료:', {
        originalCount: selectedFiles.length,
        thumbnailCount: thumbnailFiles.length,
        originalSizes: selectedFiles.map(f => f.size),
        thumbnailSizes: thumbnailFiles.map(f => f.size)
      });

      // 2. Presigned URLs 요청
      const files = selectedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));

      console.log('Exhibition 업로드 시작:', { files, exhibitionId });

      const presignedResponse = await fetch('/api/exhibitions/presigned-url-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          exhibitionId,
        }),
      });

      const presignedResult = await presignedResponse.json();
      console.log('Presigned URL 응답:', presignedResult);

      if (!presignedResult.success) {
        throw new Error(presignedResult.error);
      }

      // 3. 각 파일을 S3에 직접 업로드 (원본 + 썸네일)
      const uploadPromises = presignedResult.presignedUrls.map(async (presignedData: { originalPresignedUrl: string; thumbnailPresignedUrl: string; originalKey: string; thumbnailKey: string }, index: number) => {
        const originalFile = selectedFiles[index];
        const thumbnailFile = thumbnailFiles[index];
        
        console.log(`파일 ${index + 1} 업로드 시작:`, { 
          fileName: originalFile.name, 
          originalSize: originalFile.size,
          thumbnailSize: thumbnailFile.size,
          originalUrl: presignedData.originalPresignedUrl,
          thumbnailUrl: presignedData.thumbnailPresignedUrl 
        });
        
        // 원본 이미지 업로드
        const originalUploadResponse = await fetch(presignedData.originalPresignedUrl, {
          method: 'PUT',
          body: originalFile,
          headers: {
            'Content-Type': originalFile.type,
          },
        });

        console.log(`파일 ${index + 1} 원본 업로드 응답:`, { status: originalUploadResponse.status, ok: originalUploadResponse.ok });

        if (!originalUploadResponse.ok) {
          const errorText = await originalUploadResponse.text();
          console.error(`파일 ${originalFile.name} 원본 업로드 실패:`, errorText);
          throw new Error(`파일 ${originalFile.name} 원본 업로드 실패: ${originalUploadResponse.status} ${errorText}`);
        }

        // 썸네일 이미지 업로드 (Canvas로 생성된 썸네일 사용)
        const thumbnailUploadResponse = await fetch(presignedData.thumbnailPresignedUrl, {
          method: 'PUT',
          body: thumbnailFile,
          headers: {
            'Content-Type': thumbnailFile.type,
          },
        });

        console.log(`파일 ${index + 1} 썸네일 업로드 응답:`, { status: thumbnailUploadResponse.status, ok: thumbnailUploadResponse.ok });

        if (!thumbnailUploadResponse.ok) {
          const errorText = await thumbnailUploadResponse.text();
          console.error(`파일 ${originalFile.name} 썸네일 업로드 실패:`, errorText);
          throw new Error(`파일 ${originalFile.name} 썸네일 업로드 실패: ${thumbnailUploadResponse.status} ${errorText}`);
        }

        return {
          s3Key: presignedData.originalKey,
          thumbnailKey: presignedData.thumbnailKey,
        };
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      console.log('모든 파일 업로드 완료:', uploadedPhotos);

      // 4. 메타데이터 업데이트
      console.log('메타데이터 업데이트 요청:', { exhibitionId, photos: uploadedPhotos });
      
      const metadataResponse = await fetch('/api/exhibitions/update-photos-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exhibitionId,
          photos: uploadedPhotos,
        }),
      });

      const metadataResult = await metadataResponse.json();
      console.log('메타데이터 업데이트 응답:', metadataResult);

      if (metadataResult.success) {
        setUploadStatus(metadataResult.message);
        setSelectedFiles([]);
        setPreviewUrls([]);
        setSelectedExhibitionId(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchExhibitions();
      } else {
        throw new Error(metadataResult.error);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, exhibitionId: string) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setSelectedExhibitionId(exhibitionId);
    
    // 미리보기 URL 생성
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  // 선택된 파일들 제거
  const handleRemoveFiles = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setSelectedExhibitionId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  // 전시 수정 상태
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    description: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // 전시 수정 시작
  const handleStartEdit = (exhibition: Exhibition) => {
    setEditingExhibition(exhibition);
    setEditForm({
      title: exhibition.title,
      startDate: exhibition.startDate,
      endDate: exhibition.endDate,
      location: exhibition.location,
      description: exhibition.description || '',
    });
  };

  // 전시 수정 취소
  const handleCancelEdit = () => {
    setEditingExhibition(null);
    setEditForm({
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      description: '',
    });
  };

  // 전시 수정 저장
  const handleUpdateExhibition = async () => {
    if (!editingExhibition) return;

    if (!editForm.title || !editForm.startDate || !editForm.endDate || !editForm.location) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/exhibitions/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingExhibition.id,
          title: editForm.title,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          location: editForm.location,
          description: editForm.description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('전시가 수정되었습니다.');
        setEditingExhibition(null);
        setEditForm({
          title: '',
          startDate: '',
          endDate: '',
          location: '',
          description: '',
        });
        fetchExhibitions();
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

  // 사진 펼치기/접기 함수
  const togglePhotoExpansion = (exhibitionId: string) => {
    setExpandedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exhibitionId)) {
        newSet.delete(exhibitionId);
      } else {
        newSet.add(exhibitionId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchExhibitions();
  }, []);

  return (
    <div className="w-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Admin - Exhibitions 관리</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-red-700 transition-all text-sm sm:text-base w-full sm:w-auto"
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
        {!isLoading && exhibitions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            아직 등록된 전시가 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {exhibitions.map((exhibition) => (
              <div key={exhibition.id} className="border border-gray-200 rounded-lg p-6">
                {editingExhibition?.id === exhibition.id ? (
                  // 수정 모드
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">전시 수정</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`edit-title-${exhibition.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          전시명 <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`edit-title-${exhibition.id}`}
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`edit-start-${exhibition.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            시작 날짜 <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`edit-start-${exhibition.id}`}
                            type="date"
                            value={editForm.startDate}
                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                        <div>
                          <label htmlFor={`edit-end-${exhibition.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            종료 날짜 <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`edit-end-${exhibition.id}`}
                            type="date"
                            value={editForm.endDate}
                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor={`edit-location-${exhibition.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          장소 <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`edit-location-${exhibition.id}`}
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                        />
                      </div>

                      <div>
                        <label htmlFor={`edit-desc-${exhibition.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          설명
                        </label>
                        <textarea
                          id={`edit-desc-${exhibition.id}`}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                        />
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
                        onClick={handleUpdateExhibition}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                      >
                        {isUpdating ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // 일반 모드
                  <div className="mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{exhibition.title}</h3>
                      <div className="flex gap-2 justify-center sm:justify-end">
                        <button
                          onClick={() => handleStartEdit(exhibition)}
                          className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-all"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteExhibition(exhibition.id, exhibition.title)}
                          className="px-3 sm:px-4 py-2 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700 transition-all"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <p>📅 {new Date(exhibition.startDate).toLocaleDateString('ko-KR')} - {new Date(exhibition.endDate).toLocaleDateString('ko-KR')}</p>
                      <p>📍 {exhibition.location}</p>
                      {exhibition.description && (
                        <p className="text-gray-700 mt-2">{exhibition.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 사진 업로드 */}
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">사진 추가 (여러 장 선택 가능)</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        ref={selectedExhibitionId === exhibition.id ? fileInputRef : null}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileSelect(e, exhibition.id)}
                        className="flex-1 text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      />
                      {selectedFiles.length > 0 && selectedExhibitionId === exhibition.id && (
                        <button
                          onClick={handleRemoveFiles}
                          className="px-3 py-2 bg-gray-500 text-white text-xs sm:text-sm rounded-md hover:bg-gray-600 transition-all"
                        >
                          취소
                        </button>
                      )}
                    </div>
                    
                    {/* 선택된 파일 미리보기 */}
                    {selectedFiles.length > 0 && selectedExhibitionId === exhibition.id && (
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm text-gray-600">
                          선택된 파일: {selectedFiles.length}개
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {previewUrls.map((url, index) => (
                            <div key={index} className="relative">
                              <Image
                                src={url}
                                alt={`Preview ${index + 1}`}
                                width={80}
                                height={80}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-center sm:justify-start">
                      <button
                        onClick={() => handleMultiPhotoUpload(exhibition.id)}
                        disabled={selectedFiles.length === 0 || selectedExhibitionId !== exhibition.id || isUploading}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                      >
                        {isUploading && selectedExhibitionId === exhibition.id ? '업로드 중...' : `${selectedFiles.length > 0 ? `${selectedFiles.length}개 ` : ''}업로드`}
                      </button>
                    </div>
                  </div>
                  {uploadStatus && selectedExhibitionId === exhibition.id && (
                    <p className="text-xs sm:text-sm mt-2 text-gray-600">{uploadStatus}</p>
                  )}
                </div>

                {/* 사진 목록 */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700">
                      전시 사진 ({exhibition.photos.length})
                    </h4>
                    {exhibition.photos.length > 1 && (
                      <div className="flex gap-2 justify-center sm:justify-end">
                        {reorderingExhibition === exhibition.id ? (
                          <>
                            <button
                              onClick={cancelReorder}
                              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-all"
                            >
                              취소
                            </button>
                            <button
                              onClick={() => {
                                // 서버에 최종 순서 저장
                                const exhibition = exhibitions.find(e => e.id === reorderingExhibition);
                                if (exhibition) {
                                  savePhotoOrder(exhibition.id, exhibition.photos);
                                }
                                setReorderingExhibition(null);
                                setSelectedPhotoIndex(null);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-all"
                            >
                              완료
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startReorder(exhibition.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-all"
                          >
                            순서 변경
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {exhibition.photos.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500">아직 업로드된 사진이 없습니다.</p>
                  ) : (
                    <div className="relative">
                      <div className={`grid gap-2 sm:gap-4 ${
                        expandedPhotos.has(exhibition.id) 
                          ? 'grid-cols-4' 
                          : 'grid-cols-4'
                      }`}>
                        {expandedPhotos.has(exhibition.id) 
                          ? exhibition.photos.map((photoUrl, index) => (
                              <div key={index} className="relative group">
                                <div className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 ${
                                  reorderingExhibition === exhibition.id && selectedPhotoIndex === index
                                    ? 'ring-2 ring-blue-500'
                                    : ''
                                }`}>
                                  <Image
                                    src={photoUrl}
                                    alt={`${exhibition.title} photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 33vw, 25vw"
                                  />
                                  
                                  {/* 순서 변경 모드에서 사진 선택 */}
                                  {reorderingExhibition === exhibition.id && (
                                    <button
                                      onClick={() => setSelectedPhotoIndex(selectedPhotoIndex === index ? null : index)}
                                      className={`absolute inset-0 flex items-center justify-center ${
                                        selectedPhotoIndex === index
                                          ? 'bg-blue-500/50'
                                          : 'bg-black/0 hover:bg-black/20'
                                      } transition-all`}
                                    >
                                      {selectedPhotoIndex === index && (
                                        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                                          선택됨
                                        </div>
                                      )}
                                    </button>
                                  )}
                                </div>
                                
                                {/* 순서 변경 버튼들 */}
                                {reorderingExhibition === exhibition.id && selectedPhotoIndex === index && (
                                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => movePhoto(exhibition.id, index, 'left')}
                                      disabled={index === 0}
                                      className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                      ←
                                    </button>
                                    <button
                                      onClick={() => movePhoto(exhibition.id, index, 'right')}
                                      disabled={index === exhibition.photos.length - 1}
                                      className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                      →
                                    </button>
                                  </div>
                                )}
                                
                                {/* 삭제 버튼 - 순서 변경 모드가 아닐 때만 표시 */}
                                {reorderingExhibition !== exhibition.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePhoto(exhibition.id, photoUrl);
                                    }}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                    aria-label="Delete photo"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))
                          : exhibition.photos.slice(0, 4).map((photoUrl, index) => (
                              <div key={index} className="relative group">
                                <div className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 ${
                                  reorderingExhibition === exhibition.id && selectedPhotoIndex === index
                                    ? 'ring-2 ring-blue-500'
                                    : ''
                                }`}>
                                  <Image
                                    src={photoUrl}
                                    alt={`${exhibition.title} photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 25vw, (max-width: 768px) 33vw, 25vw"
                                  />
                                  
                                  {/* 순서 변경 모드에서 사진 선택 */}
                                  {reorderingExhibition === exhibition.id && (
                                    <button
                                      onClick={() => setSelectedPhotoIndex(selectedPhotoIndex === index ? null : index)}
                                      className={`absolute inset-0 flex items-center justify-center ${
                                        selectedPhotoIndex === index
                                          ? 'bg-blue-500/50'
                                          : 'bg-black/0 hover:bg-black/20'
                                      } transition-all`}
                                    >
                                      {selectedPhotoIndex === index && (
                                        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                                          선택됨
                                        </div>
                                      )}
                                    </button>
                                  )}
                                </div>
                                
                                {/* 순서 변경 버튼들 */}
                                {reorderingExhibition === exhibition.id && selectedPhotoIndex === index && (
                                  <div className="absolute inset-0 flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => movePhoto(exhibition.id, index, 'left')}
                                      disabled={index === 0}
                                      className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                      ←
                                    </button>
                                    <button
                                      onClick={() => movePhoto(exhibition.id, index, 'right')}
                                      disabled={index === exhibition.photos.length - 1}
                                      className="w-8 h-8 bg-white/90 hover:bg-white text-gray-700 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                      →
                                    </button>
                                  </div>
                                )}
                                
                                {/* 삭제 버튼 - 순서 변경 모드가 아닐 때만 표시 */}
                                {reorderingExhibition !== exhibition.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePhoto(exhibition.id, photoUrl);
                                    }}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                                    aria-label="Delete photo"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))
                        }
                      </div>
                      
                      {/* 더 보기/접기 버튼 */}
                      {exhibition.photos.length > 4 && (
                        <div className="flex justify-center mt-4">
                          <button
                            onClick={() => togglePhotoExpansion(exhibition.id)}
                            className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-all font-medium"
                          >
                            {expandedPhotos.has(exhibition.id) ? '접기' : `더 보기 (+${exhibition.photos.length - 4}개)`}
                          </button>
                        </div>
                      )}
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
