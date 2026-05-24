'use client';

import { useRef, useState } from 'react';
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
    if (!file) return;

    const allowedFormats = ['.wav', '.mp3', '.flac', '.ogg'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedFormats.includes(fileExt)) {
      toast.error(`Дэмжихгүй формат. Боломжтой: ${allowedFormats.join(', ')}`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Файлын хэмжээ 50MB-аас бага байх ёстой');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Файлаа сонгоно уу');
      return;
    }

    setIsUploading(true);

    try {
      await apiService.uploadAudio(selectedFile);

      toast.success('Аудио файл нэмэгдлээ');
      setSelectedFile(null);
      setDescription('');
      setIsPublic(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadProgress(0);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Файл нэмэхэд алдаа гарлаа';
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="studio-panel rounded-[24px] p-5">
      <form onSubmit={handleUpload} className="space-y-4">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-[rgba(245,240,232,0.14)] bg-[rgba(8,9,12,0.35)] p-8 text-center transition-colors hover:border-[#C9A84C]"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".wav,.mp3,.flac,.ogg"
            className="hidden"
            disabled={isUploading}
          />

          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,168,76,0.25)] text-2xl text-[#E8C96D]">
            ♪
          </div>
          <p className="font-medium text-[#F5F0E8]">
            {selectedFile ? selectedFile.name : 'Аудио файлаа сонгох'}
          </p>
          <p className="mt-1 text-sm text-[#8f8779]">
            WAV, MP3, FLAC, OGG формат, хамгийн ихдээ 50MB
          </p>
        </div>

        {selectedFile && (
          <div className="rounded-xl bg-white/[0.04] p-4">
            <p className="text-sm">
              <span className="text-[#8f8779]">Хэмжээ:</span>{' '}
              <span className="font-medium text-[#F5F0E8]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </p>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-[#F5F0E8]">
            Тайлбар (заавал биш)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="studio-input min-h-[96px] w-full resize-none rounded-xl px-3 py-3"
            placeholder="Файлынхаа тухай богино тэмдэглэл бичиж болно..."
            rows={3}
            disabled={isUploading}
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={isUploading}
            className="h-4 w-4 cursor-pointer rounded"
          />
          <label htmlFor="isPublic" className="ml-2 cursor-pointer text-sm text-[#b8ad93]">
            Файлыг нийтэд харагдах болгох
          </label>
        </div>

        {isUploading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[#b8ad93]">
              <span>Илгээж байна...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.06]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#7DD3A8] transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="studio-button w-full rounded-xl py-3 font-bold disabled:opacity-50"
        >
          {isUploading ? 'Илгээж байна...' : 'Аудио файл нэмэх'}
        </button>
      </form>
    </div>
  );
}
