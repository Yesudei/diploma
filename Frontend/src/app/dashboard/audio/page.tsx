'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { toast } from 'sonner';

interface AudioFile {
  id: string;
  filename: string;
  file_path: string;
  duration_seconds: number;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
}

export default function AudioFilesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Load audio files from Supabase
      const { data } = await supabase
        .from('audio_files')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setAudioFiles(data || []);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      try {
        const { error } = await supabase
          .from('audio_files')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setAudioFiles((prev) => prev.filter((file) => file.id !== id));
        toast.success('File deleted successfully');
      } catch (error) {
        toast.error('Failed to delete file');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#7A7570]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div>
        <h1 className="text-3xl font-bold mb-8 text-[#F5F0E8]">🎵 My Audio Files</h1>

        {audioFiles.length === 0 ? (
          <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-8 text-center">
            <p className="text-xl text-[#7A7570] mb-4">No audio files yet</p>
            <p className="text-[#7A7570]">Upload your first audio file to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {audioFiles.map((file) => (
              <div key={file.id} className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-5 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-[#F5F0E8]">{file.filename}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm text-[#7A7570]">
                    <div>
                      <span className="text-[#F5F0E8]">Duration:</span>
                      <p>{file.duration_seconds ? `${file.duration_seconds.toFixed(2)}s` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[#F5F0E8]">Size:</span>
                      <p>{(file.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <span className="text-[#F5F0E8]">Format:</span>
                      <p>{file.mime_type || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[#F5F0E8]">Uploaded:</span>
                      <p>{new Date(file.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="px-4 py-2 bg-[#18181F] text-[#F5F0E8] rounded-lg border border-[rgba(245,240,232,0.1)] hover:bg-[#22222D] transition text-sm">
                    Analyze
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="px-3 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
