import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Trash2, Film, Image } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  contentTypeForExtension,
  formatStorageUploadError,
  maxBytesForExtension,
} from '../lib/storageUpload';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'] as const;

interface MediaLibraryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

interface StorageFile {
  name: string;
  url: string;
  type: 'image' | 'video';
  createdAt: string;
}

function isAllowedFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return Boolean(ext && ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number]));
}

function sortNewestFirst(a: StorageFile, b: StorageFile): number {
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  if (tb !== ta) return tb - ta;
  return b.name.localeCompare(a.name);
}

export function MediaLibrary({ onSelect, onClose }: MediaLibraryProps) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      setError(null);

      const { data, error: listError } = await supabase.storage
        .from('game_assets')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (listError) {
        console.error('Error listing files:', listError);
        setError('Failed to load media files');
        return;
      }

      if (!data) {
        setFiles([]);
        return;
      }

      const mediaFiles: StorageFile[] = data
        .filter((file) => {
          const isMedia = file.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i);
          return !file.metadata?.isDirectory && isMedia;
        })
        .map((file) => {
          const { data: urlData } = supabase.storage
            .from('game_assets')
            .getPublicUrl(file.name);
          const isVideo = file.name.match(/\.(mp4|webm)$/i);
          const createdAt =
            file.created_at ?? file.updated_at ?? new Date(0).toISOString();
          return {
            name: file.name,
            url: urlData.publicUrl,
            type: isVideo ? ('video' as const) : ('image' as const),
            createdAt,
          };
        })
        .sort(sortNewestFirst);

      setFiles(mediaFiles);
    } catch (err) {
      console.error('Error in loadFiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const uploadSingleFile = async (file: File): Promise<void> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt as (typeof ALLOWED_EXTENSIONS)[number])) {
      throw new Error(
        'Invalid file type. Use JPG, PNG, GIF, WEBP, MP4, or WebM.'
      );
    }

    const maxSize = maxBytesForExtension(fileExt);
    if (file.size > maxSize) {
      const mb = Math.round(maxSize / (1024 * 1024));
      throw new Error(`${file.name}: must be smaller than ${mb} MB.`);
    }

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${random}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('game_assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentTypeForExtension(fileExt),
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(formatStorageUploadError(uploadError));
    }
  };

  const uploadFiles = async (fileList: File[]) => {
    const valid = fileList.filter(isAllowedFile);
    if (valid.length === 0) {
      setError('No supported files. Use JPG, PNG, GIF, WEBP, MP4, or WebM.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      for (let i = 0; i < valid.length; i++) {
        setUploadProgress(
          valid.length > 1 ? `Uploading ${i + 1} of ${valid.length}…` : null
        );
        await uploadSingleFile(valid[i]);
      }

      await loadFiles();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : formatStorageUploadError(err));
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;
    void uploadFiles(Array.from(selected));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (uploading) return;

    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) void uploadFiles(dropped);
  };

  const handleDelete = async (fileName: string) => {
    try {
      setDeleting(fileName);
      setError(null);

      const { error: deleteError } = await supabase.storage
        .from('game_assets')
        .remove([fileName]);

      if (deleteError) throw deleteError;

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

        <div
          className={`mb-4 rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-[#67c1f5] bg-[#67c1f5]/10'
              : 'border-transparent'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <label
            className={`block w-full rounded-lg p-4 cursor-pointer transition-colors ${
              isDragging
                ? 'bg-[#67c1f5]/15'
                : 'bg-[#32404e] hover:bg-[#434e5b]'
            } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm"
              multiple
              onChange={handleFileInput}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex flex-col items-center space-y-2 pointer-events-none">
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm">
                    {uploadProgress ?? 'Uploading…'}
                  </span>
                </>
              ) : (
                <>
                  <Upload className={`w-6 h-6 ${isDragging ? 'text-[#67c1f5]' : ''}`} />
                  <span className="text-sm text-center">
                    {isDragging
                      ? 'Drop images or videos here'
                      : 'Drag and drop, or click to upload'}
                  </span>
                  <span className="text-xs text-gray-400 text-center">
                    JPG, PNG, GIF, WEBP, MP4, WebM — multiple files OK
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
                  <div className="w-full h-full bg-black flex items-center justify-center relative">
                    <video
                      src={file.url}
                      className="w-full h-full object-contain"
                      preload="metadata"
                    />
                    <Film className="absolute top-2 right-2 w-5 h-5 text-white bg-black/50 p-1 rounded pointer-events-none" />
                  </div>
                ) : (
                  <>
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <Image className="absolute top-2 right-2 w-5 h-5 text-white bg-black/50 p-1 rounded pointer-events-none" />
                  </>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(file.url);
                    }}
                    className="bg-[#5c7e10] hover:bg-[#739c16] p-1.5 rounded text-xs"
                  >
                    Select
                  </button>
                  <button
                    type="button"
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
