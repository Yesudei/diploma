'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import apiService from '@/services/api';
import { toast } from 'sonner';
import type { AudioFile, ChatMessage, MixingAnalysisResult } from '@/types';
import { courses, teachers } from '@/lib/data';
import Link from 'next/link';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });

const tabs: Array<{ id: 'courses' | 'upload' | 'files' | 'analysis' | 'mentor'; label: string }> = [
  { id: 'courses', label: 'Миний хичээл' },
  { id: 'upload', label: 'Файл нэмэх' },
  { id: 'files', label: 'Миний файлууд' },
  { id: 'analysis', label: 'AI анализ' },
  { id: 'mentor', label: 'Ментортой чат' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'courses' | 'upload' | 'files' | 'analysis' | 'mentor'
  >('courses');

  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [analysisResults, setAnalysisResults] = useState<MixingAnalysisResult[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAnalysisFileId, setSelectedAnalysisFileId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState(teachers[0]?.id || '');
  const [mentorInput, setMentorInput] = useState('');
  const [previewMentorId, setPreviewMentorId] = useState<string | null>(null);
  const [mentorConversations, setMentorConversations] = useState<Record<string, ChatMessage[]>>({});
  const [isSendingMentorMessage, setIsSendingMentorMessage] = useState(false);
  const mentorEndRef = useRef<HTMLDivElement>(null);
  const selectedMentor = teachers.find((t) => t.id === selectedMentorId);
  const previewMentor = teachers.find((t) => t.id === previewMentorId);
  const currentMentorMessages = mentorConversations[selectedMentorId] || [];

  useEffect(() => {
    let mounted = true;

    const handleSession = (session: { user: { id: string; email?: string } } | null) => {
      if (!mounted) return;

      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        router.replace('/auth/login');
      }

      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const files = await apiService.listAudioFiles({ page: 1, limit: 20 });
      setAudioFiles(files.data);

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

  useEffect(() => {
    mentorEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mentorConversations, selectedMentorId]);

  const openMentorPreview = (mentorId: string) => {
    setPreviewMentorId(mentorId);
  };

  const closeMentorPreview = () => {
    setPreviewMentorId(null);
  };

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
      await loadData();
      setActiveTab('files');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedAnalysisFileId) {
      toast.error('Анализ хийх файлаа сонгоно уу');
      return;
    }

    setIsAnalyzing(true);
    try {
      toast.info('Analyzing audio...');
      await apiService.analyzeAudio(selectedAnalysisFileId);
      toast.success('Analysis complete!');
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Analysis failed';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMentorMessage = async () => {
    const text = mentorInput.trim();
    const mentor = selectedMentor;

    if (!text) {
      return;
    }

    if (!mentor) {
      toast.error('Ментор сонгоно уу');
      return;
    }

    const userMessage: ChatMessage = {
      id: `local-user-${Date.now()}`,
      user_id: user?.id || '',
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const nextHistory = [...currentMentorMessages, userMessage];
    setMentorConversations((prev) => ({
      ...prev,
      [selectedMentorId]: nextHistory,
    }));
    setMentorInput('');
    setIsSendingMentorMessage(true);

    try {
      const response = await apiService.sendChatMessage({
        message: `[mentor:${mentor.id}:${mentor.name}] ${text}`,
        conversation_history: nextHistory,
      });

      const assistantMessage: ChatMessage = {
        id: response.id,
        user_id: user?.id || '',
        role: 'assistant',
        content: response.message,
        created_at: response.timestamp,
        sources: response.sources,
      };

      setMentorConversations((prev) => ({
        ...prev,
        [selectedMentorId]: [...(prev[selectedMentorId] || []), assistantMessage],
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Message failed';
      toast.error(message);
    } finally {
      setIsSendingMentorMessage(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <div className="text-[#7A7570]">Ачаалж байна...</div>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.08),transparent_35%),#0A0A0F] pb-16 pt-24 sm:pt-28">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-14">
          <section className="grid items-start gap-7 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a49368]">
                Таны самбар
              </p>
              <h1 className="mt-3 font-display text-[clamp(30px,4vw,48px)] font-black leading-[1.05] text-[#F5F0E8]">
                Тавтай морил, {user.email?.split('@')[0]}
              </h1>
              <p className="mt-3 max-w-[620px] text-sm leading-7 text-[#b8ad93] sm:text-base">
                Хичээлээ үргэлжлүүлж, аудио файлуудаа удирдаж, AI анализ болон ментортой чатаа нэг
                дороос хянаарай.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-4">
                <p className="font-display text-2xl font-black text-[#F5F0E8]">{courses.length}</p>
                <p className="mt-1 text-xs text-[#8f8779]">Нийт курс</p>
              </div>
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-4">
                <p className="font-display text-2xl font-black text-[#F5F0E8]">
                  {audioFiles.length}
                </p>
                <p className="mt-1 text-xs text-[#8f8779]">Аудио файл</p>
              </div>
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-4">
                <p className="font-display text-2xl font-black text-[#F5F0E8]">
                  {analysisResults.length}
                </p>
                <p className="mt-1 text-xs text-[#8f8779]">AI анализ</p>
              </div>
            </div>
          </section>

          <section className="mt-8 border-b border-[rgba(245,240,232,0.08)] pb-3">
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
                className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#111118] px-3 py-2 text-sm text-[#F5F0E8]"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden gap-5 sm:flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 pb-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'border-[#C9A84C] text-[#E8C96D]'
                      : 'border-transparent text-[#8a857e] hover:text-[#F5F0E8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'courses' && (
            <section className="mt-8">
              <h2 className="font-display text-2xl font-bold text-[#F5F0E8]">Миний Хичээлүүд</h2>
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="group rounded-xl border border-[rgba(245,240,232,0.06)] bg-[#111118] p-5 transition-all hover:-translate-y-1 hover:border-[rgba(201,168,76,0.3)]"
                  >
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#9e8d63]">
                      {course.category}
                    </div>
                    <h3 className="mb-3 font-display text-lg font-bold text-[#F5F0E8] transition-colors group-hover:text-[#E8C96D]">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between border-t border-[rgba(245,240,232,0.06)] pt-3 text-xs text-[#7A7570]">
                      <span>
                        {course.price === 0 ? 'Үнэгүй' : `₮${course.price.toLocaleString()}`}
                      </span>
                      <span>{course.lessonsCount} lessons</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'upload' && (
            <section className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-6 sm:p-8">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-[rgba(245,240,232,0.12)] p-8 text-center transition-all hover:border-[#C9A84C] sm:p-12"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".wav,.mp3,.flac,.ogg,.midi"
                  className="hidden"
                  disabled={isUploading}
                />
                <p className="text-xl font-medium text-[#F5F0E8]">
                  {selectedFile ? selectedFile.name : 'Аудио файл сонгох'}
                </p>
                <p className="mt-3 text-sm text-[#7A7570]">
                  WAV, MP3, FLAC, OGG, MIDI • Хамгийн их 50MB
                </p>
                {selectedFile && (
                  <p className="mt-4 text-sm font-semibold text-[#C9A84C]">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#A68940] py-3.5 font-bold text-black transition-all hover:opacity-90 disabled:opacity-50"
              >
                {isUploading ? 'Илгээж байна...' : 'Аудио файл нэмэх'}
              </button>
            </section>
          )}

          {activeTab === 'files' && (
            <section className="mt-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {audioFiles.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[#111118] py-12 text-center text-[#7A7570]">
                    Одоогоор аудио файл байхгүй байна
                  </div>
                ) : (
                  audioFiles.map((file) => (
                    <div
                      key={file.id}
                      className="rounded-xl border border-[rgba(245,240,232,0.06)] bg-[#111118] p-4"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(201,168,76,0.1)] text-xl font-bold text-[#C9A84C]">
                          A
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#F5F0E8]">{file.filename}</p>
                          <p className="text-xs text-[#7A7570]">
                            {file.duration}s • {file.format}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === 'analysis' && (
            <section className="mt-8">
              <div className="mb-6 rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5 sm:p-6">
                <h3 className="text-lg font-bold text-[#F5F0E8]">Шинэ анализ эхлүүлэх</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    value={selectedAnalysisFileId}
                    onChange={(e) => setSelectedAnalysisFileId(e.target.value)}
                    className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] p-3 text-sm"
                  >
                    <option value="">Аудио файл сонгох...</option>
                    {audioFiles.map((file) => (
                      <option key={file.id} value={file.id}>
                        {file.filename}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAnalyze}
                    disabled={!selectedAnalysisFileId || isAnalyzing}
                    className="rounded-lg bg-[rgba(201,168,76,0.14)] px-5 py-3 text-sm font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.24)] disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Анализ хийж байна...' : 'Анализ хийх'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {analysisResults.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[#111118] py-12 text-center text-[#7A7570]">
                    Одоогоор анализ хийгдээгүй байна
                  </div>
                ) : (
                  analysisResults.map((result) => (
                    <div
                      key={result.id}
                      className="rounded-xl border border-[rgba(245,240,232,0.06)] bg-[#111118] p-6"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-[#F5F0E8]">AI Mix Анализ</h4>
                        <span className="text-2xl font-bold text-[#C9A84C]">
                          {result.overall_score}/100
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#7A7570]">Loudness (LUFS)</span>
                          <span>{result.loudness_lufs.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A7570]">Пик түвшин (dBFS)</span>
                          <span>{result.peak_level_dbfs.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A7570]">Динамик</span>
                          <span>{result.dynamic_range_db.toFixed(1)} dB</span>
                        </div>
                      </div>

                      {result.frequency_balance && (
                        <div className="mt-4 border-t border-[rgba(245,240,232,0.06)] pt-4">
                          <p className="mb-2 text-sm text-[#7A7570]">Баланс</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded bg-[#0A0A0F] p-2 text-center">
                              <p className="text-[#7A7570]">Доод</p>
                              <p className="font-bold">{result.frequency_balance.low_presence}</p>
                            </div>
                            <div className="rounded bg-[#0A0A0F] p-2 text-center">
                              <p className="text-[#7A7570]">Дунд</p>
                              <p className="font-bold">{result.frequency_balance.mid_presence}</p>
                            </div>
                            <div className="rounded bg-[#0A0A0F] p-2 text-center">
                              <p className="text-[#7A7570]">Дээд</p>
                              <p className="font-bold">{result.frequency_balance.high_presence}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-4 border-t border-[rgba(245,240,232,0.06)] pt-4">
                          <p className="mb-2 text-sm text-[#7A7570]">Саналууд</p>
                          <ul className="space-y-1 text-sm">
                            {result.recommendations.map((rec, i) => (
                              <li key={i} className="text-[#C9A84C]">
                                • {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === 'mentor' && (
            <section className="mt-8">
              <div className="rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5 sm:p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-[#F5F0E8]">Ментортой чат</h3>
                  <p className="mt-1 text-sm text-[#8f8779]">
                    Ментороо сонгоод шууд зөвлөгөө авна уу.
                  </p>
                  <div className="relative mt-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {teachers.map((mentor) => (
                        <button
                          key={mentor.id}
                          onMouseEnter={() => openMentorPreview(mentor.id)}
                          onMouseLeave={closeMentorPreview}
                          onClick={() => setSelectedMentorId(mentor.id)}
                          className={`flex min-w-[150px] items-center gap-2 rounded-full border px-2.5 py-1.5 text-left transition ${
                            selectedMentorId === mentor.id
                              ? 'border-[rgba(201,168,76,0.46)] bg-[rgba(201,168,76,0.08)]'
                              : 'border-[rgba(245,240,232,0.08)] bg-[#10111a] hover:border-[rgba(201,168,76,0.22)]'
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] text-xs font-bold text-[#E8C96D]">
                            {mentor.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#F5F0E8]">
                              {mentor.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {previewMentor && (
                      <div
                        onMouseEnter={() => openMentorPreview(previewMentor.id)}
                        onMouseLeave={closeMentorPreview}
                        className="mt-3 rounded-xl border border-[rgba(217,195,138,0.25)] bg-[#0d0f15] p-4 md:absolute md:right-0 md:top-full md:z-20 md:mt-2 md:w-[380px] md:shadow-[0_20px_44px_rgba(0,0,0,0.45)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,168,76,0.34)] bg-[rgba(201,168,76,0.12)] text-xl font-bold text-[#E8C96D]">
                              {previewMentor.name[0]}
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8f8779]">
                                Mentor Profile
                              </p>
                              <h4 className="mt-1 text-lg font-bold text-[#F5F0E8]">
                                {previewMentor.name}
                              </h4>
                              <p className="text-xs text-[#a89f8b]">
                                {previewMentor.role} • {previewMentor.specialty}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-full border border-[rgba(217,195,138,0.3)] bg-[rgba(217,195,138,0.12)] px-2.5 py-1 text-xs font-semibold text-[#E8C96D]">
                            {previewMentor.stats?.rating || '-'} / 5
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-[#b8ad93]">{previewMentor.bio}</p>

                        {previewMentor.instruments && previewMentor.instruments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {previewMentor.instruments.map((tool) => (
                              <span
                                key={tool}
                                className="rounded-full border border-[rgba(245,240,232,0.1)] bg-[rgba(245,240,232,0.03)] px-2.5 py-1 text-xs text-[#c7b88f]"
                              >
                                {tool}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="max-h-[420px] min-h-[320px] space-y-3 overflow-y-auto rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#0A0A0F] p-4">
                  {selectedMentor && (
                    <div className="mb-3 flex items-center gap-2">
                      <button
                        onMouseEnter={() => openMentorPreview(selectedMentor.id)}
                        onMouseLeave={closeMentorPreview}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] text-[11px] font-bold text-[#E8C96D] transition hover:scale-105"
                      >
                        {selectedMentor.name[0]}
                      </button>
                      <p className="text-xs uppercase tracking-[0.16em] text-[#8f8779]">
                        Mentor: {selectedMentor.name}
                      </p>
                    </div>
                  )}
                  {currentMentorMessages.length === 0 ? (
                    <p className="text-sm text-[#7A7570]">
                      {selectedMentor
                        ? `${selectedMentor.name}-д асуултаа бичээд зөвлөгөө аваарай.`
                        : 'Ментор сонгоно уу.'}
                    </p>
                  ) : (
                    currentMentorMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
                          message.role === 'user'
                            ? 'ml-auto bg-[rgba(201,168,76,0.18)] text-[#f5e7bc]'
                            : 'bg-[#161722] text-[#d4d0c8]'
                        }`}
                      >
                        {message.content}
                      </div>
                    ))
                  )}
                  <div ref={mentorEndRef} />
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    value={mentorInput}
                    onChange={(e) => setMentorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMentorMessage();
                      }
                    }}
                    placeholder={
                      selectedMentor
                        ? `${selectedMentor.name}-д асуултаа бичнэ үү...`
                        : 'Асуултаа бичнэ үү...'
                    }
                    className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-4 py-3 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.35)]"
                  />
                  <button
                    onClick={handleSendMentorMessage}
                    disabled={!mentorInput.trim() || isSendingMentorMessage}
                    className="rounded-lg bg-[rgba(201,168,76,0.14)] px-5 py-3 text-sm font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.24)] disabled:opacity-50"
                  >
                    {isSendingMentorMessage ? 'Илгээж байна...' : 'Илгээх'}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
