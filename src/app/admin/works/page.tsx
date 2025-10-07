'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminWorksPage() {
  const [selectedPaintingFile, setSelectedPaintingFile] = useState<File | null>(null);
  const [selectedDrawingFile, setSelectedDrawingFile] = useState<File | null>(null);
  const [isUploadingPainting, setIsUploadingPainting] = useState(false);
  const [isUploadingDrawing, setIsUploadingDrawing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [paintingPreviewUrl, setPaintingPreviewUrl] = useState<string>('');
  const [drawingPreviewUrl, setDrawingPreviewUrl] = useState<string>('');
  const paintingFileInputRef = useRef<HTMLInputElement>(null);
  const drawingFileInputRef = useRef<HTMLInputElement>(null);
  const [cardImages, setCardImages] = useState<{painting: string | null, drawing: string | null}>({painting: null, drawing: null});
  const [imageLoadStates, setImageLoadStates] = useState<{painting: boolean, drawing: boolean}>({painting: false, drawing: false});

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

  const handlePaintingFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (allowedTypes.includes(file.type)) {
        setSelectedPaintingFile(file);
        setUploadStatus('');
        
        // 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
          setPaintingPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadStatus('지원하지 않는 파일 형식입니다. 이미지 파일만 업로드 가능합니다.');
        setSelectedPaintingFile(null);
        setPaintingPreviewUrl('');
      }
    }
  };

  const handleDrawingFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (allowedTypes.includes(file.type)) {
        setSelectedDrawingFile(file);
        setUploadStatus('');
        
        // 미리보기 생성
        const reader = new FileReader();
        reader.onloadend = () => {
          setDrawingPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadStatus('지원하지 않는 파일 형식입니다. 이미지 파일만 업로드 가능합니다.');
        setSelectedDrawingFile(null);
        setDrawingPreviewUrl('');
      }
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
          const maxWidth = 600;
          const maxHeight = 800;
          
          let { width, height } = img;
          
          // 비율을 유지하면서 최대 크기에 맞춤
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // 이미지를 비율 유지하면서 그리기
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(resizedFile);
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

  const handlePaintingUpload = async () => {
    if (!selectedPaintingFile) {
      setUploadStatus('Painting 파일을 선택해주세요.');
      return;
    }

    setIsUploadingPainting(true);
    setUploadStatus('Painting 썸네일 생성 및 업로드 중...');

    try {
      // 1. 이미지를 썸네일로 리사이즈
      const thumbnailFile = await resizeImageToThumbnail(selectedPaintingFile);
      console.log('Painting 썸네일 생성 완료:', {
        originalSize: selectedPaintingFile.size,
        thumbnailSize: thumbnailFile.size,
        originalName: selectedPaintingFile.name,
        thumbnailName: thumbnailFile.name
      });

      // 2. Presigned URL 요청
      const presignedResponse = await fetch('/api/works/card-images/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: thumbnailFile.name,
          fileType: thumbnailFile.type,
          type: 'Painting',
        }),
      });

      const presignedResult = await presignedResponse.json();

      if (!presignedResult.success) {
        throw new Error(presignedResult.error);
      }

      // 3. S3에 썸네일 업로드
      const uploadResponse = await fetch(presignedResult.presignedUrl, {
        method: 'PUT',
        body: thumbnailFile,
        headers: {
          'Content-Type': thumbnailFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 업로드에 실패했습니다.');
      }

      setUploadStatus('Painting 카드 이미지가 성공적으로 업로드되었습니다!');
      // 폼 초기화
      setSelectedPaintingFile(null);
      setPaintingPreviewUrl('');
      if (paintingFileInputRef.current) {
        paintingFileInputRef.current.value = '';
      }
      // 카드 이미지 새로고침
      fetchCardImages();

    } catch (error) {
      setUploadStatus(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      console.error('Upload error:', error);
    } finally {
      setIsUploadingPainting(false);
    }
  };

  const handleDrawingUpload = async () => {
    if (!selectedDrawingFile) {
      setUploadStatus('Drawing 파일을 선택해주세요.');
      return;
    }

    setIsUploadingDrawing(true);
    setUploadStatus('Drawing 썸네일 생성 및 업로드 중...');

    try {
      // 1. 이미지를 썸네일로 리사이즈
      const thumbnailFile = await resizeImageToThumbnail(selectedDrawingFile);
      console.log('Drawing 썸네일 생성 완료:', {
        originalSize: selectedDrawingFile.size,
        thumbnailSize: thumbnailFile.size,
        originalName: selectedDrawingFile.name,
        thumbnailName: thumbnailFile.name
      });

      // 2. Presigned URL 요청
      const presignedResponse = await fetch('/api/works/card-images/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: thumbnailFile.name,
          fileType: thumbnailFile.type,
          type: 'Drawing',
        }),
      });

      const presignedResult = await presignedResponse.json();

      if (!presignedResult.success) {
        throw new Error(presignedResult.error);
      }

      // 3. S3에 썸네일 업로드
      const uploadResponse = await fetch(presignedResult.presignedUrl, {
        method: 'PUT',
        body: thumbnailFile,
        headers: {
          'Content-Type': thumbnailFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 업로드에 실패했습니다.');
      }

      setUploadStatus('Drawing 카드 이미지가 성공적으로 업로드되었습니다!');
      // 폼 초기화
      setSelectedDrawingFile(null);
      setDrawingPreviewUrl('');
      if (drawingFileInputRef.current) {
        drawingFileInputRef.current.value = '';
      }
      // 카드 이미지 새로고침
      fetchCardImages();

    } catch (error) {
      setUploadStatus(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      console.error('Upload error:', error);
    } finally {
      setIsUploadingDrawing(false);
    }
  };

  const handleRemovePaintingFile = () => {
    setSelectedPaintingFile(null);
    setPaintingPreviewUrl('');
    setUploadStatus('');
    if (paintingFileInputRef.current) {
      paintingFileInputRef.current.value = '';
    }
  };

  const handleRemoveDrawingFile = () => {
    setSelectedDrawingFile(null);
    setDrawingPreviewUrl('');
    setUploadStatus('');
    if (drawingFileInputRef.current) {
      drawingFileInputRef.current.value = '';
    }
  };

  // 카드 이미지 불러오기
  const fetchCardImages = async () => {
    try {
      const response = await fetch('/api/works/card-images/get');
      const data = await response.json();
      if (data.success) {
        setCardImages(data.images);
        // 이미지 로드 상태 초기화
        setImageLoadStates({painting: false, drawing: false});
      }
    } catch (error) {
      console.error('Failed to fetch card images:', error);
    }
  };

  const getStatusClassName = (status: string) => {
    if (status.includes('성공')) {
      return 'bg-green-50 text-green-700 border border-green-200';
    }
    if (status.includes('실패') || status.includes('오류')) {
      return 'bg-red-50 text-red-700 border border-red-200';
    }
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  };

  // 컴포넌트 마운트 시 카드 이미지 불러오기
  useEffect(() => {
    fetchCardImages();
  }, []);

  return (
    <div className="w-full px-6 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-8">Admin - Works 관리</h1>
        
        {/* 카드 이미지 업로드 섹션 */}
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Works 카드 이미지 관리</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Painting 카드 이미지 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Painting 카드 이미지</h3>
              
              {/* 파일 선택 */}
              <div>
                <label htmlFor="painting-image" className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 선택
                </label>
                <input
                  id="painting-image"
                  ref={paintingFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePaintingFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  지원 형식: 모든 이미지 파일 (JPG, PNG, WebP, GIF, BMP, SVG, TIFF 등)
                </p>
              </div>

              {/* 미리보기 */}
              {paintingPreviewUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex gap-4">
                    <div className="w-48 h-48 flex-shrink-0 relative">
                      <Image 
                        src={paintingPreviewUrl} 
                        alt="Preview" 
                        fill
                        className="object-cover rounded-lg"
                        loading="lazy"
                        sizes="192px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        선택된 파일: {selectedPaintingFile?.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        크기: {selectedPaintingFile ? (selectedPaintingFile.size / 1024 / 1024).toFixed(2) : 0} MB
                      </p>
                      <button
                        onClick={handleRemovePaintingFile}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 업로드 버튼 */}
              <div className="pt-4">
                <button
                  onClick={handlePaintingUpload}
                  disabled={!selectedPaintingFile || isUploadingPainting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {isUploadingPainting ? '업로드 중...' : 'Painting 카드 이미지 업로드'}
                </button>
              </div>
            </div>

            {/* Drawing 카드 이미지 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Drawing 카드 이미지</h3>
              
              {/* 파일 선택 */}
              <div>
                <label htmlFor="drawing-image" className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 선택
                </label>
                <input
                  id="drawing-image"
                  ref={drawingFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDrawingFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  지원 형식: 모든 이미지 파일 (JPG, PNG, WebP, GIF, BMP, SVG, TIFF 등)
                </p>
              </div>

              {/* 미리보기 */}
              {drawingPreviewUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex gap-4">
                    <div className="w-48 h-48 flex-shrink-0 relative">
                      <Image 
                        src={drawingPreviewUrl} 
                        alt="Preview" 
                        fill
                        className="object-cover rounded-lg"
                        loading="lazy"
                        sizes="192px"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        선택된 파일: {selectedDrawingFile?.name}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        크기: {selectedDrawingFile ? (selectedDrawingFile.size / 1024 / 1024).toFixed(2) : 0} MB
                      </p>
                      <button
                        onClick={handleRemoveDrawingFile}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 업로드 버튼 */}
              <div className="pt-4">
                <button
                  onClick={handleDrawingUpload}
                  disabled={!selectedDrawingFile || isUploadingDrawing}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {isUploadingDrawing ? '업로드 중...' : 'Drawing 카드 이미지 업로드'}
                </button>
              </div>
            </div>
          </div>

          {/* 상태 메시지 */}
          {uploadStatus && (
            <div className={`p-3 rounded-md ${getStatusClassName(uploadStatus)}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Works 카테고리 선택 섹션 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Works 카테고리 관리</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
            {/* Painting */}
            <div className="flex justify-center sm:justify-end">
              <Link
                href="/admin/works/painting"
                className="group relative bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-all duration-300 border-2 border-gray-200 hover:border-blue-300 inline-block w-full max-w-sm"
              >
                <div className="aspect-[3/4] relative w-full h-full min-h-[250px] sm:min-h-[300px]">
                  {cardImages.painting ? (
                    <>
                      <Image
                        src={cardImages.painting}
                        alt="Painting Card"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 50vw"
                        onLoad={() => {
                          setImageLoadStates(prev => ({...prev, painting: true}));
                        }}
                        onError={() => {
                          console.error('Painting card image failed to load:', cardImages.painting);
                          setImageLoadStates(prev => ({...prev, painting: false}));
                        }}
                      />
                      {!imageLoadStates.painting && (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-600">이미지 로딩 중...</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2V3zM13 8l4-4 4 4M13 8l4 4M13 8l4 4M13 8l4 4" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Painting</h2>
                        <p className="text-gray-600">Painting 관리</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="text-center text-white">
                      <h2 className="text-2xl font-bold mb-2">Painting</h2>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Drawing */}
            <div className="flex justify-center sm:justify-start">
              <Link
                href="/admin/works/drawing"
                className="group relative bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-all duration-300 border-2 border-gray-200 hover:border-green-300 inline-block w-full max-w-sm"
              >
                <div className="aspect-[3/4] relative w-full h-full min-h-[250px] sm:min-h-[300px]">
                  {cardImages.drawing ? (
                    <>
                      <Image
                        src={cardImages.drawing}
                        alt="Drawing Card"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 50vw"
                        onLoad={() => {
                          setImageLoadStates(prev => ({...prev, drawing: true}));
                        }}
                        onError={() => {
                          console.error('Drawing card image failed to load:', cardImages.drawing);
                          setImageLoadStates(prev => ({...prev, drawing: false}));
                        }}
                      />
                      {!imageLoadStates.drawing && (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-600">이미지 로딩 중...</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Drawing</h2>
                        <p className="text-gray-600">Drawing 관리</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="text-center text-white">
                      <h2 className="text-2xl font-bold mb-2">Drawing</h2>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}