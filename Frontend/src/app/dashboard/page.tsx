'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import apiService from '@/services/api';
import type { AudioFile, MixingAnalysisResult } from '@/types';
import { courses, teachers } from '@/lib/data';

type DashboardTab = 'courses' | 'upload' | 'files' | 'analysis';

const tabs: Array<{ id: DashboardTab; label: string; hint: string; mark: string }> = [
  { id: 'courses', label: 'Самбар', hint: 'Суралцах урсгал', mark: '01' },
  { id: 'upload', label: 'Файл нэмэх', hint: 'Demo, bounce, loop', mark: '02' },
  { id: 'files', label: 'Файлууд', hint: 'Таны аудио сан', mark: '03' },
  { id: 'analysis', label: 'Mix шинжилгээ', hint: 'Balance, loudness', mark: '04' },
];

const formatPrice = (price: number) => (price === 0 ? 'Үнэгүй' : `₮${price.toLocaleString()}`);

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Саяхан';
  return new Intl.DateTimeFormat('mn-MN', { month: 'short', day: 'numeric' }).format(
    new Date(value)
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('courses');
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [analysisResults, setAnalysisResults] = useState<MixingAnalysisResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAnalysisFileId, setSelectedAnalysisFileId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      console.error('Error loading dashboard data:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  const displayName = useMemo(() => {
    const name = user?.email?.split('@')[0] || 'producer';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [user?.email]);

  const totalLessons = useMemo(
    () => courses.reduce((sum, course) => sum + (course.curriculum?.length || 0), 0),
    []
  );

  const totalMinutes = useMemo(
    () =>
      courses.reduce(
        (sum, course) =>
          sum + course.curriculum.reduce((lessonSum, lesson) => lessonSum + lesson.durationMinutes, 0),
        0
      ),
    []
  );

  const studioScore = Math.min(
    96,
    48 + Math.min(courses.length, 12) * 2 + audioFiles.length * 3 + analysisResults.length * 4
  );

  const featuredCourses = courses.slice(0, 3);
  const mentorList = teachers.slice(0, 3);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedFormats = ['.wav', '.mp3', '.flac', '.ogg', '.midi'];
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

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Файлаа сонгоно уу');
      return;
    }

    setIsUploading(true);
    try {
      await apiService.uploadAudio(selectedFile);
      toast.success('Аудио файл нэмэгдлээ');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
      setActiveTab('files');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Файл нэмэхэд алдаа гарлаа';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedAnalysisFileId) {
      toast.error('Шинжилгээ хийх файлаа сонгоно уу');
      return;
    }

    setIsAnalyzing(true);
    try {
      toast.info('Аудио шинжилж байна...');
      await apiService.analyzeAudio(selectedAnalysisFileId);
      toast.success('Шинжилгээ дууслаа');
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Шинжилгээ амжилтгүй боллоо';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090A0D]">
        <div className="studio-panel rounded-2xl px-6 py-4 text-sm text-[#b8ad93]">
          Самбарыг ачаалж байна...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#090A0D] px-3 py-4 text-[#F5F0E8] sm:px-5 lg:p-7">
      <section className="mx-auto grid min-h-[calc(100vh-56px)] w-full max-w-[1480px] overflow-hidden rounded-[34px] border border-[rgba(245,240,232,0.08)] bg-[linear-gradient(145deg,rgba(245,240,232,0.045),rgba(8,9,12,0.96)_42%),#0B0C10] shadow-[0_34px_110px_rgba(0,0,0,0.55)] lg:grid-cols-[230px_minmax(0,1fr)_294px]">
        <aside className="border-b border-[rgba(245,240,232,0.07)] bg-[rgba(245,240,232,0.025)] p-5 lg:border-b-0 lg:border-r">
          <Link href="/" className="flex items-center gap-3">
            <span className="nav-logo-icon" aria-hidden />
            <span
              className="text-[24px] uppercase text-[var(--gold)]"
              style={{ fontFamily: 'var(--font-bebas)', letterSpacing: '0.12em' }}
            >
              Melodex
            </span>
          </Link>

          <div className="mt-8 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex min-h-[68px] items-center gap-3 rounded-2xl border px-3 text-left transition ${
                  activeTab === tab.id
                    ? 'border-[rgba(201,169,78,0.34)] bg-[rgba(201,169,78,0.11)] text-[#F5F0E8]'
                    : 'border-transparent bg-transparent text-[#8f8779] hover:border-[rgba(245,240,232,0.08)] hover:bg-white/[0.035] hover:text-[#F5F0E8]'
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-[11px] font-black ${
                    activeTab === tab.id
                      ? 'border-[rgba(201,169,78,0.5)] text-[#E8C96D]'
                      : 'border-[rgba(245,240,232,0.1)] text-[#756f62]'
                  }`}
                >
                  {tab.mark}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{tab.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#756f62]">
                    {tab.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 hidden rounded-3xl border border-[rgba(245,240,232,0.08)] bg-[rgba(8,9,12,0.42)] p-4 lg:block">
            <p className="studio-kicker">Түр холбоос</p>
            <div className="mt-4 space-y-2">
              <Link
                href="/courses"
                className="studio-ghost-button flex items-center justify-between rounded-2xl px-3 py-2 text-sm"
              >
                Курсууд <span>↗</span>
              </Link>
              <Link
                href="/chat"
                className="studio-ghost-button flex items-center justify-between rounded-2xl px-3 py-2 text-sm"
              >
                Studio mentor <span>↗</span>
              </Link>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 hidden text-sm font-semibold text-[#9a8f78] transition hover:text-[#E8C96D] lg:block"
          >
            Гарах
          </button>
        </aside>

        <section className="min-w-0 p-4 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="studio-kicker">Өнөөдрийн студи</p>
              <h1 className="mt-2 font-display text-[clamp(28px,4vw,46px)] font-black leading-none">
                Сайн байна уу, {displayName}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="studio-input hidden h-12 min-w-[290px] items-center gap-3 rounded-full px-4 text-sm text-[#756f62] md:flex">
                <span className="h-2 w-2 rounded-full bg-[#7DD3A8]" />
                Курс, beat, mix хайх...
              </div>
              <Link
                href="/chat"
                className="studio-button inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-black"
              >
                Ментор
              </Link>
            </div>
          </div>

          {activeTab === 'courses' && (
            <div className="mt-6 space-y-6">
              <section className="relative overflow-hidden rounded-[30px] border border-[rgba(201,169,78,0.18)] bg-[linear-gradient(135deg,rgba(201,169,78,0.22),rgba(127,164,168,0.1)_48%,rgba(245,240,232,0.04)),#111319] p-6 sm:p-8">
                <div className="max-w-[560px]">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E8C96D]">
                    Сургалтын урсгал
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(30px,5vw,58px)] font-black leading-[0.95]">
                    Beat-ээ эхлүүлээд mix хүртэл цэгцтэй яв.
                  </h2>
                  <p className="mt-4 max-w-[470px] text-sm leading-7 text-[#c7baa0]">
                    Хичээлээ үргэлжлүүлж, demo файлаа хадгалж, хэрэгтэй үед Studio mentor-оос
                    асуугаарай.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/courses" className="studio-button rounded-full px-5 py-3 text-sm font-black">
                      Курс сонгох
                    </Link>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="studio-ghost-button rounded-full px-5 py-3 text-sm font-bold"
                    >
                      Demo нэмэх
                    </button>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-5 right-5 hidden h-[170px] w-[260px] items-end justify-center gap-2 opacity-80 lg:flex">
                  {[36, 62, 48, 88, 70, 112, 82, 132, 96, 58, 78, 44].map((height, index) => (
                    <span
                      key={index}
                      className="w-3 rounded-full bg-[linear-gradient(180deg,#E8C96D,#7FA4A8)]"
                      style={{ height }}
                    />
                  ))}
                </div>
              </section>

              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="Нийт курс" value={courses.length.toString()} detail={`${totalLessons} хичээл`} />
                <MetricCard label="Суралцах цаг" value={`${Math.round(totalMinutes / 60)}ц`} detail="хичээлийн сан" />
                <MetricCard label="Mix файл" value={audioFiles.length.toString()} detail={`${analysisResults.length} шинжилгээ`} />
              </div>

              <section>
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold">Үргэлжлүүлэн сурах</h2>
                  <Link href="/courses" className="text-sm font-bold text-[#E8C96D]">
                    Бүгдийг үзэх
                  </Link>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {featuredCourses.map((course, index) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="group overflow-hidden rounded-[24px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.04)] transition hover:-translate-y-1 hover:border-[rgba(201,169,78,0.32)]"
                    >
                      <div className="relative h-32 bg-[linear-gradient(135deg,rgba(201,169,78,0.2),rgba(127,164,168,0.16)),#11141B] p-4">
                        <span className="rounded-full bg-[#090A0D]/70 px-3 py-1 text-[11px] font-bold text-[#E8C96D]">
                          {course.level}
                        </span>
                        <span className="absolute bottom-4 left-4 text-[56px] font-black leading-none text-white/[0.06]">
                          0{index + 1}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 min-h-[44px] font-bold leading-snug text-[#F5F0E8] group-hover:text-[#E8C96D]">
                          {course.title}
                        </h3>
                        <div className="mt-4 flex items-center justify-between text-xs text-[#8f8779]">
                          <span>{course.curriculum.length} хичээл</span>
                          <span>{formatPrice(course.price)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-[26px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.035)] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold">Өнөөдрийн хийх зүйл</h2>
                  <span className="text-xs font-bold text-[#8f8779]">дасгалын жагсаалт</span>
                </div>
                <TaskRow step="01" title="Drum pattern давтах" meta="15 минут" />
                <TaskRow step="02" title="Нэг demo bounce хийж хадгалах" meta="WAV эсвэл MP3" />
                <TaskRow step="03" title="Kick ба 808 balance шалгах" meta="EQ + level" />
              </section>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
              <section className="rounded-[30px] border border-dashed border-[rgba(201,169,78,0.28)] bg-[rgba(245,240,232,0.035)] p-6 sm:p-8">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".wav,.mp3,.flac,.ogg,.midi"
                  className="hidden"
                  disabled={isUploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[310px] w-full flex-col items-center justify-center rounded-[26px] border border-[rgba(245,240,232,0.08)] bg-[#090A0D]/55 p-8 text-center transition hover:border-[rgba(201,169,78,0.35)] hover:bg-[rgba(201,169,78,0.05)]"
                >
                  <span className="grid h-20 w-20 place-items-center rounded-full border border-[rgba(201,169,78,0.25)] text-3xl text-[#E8C96D]">
                    +
                  </span>
                  <span className="mt-5 text-xl font-black">
                    {selectedFile ? selectedFile.name : 'Аудио файлаа сонгох'}
                  </span>
                  <span className="mt-2 max-w-[360px] text-sm leading-6 text-[#8f8779]">
                    WAV, MP3, FLAC, OGG, MIDI формат дэмжинэ. Хамгийн ихдээ 50MB.
                  </span>
                </button>
                {selectedFile && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3">
                    <span className="text-sm text-[#c8bea8]">{formatFileSize(selectedFile.size)}</span>
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="studio-button rounded-full px-5 py-2.5 text-sm font-black disabled:opacity-50"
                    >
                      {isUploading ? 'Илгээж байна...' : 'Файл нэмэх'}
                    </button>
                  </div>
                )}
              </section>

              <section className="rounded-[30px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.035)] p-5">
                <p className="studio-kicker">Файл нэмэх зөвлөмж</p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-[#b8ad93]">
                  <p>Нэрээ ойлгомжтой өгвөл дараа нь mix шинжилгээ сонгоход амар.</p>
                  <p>Master хийгээгүй rough bounce оруулбал balance алдааг илүү тод харна.</p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'files' && (
            <section className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Таны аудио сан</h2>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="studio-ghost-button rounded-full px-4 py-2 text-sm font-bold"
                >
                  Файл нэмэх
                </button>
              </div>
              {audioFiles.length === 0 ? (
                <EmptyPanel title="Одоогоор аудио файл байхгүй байна" action="Эхний demo файлаа нэмээд mix шинжилгээ туршаарай." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {audioFiles.map((file) => (
                    <div key={file.id} className="rounded-[24px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.035)] p-4">
                      <div className="flex items-center gap-4">
                        <div className="studio-wave-bars h-14 w-20 rounded-2xl bg-[#090A0D]/60 px-3 py-2">
                          {[24, 36, 18, 44, 30, 52, 22].map((height, index) => (
                            <span key={index} style={{ height }} />
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{file.filename}</p>
                          <p className="mt-1 text-xs text-[#8f8779]">
                            {formatFileSize(file.file_size)} · {file.format} · {formatDate(file.uploaded_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'analysis' && (
            <section className="mt-6 space-y-5">
              <div className="rounded-[28px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.035)] p-5">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <select
                    value={selectedAnalysisFileId}
                    onChange={(e) => setSelectedAnalysisFileId(e.target.value)}
                    className="studio-select w-full rounded-2xl px-4 py-3 text-sm"
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
                    className="studio-button rounded-2xl px-5 py-3 text-sm font-black disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Шинжилж байна...' : 'Шинжилгээ хийх'}
                  </button>
                </div>
              </div>

              {analysisResults.length === 0 ? (
                <EmptyPanel title="Одоогоор шинжилгээ хийгдээгүй байна" action="Файл нэмээд loudness, peak, dynamic range-ээ шалгаарай." />
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {analysisResults.map((result) => (
                    <AnalysisCard key={result.id} result={result} />
                  ))}
                </div>
              )}
            </section>
          )}
        </section>

        <aside className="border-t border-[rgba(245,240,232,0.07)] bg-[rgba(245,240,232,0.025)] p-5 lg:border-l lg:border-t-0">
          <div className="rounded-[30px] border border-[rgba(245,240,232,0.08)] bg-[#090A0D]/46 p-5 text-center">
            <div
              className="mx-auto grid h-24 w-24 place-items-center rounded-full p-1"
              style={{
                background: `conic-gradient(#E8C96D ${studioScore * 3.6}deg, rgba(245,240,232,0.08) 0deg)`,
              }}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-[#0B0C10]">
                <span className="text-2xl font-black">{displayName.charAt(0)}</span>
              </div>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold">{displayName}</h2>
            <p className="mt-1 text-xs text-[#8f8779]">{user.email}</p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <MiniStat value={courses.length} label="курс" />
              <MiniStat value={audioFiles.length} label="файл" />
              <MiniStat value={analysisResults.length} label="mix" />
            </div>
          </div>

          <div className="mt-5 rounded-[30px] border border-[rgba(245,240,232,0.08)] bg-[#090A0D]/46 p-5">
            <div className="flex items-center justify-between">
              <p className="studio-kicker">Ахиц</p>
              <span className="text-sm font-black text-[#E8C96D]">{studioScore}%</span>
            </div>
            <div className="mt-5 flex h-28 items-end justify-between gap-2">
              {[34, 52, 46, 76, 66, 92, 58].map((height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t-full bg-[linear-gradient(180deg,#E8C96D,#7FA4A8)] opacity-85"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[30px] border border-[rgba(245,240,232,0.08)] bg-[#090A0D]/46 p-5">
            <div className="flex items-center justify-between">
              <p className="studio-kicker">Менторууд</p>
              <Link href="/courses" className="text-xs font-bold text-[#E8C96D]">
                үзэх
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {mentorList.map((mentor) => (
                <div key={mentor.id} className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(201,169,78,0.22)] bg-[rgba(201,169,78,0.08)] text-sm font-black text-[#E8C96D]">
                    {mentor.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{mentor.name}</p>
                    <p className="truncate text-xs text-[#756f62]">{mentor.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[30px] border border-[rgba(201,169,78,0.18)] bg-[rgba(201,169,78,0.08)] p-5">
            <p className="text-sm font-bold text-[#F5F0E8]">Асуух зүйл гарвал</p>
            <p className="mt-2 text-sm leading-6 text-[#b8ad93]">
              Kick, 808, melody, EQ, arrangement гээд сурах явцдаа шууд асуугаарай.
            </p>
            <Link
              href="/chat"
              className="studio-button mt-4 inline-flex w-full justify-center rounded-full px-4 py-3 text-sm font-black"
            >
              Studio mentor нээх
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.04)] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8f8779]">{label}</p>
      <p className="mt-2 font-display text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs text-[#756f62]">{detail}</p>
    </div>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] px-2 py-3">
      <p className="font-display text-xl font-black">{value}</p>
      <p className="text-[11px] text-[#8f8779]">{label}</p>
    </div>
  );
}

function TaskRow({ step, title, meta }: { step: string; title: string; meta: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-[rgba(245,240,232,0.07)] py-3 first:border-t-0">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.04] text-[11px] font-black text-[#E8C96D]">
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-[#756f62]">{meta}</p>
      </div>
    </div>
  );
}

function EmptyPanel({ title, action }: { title: string; action: string }) {
  return (
    <div className="rounded-[28px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.035)] px-6 py-14 text-center">
      <p className="font-display text-2xl font-bold text-[#F5F0E8]">{title}</p>
      <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-[#8f8779]">{action}</p>
    </div>
  );
}

function AnalysisCard({ result }: { result: MixingAnalysisResult }) {
  return (
    <div className="rounded-[26px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.035)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="studio-kicker">Mix тайлан</p>
          <h3 className="mt-2 font-display text-2xl font-bold">Шинжилгээ</h3>
        </div>
        <span className="rounded-2xl bg-[rgba(201,169,78,0.12)] px-4 py-2 font-display text-2xl font-black text-[#E8C96D]">
          {result.overall_score}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ReportValue label="LUFS" value={result.loudness_lufs.toFixed(1)} />
        <ReportValue label="Peak" value={result.peak_level_dbfs.toFixed(1)} />
        <ReportValue label="Range" value={`${result.dynamic_range_db.toFixed(1)}dB`} />
      </div>

      {result.frequency_balance && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8f8779]">
            Давтамжийн баланс
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <ReportValue label="Low" value={String(result.frequency_balance.low_presence)} />
            <ReportValue label="Mid" value={String(result.frequency_balance.mid_presence)} />
            <ReportValue label="High" value={String(result.frequency_balance.high_presence)} />
          </div>
        </div>
      )}

      {result.recommendations?.length > 0 && (
        <div className="mt-5 border-t border-[rgba(245,240,232,0.08)] pt-4">
          <p className="mb-2 text-sm font-bold text-[#F5F0E8]">Зөвлөмж</p>
          <ul className="space-y-2 text-sm leading-6 text-[#c8bea8]">
            {result.recommendations.slice(0, 3).map((rec, index) => (
              <li key={`${rec}-${index}`}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReportValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#090A0D]/55 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#756f62]">{label}</p>
      <p className="mt-1 font-display text-xl font-black">{value}</p>
    </div>
  );
}
