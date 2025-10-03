'use client';

import { useState } from 'react';
import siteConfig from '@/data/site-config.json';
import { getS3ImageUrl } from '@/lib/s3';

export default function AdminPage() {
  const [config, setConfig] = useState(siteConfig);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // TODO: API 호출로 설정 저장
    console.log('Saving configuration:', config);
    setIsEditing(false);
    alert('Configuration saved! (Console log only)');
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // FormData로 파일과 폴더 정보를 서버에 전송
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'Home/Background');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // 설정 업데이트 (background로 고정된 파일명 사용)
      setConfig(prev => ({
        ...prev,
        featuredBackground: {
          ...prev.featuredBackground,
          image: 'Home/Background/background' // 확장자 없이 고정
        }
      }));

      alert('Background image uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Site Administration</h1>
            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  Edit Settings
                </button>
              )}
            </div>
          </div>

          {/* Background Management */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Featured Background</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img
                  src={getS3ImageUrl(config.featuredBackground.image)}
                  alt="Current Background"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const nextElement = target.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'flex';
                    }
                  }}
                />
                <div className="w-full h-full items-center justify-center text-gray-500" style={{ display: 'none' }}>
                  <div>
                    <p className="text-lg">Current Background</p>
                    <p className="text-sm">{config.featuredBackground.title}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="background-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="background-upload"
                  className={`inline-block px-4 py-2 rounded-md cursor-pointer transition-colors ${
                    uploading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Upload New Background'}
                </label>
                
                {isEditing && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Title
                      </label>
                      <input
                        type="text"
                        value={config.featuredBackground.title}
                        onChange={(e) => setConfig({
                          ...config,
                          featuredBackground: {
                            ...config.featuredBackground,
                            title: e.target.value
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Description
                      </label>
                      <textarea
                        value={config.featuredBackground.description}
                        onChange={(e) => setConfig({
                          ...config,
                          featuredBackground: {
                            ...config.featuredBackground,
                            description: e.target.value
                          }
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Site Settings */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Site Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Title
                </label>
                <input
                  type="text"
                  value={isEditing ? config.siteSettings.title : config.siteSettings.title}
                  onChange={(e) => isEditing && setConfig({
                    ...config,
                    siteSettings: {
                      ...config.siteSettings,
                      title: e.target.value
                    }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={isEditing ? config.siteSettings.subtitle : config.siteSettings.subtitle}
                  onChange={(e) => isEditing && setConfig({
                    ...config,
                    siteSettings: {
                      ...config.siteSettings,
                      subtitle: e.target.value
                    }
                  })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={isEditing ? config.siteSettings.description : config.siteSettings.description}
                  onChange={(e) => isEditing && setConfig({
                    ...config,
                    siteSettings: {
                      ...config.siteSettings,
                      description: e.target.value
                    }
                  })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-2">Manage Gallery</h3>
                <p className="text-sm text-gray-600">Add, edit, or remove artworks</p>
              </button>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-2">Manage Exhibitions</h3>
                <p className="text-sm text-gray-600">Update exhibition information</p>
              </button>
              <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-2">View Analytics</h3>
                <p className="text-sm text-gray-600">Check site performance</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

