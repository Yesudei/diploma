'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import apiService from '@/services/api';
import { toast } from 'sonner';
import type { AudioFile, MelodyGeneration, MixingAnalysisResult } from '@/types';
import { courses } from '@/lib/data';
import Link from 'next/link';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'upload' | 'files' | 'melody' | 'analysis'>('courses');
  
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [melodyResults, setMelodyResults] = useState<MelodyGeneration[]>([]);
  const [analysisResults, setAnalysisResults] = useState<MixingAnalysisResult[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [melodyRequest, setMelodyRequest] = useState({
    genre: 'pop',
    mood: 'happy',
    tempo: 120,
    bars: 8
  });
  const [selectedFileForMelody, setSelectedFileForMelody] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        router.push('/auth/login');
      }
      setLoading(false);
    });
  }, [router]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const files = await apiService.listAudioFiles({ page: 1, limit: 20 });
      setAudioFiles(files.data);
      
      const melodies = await apiService.listMelodyGenerations({ page: 1, limit: 10 });
      setMelodyResults(melodies.data);
      
      const analyses = await apiService.listAnalysisResults({ page: 1, limit: 10 });
      setAnalysisResults(analyses.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedFormats = ['.wav', '.mp3', '.flac', '.ogg', '.midi'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedFormats.includes(fileExt)) {
        toast.error(`Unsupported format. Allowed: ${allowedFormats.join(', ')}`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    setIsUploading(true);
    try {
      await apiService.uploadAudio(selectedFile);
      toast.success('Audio uploaded successfully!');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadData();
      setActiveTab('files');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async (fileId: string) => {
    try {
      toast.info('Analyzing audio...');
      await apiService.analyzeAudio(fileId);
      toast.success('Analysis complete!');
      loadData();
      setActiveTab('analysis');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(message);
    }
  };

  const handleGenerateMelody = async () => {
    if (!selectedFileForMelody) {
      toast.error('Please select a file first');
      return;
    }
    setIsGenerating(true);
    try {
      await apiService.generateMelody({
        audio_file_id: selectedFileForMelody,
        ...melodyRequest
      });
      toast.success('Melody generated!');
      loadData();
      setActiveTab('melody');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#7A7570]">Ачаалж байна...</div>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-[#0A0A0F] pt-24 px-[60px] pb-16">
        <div className="mb-8">
          <h1 className="font-display text-[clamp(32px,4vw,52px)] font-bold mb-2">
            Тавтай морил, {user.email?.split('@')[0]}
          </h1>
          <p className="text-[#7A7570]">AI туслах </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[rgba(245,240,232,0.1)] pb-4">
          {[
            { id: 'courses', label: 'My Courses' },
            { id: 'upload', label: 'Upload' },
            { id: 'files', label: 'My Files' },
            { id: 'melody', label: 'Generate Melody' },
            { id: 'analysis', label: 'AI Analysis' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#C9A84C] text-black'
                  : 'text-[#7A7570] hover:text-white hover:bg-[rgba(245,240,232,0.05)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">My Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Link 
                  key={course.id} 
                  href={`/courses/${course.slug}`}
                  className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-5 hover:border-[rgba(201,168,76,0.20)] hover:-translate-y-1 transition-all"
                >
                  <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-2">
                    {course.category}
                  </div>
                  <h3 className="font-display font-bold mb-3 text-[#F5F0E8]">{course.title}</h3>
                  <div className="flex items-center justify-between text-xs text-[#7A7570]">
                    <span>{course.price === 0 ? 'Free' : `₮${course.price.toLocaleString()}`}</span>
                    <span>{course.lessonsCount} lessons</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-xl mx-auto">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[rgba(245,240,232,0.1)] rounded-xl p-12 text-center cursor-pointer hover:border-[#C9A84C] transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".wav,.mp3,.flac,.ogg,.midi"
                className="hidden"
                disabled={isUploading}
              />
              <div className="text-6xl mb-4"></div>
              <p className="text-xl font-medium mb-2">
                {selectedFile ? selectedFile.name : 'Click to select audio file'}
              </p>
              <p className="text-[#7A7570] text-sm">
                WAV, MP3, FLAC, OGG, MIDI • Max 50MB
              </p>
              {selectedFile && (
                <p className="mt-4 text-[#C9A84C]">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full mt-6 py-4 bg-gradient-to-r from-[#C9A84C] to-[#A68940] rounded-xl font-bold text-black disabled:opacity-50 hover:opacity-90 transition-all"
            >
              {isUploading ? 'Урдгаж байна...' : 'Upload Audio'}
            </button>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioFiles.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#7A7570]">
                Одоогоор аудио файл байхгүй байна
              </div>
            ) : (
              audioFiles.map((file) => (
                <div key={file.id} className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(201,168,76,0.1)] flex items-center justify-center text-xl font-bold text-[#C9A84C]">A</div>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{file.filename}</p>
                      <p className="text-xs text-[#7A7570]">{file.duration}s • {file.format}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAnalyze(file.id)}
                      className="flex-1 py-2 bg-[rgba(201,168,76,0.1)] text-[#C9A84C] rounded-lg text-sm font-medium hover:bg-[rgba(201,168,76,0.2)]"
                    >
                      Analyze
                    </button>
                    <button
                      onClick={() => setSelectedFileForMelody(file.id)}
                      className="flex-1 py-2 bg-[rgba(201,168,76,0.1)] text-[#C9A84C] rounded-lg text-sm font-medium hover:bg-[rgba(201,168,76,0.2)]"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Melody Generation Tab */}
        {activeTab === 'melody' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Melody Generation</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#7A7570] mb-2">Select Audio File</label>
                  <select
                    value={selectedFileForMelody}
                    onChange={(e) => setSelectedFileForMelody(e.target.value)}
                    className="w-full p-3 bg-[#0A0A0F] border border-[rgba(245,240,232,0.1)] rounded-lg"
                  >
                    <option value="">Select a file...</option>
                    {audioFiles.map((file) => (
                      <option key={file.id} value={file.id}>{file.filename}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#7A7570] mb-2">Genre</label>
                    <select
                      value={melodyRequest.genre}
                      onChange={(e) => setMelodyRequest({ ...melodyRequest, genre: e.target.value })}
                      className="w-full p-3 bg-[#0A0A0F] border border-[rgba(245,240,232,0.1)] rounded-lg"
                    >
                      <option value="pop">Pop</option>
                      <option value="jazz">Jazz</option>
                      <option value="electronic">Electronic</option>
                      <option value="hiphop">Hip Hop</option>
                      <option value="classical">Classical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#7A7570] mb-2">Mood</label>
                    <select
                      value={melodyRequest.mood}
                      onChange={(e) => setMelodyRequest({ ...melodyRequest, mood: e.target.value })}
                      className="w-full p-3 bg-[#0A0A0F] border border-[rgba(245,240,232,0.1)] rounded-lg"
                    >
                      <option value="happy">Happy</option>
                      <option value="sad">Sad</option>
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#7A7570] mb-2">Tempo (BPM)</label>
                    <input
                      type="number"
                      value={melodyRequest.tempo}
                      onChange={(e) => setMelodyRequest({ ...melodyRequest, tempo: parseInt(e.target.value) })}
                      className="w-full p-3 bg-[#0A0A0F] border border-[rgba(245,240,232,0.1)] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#7A7570] mb-2">Bars</label>
                    <input
                      type="number"
                      value={melodyRequest.bars}
                      onChange={(e) => setMelodyRequest({ ...melodyRequest, bars: parseInt(e.target.value) })}
                      className="w-full p-3 bg-[#0A0A0F] border border-[rgba(245,240,232,0.1)] rounded-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateMelody}
                  disabled={!selectedFileForMelody || isGenerating}
                  className="w-full py-4 bg-gradient-to-r from-[#C9A84C] to-[#A68940] rounded-xl font-bold text-black disabled:opacity-50 hover:opacity-90"
                >
                  {isGenerating ? 'Уусгэж байна...' : 'Generate Melody'}
                </button>
              </div>
            </div>

            {/* Generated Melodies */}
            {melodyResults.length > 0 && (
              <div>
                <h4 className="text-lg font-bold mb-4">Generated Melodies</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {melodyResults.map((melody) => (
                    <div key={melody.id} className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-[rgba(201,168,76,0.1)] text-[#C9A84C] text-xs rounded">{melody.genre}</span>
                        <span className="px-2 py-1 bg-[rgba(201,168,76,0.1)] text-[#C9A84C] text-xs rounded">{melody.tempo} BPM</span>
                      </div>
                      <p className="text-sm text-[#7A7570]">Generated: {new Date(melody.generated_at).toLocaleDateString()}</p>
                      <button className="mt-3 w-full py-2 bg-[rgba(201,168,76,0.1)] text-[#C9A84C] rounded-lg text-sm font-medium">
                        Download MIDI
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisResults.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#7A7570]">
                Одоогоор анализ хийгдээгүй байна
              </div>
            ) : (
              analysisResults.map((result) => (
                <div key={result.id} className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold">AI Mix Analysis</h4>
                    <span className="text-2xl font-bold text-[#C9A84C]">{result.overall_score}/100</span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#7A7570]">Loudness (LUFS)</span>
                      <span>{result.loudness_lufs.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A7570]">Peak Level (dBFS)</span>
                      <span>{result.peak_level_dbfs.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A7570]">Dynamic Range</span>
                      <span>{result.dynamic_range_db.toFixed(1)} dB</span>
                    </div>
                  </div>

                  {result.frequency_balance && (
                    <div className="mt-4 pt-4 border-t border-[rgba(245,240,232,0.06)]">
                      <p className="text-sm text-[#7A7570] mb-2">Frequency Balance</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-[#0A0A0F] rounded">
                          <p className="text-[#7A7570]">Low</p>
                          <p className="font-bold">{result.frequency_balance.low_presence}</p>
                        </div>
                        <div className="text-center p-2 bg-[#0A0A0F] rounded">
                          <p className="text-[#7A7570]">Mid</p>
                          <p className="font-bold">{result.frequency_balance.mid_presence}</p>
                        </div>
                        <div className="text-center p-2 bg-[#0A0A0F] rounded">
                          <p className="text-[#7A7570]">High</p>
                          <p className="font-bold">{result.frequency_balance.high_presence}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.recommendations && result.recommendations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[rgba(245,240,232,0.06)]">
                      <p className="text-sm text-[#7A7570] mb-2">Recommendations</p>
                      <ul className="text-sm space-y-1">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="text-[#C9A84C]">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
