import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Trash2, Film, Image } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MediaLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

interface StorageFile {
  name: string;
  url: string;
  type: 'image' | 'video';
}

export function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setError(null);
      
      // List all files in root directory
      const { data, error } = await supabase.storage
        .from('game_assets')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error('Error listing files:', error);
        setError('Failed to load media files');
        return;
      }

      if (!data) {
        setFiles([]);
        return;
      }

      console.log('All files found:', data);

      // Process all files
      const mediaFiles = await Promise.all(
        data
          .filter(file => {
            // Only include actual files (not directories) that are media files
            const isMedia = file.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i);
            console.log(`Checking if ${file.name} is media:`, !!isMedia);
            return !file.metadata?.isDirectory && isMedia;
          })
          .map(async file => {
            const { data: urlData } = supabase.storage
              .from('game_assets')
              .getPublicUrl(file.name);
            
            const isVideo = file.name.match(/\.(mp4|webm)$/i);
            
            return {
              name: file.name,
              url: urlData.publicUrl,
              type: isVideo ? 'video' as const : 'image' as const
            };
          })
      );

      console.log('Final media files:', mediaFiles);
      setFiles(mediaFiles);
    } catch (err) {
      console.error('Error in loadFiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'].includes(fileExt)) {
        throw new Error('Invalid file type. Please upload an image or video file (jpg, png, gif, webp, mp4, webm).');
      }

      // Check file size (50MB limit for videos, 5MB for images)
      const isVideo = ['mp4', 'webm'].includes(fileExt);
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      
      if (file.size > maxSize) {
        throw new Error(
          isVideo 
            ? 'Video files must be smaller than 50MB' 
            : 'Image files must be smaller than 5MB'
        );
      }

      // Add timestamp and random string to prevent name collisions
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
      const random = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${random}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('game_assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      await loadFiles();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      setDeleting(fileName);
      setError(null);

      const { error: deleteError } = await supabase.storage
        .from('game_assets')
        .remove([fileName]);

      if (deleteError) {
        throw deleteError;
      }

      await loadFiles();
    } catch (err) {
      console.error('Error deleting file:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete file. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1b2838] rounded-lg w-full max-w-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Media Library</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block w-full bg-[#32404e] rounded-lg p-4 cursor-pointer hover:bg-[#434e5b] transition-colors">
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex flex-col items-center space-y-2">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Click to upload an image or video</span>
                  <span className="text-xs text-gray-400">
                    Supported formats: JPG, PNG, GIF, WEBP, MP4, WEBM
                    <br />
                    Max size: 50MB for videos, 5MB for images
                  </span>
                </>
              )}
            </div>
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No media files uploaded yet
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
            {files.map((file) => (
              <div
                key={file.name}
                className="aspect-video relative group cursor-pointer rounded overflow-hidden"
              >
                {file.type === 'video' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    <video
                      src={file.url}
                      className="w-full h-full object-contain"
                      controls
                    />
                    <Film className="absolute top-2 right-2 w-5 h-5 text-white bg-black/50 p-1 rounded" />
                  </div>
                ) : (
                  <>
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <Image className="absolute top-2 right-2 w-5 h-5 text-white bg-black/50 p-1 rounded" />
                  </>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(file.url);
                    }}
                    className="bg-[#5c7e10] hover:bg-[#739c16] p-1.5 rounded text-xs"
                  >
                    Select
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.name);
                    }}
                    disabled={deleting === file.name}
                    className="bg-red-500/80 hover:bg-red-500 p-1.5 rounded"
                  >
                    {deleting === file.name ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}