'use client';

import { useState, useRef } from 'react';
import apiService from '@/services/api';
import { toast } from 'sonner';

export default function AudioUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const allowedFormats = ['.wav', '.mp3', '.flac', '.ogg'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedFormats.includes(fileExt)) {
        toast.error(`Unsupported format. Allowed: ${allowedFormats.join(', ')}`);
        return;
      }

      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

     setIsUploading(true);

     try {
       await apiService.uploadAudio(selectedFile);
       
       toast.success('Audio file uploaded successfully!');
       setSelectedFile(null);
       setDescription('');
       setIsPublic(false);
       if (fileInputRef.current) {
         fileInputRef.current.value = '';
       }
       setUploadProgress(0);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        toast.error(message);
     } finally {
       setIsUploading(false);
       setUploadProgress(0);
     }
   };

  return (
    <div className="card">
      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Input Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".wav,.mp3,.flac,.ogg"
            className="hidden"
            disabled={isUploading}
          />
          
          <div className="text-4xl mb-2">🎵</div>
          <p className="text-text-muted font-medium">
            {selectedFile ? selectedFile.name : 'Click to select audio file'}
          </p>
          <p className="text-text-muted text-sm mt-1">
            or drag and drop (WAV, MP3, FLAC, OGG - Max 50MB)
          </p>
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="bg-surface/50 p-4 rounded-lg">
            <p className="text-sm">
              <span className="text-text-muted">Size:</span>{' '}
              <span className="text-text-muted font-medium">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field resize-none"
            placeholder="Add a description for your audio file..."
            rows={3}
            disabled={isUploading}
          />
        </div>

        {/* Public Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={isUploading}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="isPublic" className="ml-2 cursor-pointer">
            Make this file public (others can see it)
          </label>
        </div>

        {/* Upload Progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="btn-primary w-full py-2 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Upload Audio'}
        </button>
      </form>
    </div>
  );
}
