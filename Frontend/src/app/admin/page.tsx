'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getIsAdmin } from '@/lib/admin';
import { courses } from '@/lib/data';
import { getSupabaseSetupMessage, isMissingTableError } from '@/lib/supabase-errors';
import { normalizeYouTubeVideoId } from '@/lib/youtube';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });

type AdminTab = 'overview' | 'users' | 'courses' | 'add-course' | 'knowledge' | 'activity' | 'system';

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type KnowledgeBaseRow = {
  id: string;
  category: string;
  question: string;
  answer: string;
  source: string | null;
  created_at: string | null;
};

type ChatMessageRow = {
  id: string;
  user_id: string;
  user_message: string;
  ai_response: string | null;
  category: string | null;
  created_at: string | null;
};

type AudioFileRow = {
  id: string;
  user_id: string;
  filename: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  is_processed: boolean | null;
  created_at: string | null;
};

type PaymentRow = {
  id: string;
  user_id: string;
  course_id: string | null;
  amount: number;
  currency: string | null;
  status: string | null;
  payment_method: string | null;
  created_at: string | null;
};

type AdminCounts = {
  users: number;
  audioFiles: number;
  analyses: number;
  chats: number;
  purchases: number;
  completedLessons: number;
  progressRows: number;
  knowledgeItems: number;
  marketplaceItems: number;
  payments: number;
};

type KnowledgeForm = {
  category: string;
  question: string;
  answer: string;
  source: string;
};

type LessonForm = {
  title: string;
  youtubeId: string;
  durationMinutes: number;
  summary: string;
  exercise: string;
  takeaway: string;
};

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'courses', label: 'Courses' },
  { id: 'add-course', label: 'Add course' },
  { id: 'knowledge', label: 'Knowledge base' },
  { id: 'activity', label: 'Activity' },
  { id: 'system', label: 'System' },
];

const emptyCounts: AdminCounts = {
  users: 0,
  audioFiles: 0,
  analyses: 0,
  chats: 0,
  purchases: 0,
  completedLessons: 0,
  progressRows: 0,
  knowledgeItems: 0,
  marketplaceItems: 0,
  payments: 0,
};

const initialKnowledgeForm: KnowledgeForm = {
  category: '',
  question: '',
  answer: '',
  source: '',
};

const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const formatBytes = (bytes: number | null) => {
  if (!bytes || bytes <= 0) return '-';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
};

const getCount = async (table: string) => {
  const { count, error } = await supabase.from(table).select('*', {
    count: 'exact',
    head: true,
  });

  if (error) throw error;
  return count ?? 0;
};

const getCourseSetupErrorMessage = () =>
  getSupabaseSetupMessage('Course болон lesson нэмэх');

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [counts, setCounts] = useState<AdminCounts>(emptyCounts);
  const [dbCourseCount, setDbCourseCount] = useState(0);
  const [dbLessonCount, setDbLessonCount] = useState(0);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseRow[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessageRow[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFileRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [knowledgeForm, setKnowledgeForm] = useState<KnowledgeForm>(initialKnowledgeForm);
  const [savingKnowledge, setSavingKnowledge] = useState(false);

  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('music-production');
  const [courseLevel, setCourseLevel] = useState('beginner');
  const [courseSlug, setCourseSlug] = useState('');
  const [courseTeacherName, setCourseTeacherName] = useState('');
  const [lessons, setLessons] = useState<LessonForm[]>([]);
  const [savingCourse, setSavingCourse] = useState(false);

  const totalLessons = useMemo(
    () => courses.reduce((sum, course) => sum + course.curriculum.length, 0),
    []
  );

  const lessonsWithVideo = useMemo(
    () =>
      courses.reduce(
        (sum, course) => sum + course.curriculum.filter((lesson) => Boolean(lesson.youtubeId)).length,
        0
      ),
    []
  );

  const courseMinutes = useMemo(
    () =>
      courses.reduce(
        (sum, course) =>
          sum + course.curriculum.reduce((lessonSum, lesson) => lessonSum + lesson.durationMinutes, 0),
        0
      ),
    []
  );

  const revenue = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'paid' || payment.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );

  const filteredProfiles = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter((profile) =>
      [profile.id, profile.full_name || '', profile.bio || ''].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [profiles, userSearch]);

  const loadAdminData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [
        users,
        audioFilesCount,
        analyses,
        chats,
        purchases,
        completedLessons,
        progressRows,
        knowledgeItems,
        marketplaceItems,
        paymentsCount,
        dbCourseRows,
        dbLessonRows,
      ] = await Promise.all([
        getCount('profiles'),
        getCount('audio_files'),
        getCount('mixing_analysis'),
        getCount('chat_messages'),
        getCount('purchased_courses'),
        getCount('completed_lessons'),
        getCount('course_progress'),
        getCount('knowledge_base'),
        getCount('marketplace_items'),
        getCount('payments'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
      ]);

      setDbCourseCount(dbCourseRows.count ?? 0);
      setDbLessonCount(dbLessonRows.count ?? 0);

      setCounts({
        users,
        audioFiles: audioFilesCount,
        analyses,
        chats,
        purchases,
        completedLessons,
        progressRows,
        knowledgeItems,
        marketplaceItems,
        payments: paymentsCount,
      });

      const [profilesResult, knowledgeResult, chatsResult, audioResult, paymentsResult] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, avatar_url, bio, is_admin, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(80),
          supabase
            .from('knowledge_base')
            .select('id, category, question, answer, source, created_at')
            .order('created_at', { ascending: false })
            .limit(80),
          supabase
            .from('chat_messages')
            .select('id, user_id, user_message, ai_response, category, created_at')
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('audio_files')
            .select('id, user_id, filename, file_size_bytes, mime_type, is_processed, created_at')
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('payments')
            .select('id, user_id, course_id, amount, currency, status, payment_method, created_at')
            .order('created_at', { ascending: false })
            .limit(30),
        ]);

      if (profilesResult.error) throw profilesResult.error;
      if (knowledgeResult.error) throw knowledgeResult.error;
      if (chatsResult.error) throw chatsResult.error;
      if (audioResult.error) throw audioResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setProfiles((profilesResult.data || []) as ProfileRow[]);
      setKnowledgeBase((knowledgeResult.data || []) as KnowledgeBaseRow[]);
      setChatMessages((chatsResult.data || []) as ChatMessageRow[]);
      setAudioFiles((audioResult.data || []) as AudioFileRow[]);
      setPayments((paymentsResult.data || []) as PaymentRow[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load admin data.';
      toast.error(message);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        router.replace('/admin/login');
        return;
      }

      setCurrentUserId(session.user.id);
      setCurrentEmail(session.user.email || '');

      if (!mounted) return;

      try {
        const allowed = await getIsAdmin(session.user.id);
        if (!mounted) return;
        setIsAdmin(allowed);
        setAuthLoading(false);
        if (allowed) {
          await loadAdminData();
        }
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : 'Could not verify admin access.';
        toast.error(message);
        setAuthLoading(false);
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [loadAdminData, router]);

  const handleAdminToggle = async (profile: ProfileRow) => {
    if (profile.id === currentUserId) {
      toast.error('You cannot remove admin access from your own account here.');
      return;
    }

    const nextValue = !profile.is_admin;
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: nextValue, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(nextValue ? 'User promoted to admin.' : 'Admin access removed.');
    await loadAdminData();
  };

  const handleKnowledgeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const category = knowledgeForm.category.trim();
    const question = knowledgeForm.question.trim();
    const answer = knowledgeForm.answer.trim();
    const source = knowledgeForm.source.trim();

    if (!category || !question || !answer) {
      toast.error('Category, question, and answer are required.');
      return;
    }

    setSavingKnowledge(true);
    const { error } = await supabase.from('knowledge_base').insert({
      category,
      question,
      answer,
      source: source || null,
    });

    setSavingKnowledge(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Knowledge base entry added.');
    setKnowledgeForm(initialKnowledgeForm);
    await loadAdminData();
  };

  const handleDeleteKnowledge = async (id: string) => {
    const { error } = await supabase.from('knowledge_base').delete().eq('id', id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Knowledge base entry deleted.');
    await loadAdminData();
  };

  const addLesson = () => {
    setLessons((prev) => [
      ...prev,
      { title: '', youtubeId: '', durationMinutes: 0, summary: '', exercise: '', takeaway: '' },
    ]);
  };

  const removeLesson = (index: number) => {
    setLessons((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLesson = (index: number, field: keyof LessonForm, value: string | number) => {
    setLessons((prev) =>
      prev.map((lesson, i) => (i === index ? { ...lesson, [field]: value } : lesson))
    );
  };

  const handleCourseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = courseTitle.trim();
    const description = courseDescription.trim();
    const slug = courseSlug.trim();
    const teacherName = courseTeacherName.trim();

    if (!title || !slug) {
      toast.error('Course title and slug are required.');
      return;
    }

    const validLessons = lessons.filter((l) => l.title.trim());
    if (validLessons.length === 0) {
      toast.error('Add at least one lesson with a title.');
      return;
    }

    setSavingCourse(true);

    try {
      const courseId = `db-${Date.now()}`;
      const { error: courseError } = await supabase.from('courses').insert({
        course_id: courseId,
        title,
        description,
        category: courseCategory,
        level: courseLevel,
        slug,
        teacher_name: teacherName || 'melodex',
        price: 0,
      });

      if (courseError) {
        toast.error(
          isMissingTableError(courseError, 'courses')
            ? getCourseSetupErrorMessage()
            : courseError.message
        );
        return;
      }

      const lessonRows = validLessons.map((lesson, index) => ({
        course_id: courseId,
        lesson_id: `${courseId}-${index + 1}`,
        title: lesson.title.trim(),
        youtube_id: normalizeYouTubeVideoId(lesson.youtubeId) || null,
        duration_minutes: lesson.durationMinutes || 0,
        summary: lesson.summary.trim() || null,
        exercise: lesson.exercise.trim() || null,
        takeaway: lesson.takeaway.trim() || null,
        content_type: normalizeYouTubeVideoId(lesson.youtubeId) ? 'video' : 'brief',
        free: false,
        sort_order: index,
      }));

      const { error: lessonsError } = await supabase.from('lessons').insert(lessonRows);

      if (lessonsError) {
        await supabase.from('courses').delete().eq('course_id', courseId);
        toast.error(
          isMissingTableError(lessonsError, 'lessons')
            ? getCourseSetupErrorMessage()
            : lessonsError.message
        );
        return;
      }

      toast.success('Course and lessons saved.');
      setCourseTitle('');
      setCourseDescription('');
      setCourseSlug('');
      setCourseTeacherName('');
      setLessons([]);
    } finally {
      setSavingCourse(false);
    }
  };

  const metricCards = [
    { label: 'Users', value: counts.users },
    { label: 'Static courses', value: courses.length },
    { label: 'DB courses', value: dbCourseCount },
    { label: 'DB lessons', value: dbLessonCount },
    { label: 'Total lessons', value: totalLessons },
    { label: 'Video lessons', value: `${lessonsWithVideo}/${totalLessons}` },
    { label: 'Chat messages', value: counts.chats },
    { label: 'Audio files', value: counts.audioFiles },
    { label: 'Analyses', value: counts.analyses },
    { label: 'Knowledge entries', value: counts.knowledgeItems },
    { label: 'Purchases', value: counts.purchases },
    { label: 'Payments', value: counts.payments },
  ];

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0A0A0F] text-[#F5F0E8]">
        Loading admin...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Nav />
        <main className="min-h-screen bg-[#0A0A0F] px-4 pb-16 pt-28 text-[#F5F0E8]">
          <section className="mx-auto max-w-2xl rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a49368]">
              Admin access required
            </p>
            <h1 className="mt-4 font-display text-3xl font-black">This account is not an admin.</h1>
            <p className="mt-3 text-sm leading-6 text-[#9d9587]">
              Sign in with an admin account, or promote your first user with the SQL setup file.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/admin/login"
                className="inline-flex rounded-lg bg-[#C9A84C] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#E8C96D]"
              >
                Switch admin account
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex rounded-lg border border-[rgba(245,240,232,0.12)] px-5 py-3 text-sm font-bold text-[#F5F0E8] transition hover:border-[rgba(201,168,76,0.35)]"
              >
                Back to dashboard
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.08),transparent_36%),#0A0A0F] pb-16 pt-24 text-[#F5F0E8] sm:pt-28">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-8 lg:px-12">
          <section className="flex flex-col gap-5 border-b border-[rgba(245,240,232,0.08)] pb-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a49368]">
                Admin console
              </p>
              <h1 className="mt-3 font-display text-[clamp(32px,4vw,54px)] font-black leading-none">
                Platform control center
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#a9a091]">
                Manage users, course visibility checks, RAG knowledge content, payments, uploads,
                and system readiness from one place.
              </p>
            </div>
            <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] px-4 py-3 text-sm text-[#b8ad93]">
              Signed in as <span className="font-semibold text-[#E8C96D]">{currentEmail}</span>
            </div>
          </section>

          <section className="mt-6">
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(event) => setActiveTab(event.target.value as AdminTab)}
                className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#111118] px-3 py-2 text-sm text-[#F5F0E8]"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden flex-wrap gap-3 sm:flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'border-[rgba(201,168,76,0.45)] bg-[rgba(201,168,76,0.12)] text-[#E8C96D]'
                      : 'border-[rgba(245,240,232,0.08)] bg-[#111118] text-[#8f8779] hover:text-[#F5F0E8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {dataLoading && (
            <div className="mt-5 rounded-lg border border-[rgba(201,168,76,0.22)] bg-[rgba(201,168,76,0.08)] px-4 py-3 text-sm text-[#E8C96D]">
              Refreshing admin data...
            </div>
          )}

          {activeTab === 'overview' && (
            <section className="mt-7">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {metricCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-[#7A7570]">{card.label}</p>
                    <p className="mt-3 font-display text-3xl font-black text-[#F5F0E8]">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                  <h2 className="font-display text-xl font-bold">Course readiness</h2>
                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-2xl font-black text-[#E8C96D]">{courses.length}</p>
                      <p className="text-xs text-[#8f8779]">Static paths</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#E8C96D]">{dbCourseCount}</p>
                      <p className="text-xs text-[#8f8779]">DB courses</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#E8C96D]">{courseMinutes}</p>
                      <p className="text-xs text-[#8f8779]">Total lesson min</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-[#E8C96D]">
                        {Math.round((lessonsWithVideo / Math.max(totalLessons, 1)) * 100)}%
                      </p>
                      <p className="text-xs text-[#8f8779]">Has video</p>
                    </div>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#0A0A0F]">
                    <div
                      className="h-full rounded-full bg-[#C9A84C]"
                      style={{
                        width: `${Math.round((lessonsWithVideo / Math.max(totalLessons, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                  <h2 className="font-display text-xl font-bold">Revenue snapshot</h2>
                  <p className="mt-5 font-display text-4xl font-black text-[#F5F0E8]">
                    {revenue.toLocaleString()} MNT
                  </p>
                  <p className="mt-2 text-sm text-[#8f8779]">
                    From recent paid or completed payments loaded in the admin view.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section className="mt-7 rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold">Users and admins</h2>
                  <p className="mt-1 text-sm text-[#8f8779]">Promote trusted accounts and review profiles.</p>
                </div>
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Search profiles..."
                  className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.35)] sm:max-w-xs"
                />
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.16em] text-[#7A7570]">
                    <tr>
                      <th className="border-b border-[rgba(245,240,232,0.08)] py-3 pr-4">Profile</th>
                      <th className="border-b border-[rgba(245,240,232,0.08)] py-3 pr-4">Role</th>
                      <th className="border-b border-[rgba(245,240,232,0.08)] py-3 pr-4">Joined</th>
                      <th className="border-b border-[rgba(245,240,232,0.08)] py-3 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-[rgba(245,240,232,0.05)]">
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-[#F5F0E8]">
                            {profile.full_name || 'Unnamed user'}
                          </p>
                          <p className="mt-1 max-w-[360px] truncate text-xs text-[#7A7570]">
                            {profile.id}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              profile.is_admin
                                ? 'bg-[rgba(201,168,76,0.14)] text-[#E8C96D]'
                                : 'bg-[rgba(245,240,232,0.06)] text-[#a9a091]'
                            }`}
                          >
                            {profile.is_admin ? 'Admin' : 'Student'}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-[#a9a091]">{formatDate(profile.created_at)}</td>
                        <td className="py-4 pr-4">
                          <button
                            onClick={() => handleAdminToggle(profile)}
                            disabled={profile.id === currentUserId}
                            className="rounded-lg border border-[rgba(201,168,76,0.25)] px-3 py-2 text-xs font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.1)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {profile.is_admin ? 'Remove admin' : 'Make admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'courses' && (
            <section className="mt-7 grid gap-5 lg:grid-cols-2">
              {courses.map((course) => {
                const videoCount = course.curriculum.filter((lesson) => lesson.youtubeId).length;
                return (
                  <article
                    key={course.id}
                    className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-[#a49368]">
                          {course.category} / {course.level}
                        </p>
                        <h2 className="mt-2 font-display text-xl font-bold">{course.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#9d9587]">{course.description}</p>
                      </div>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="shrink-0 rounded-lg bg-[rgba(201,168,76,0.12)] px-3 py-2 text-xs font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.2)]"
                      >
                        View
                      </Link>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#a9a091]">
                      <span className="rounded-full bg-[#0A0A0F] px-2.5 py-1">
                        {course.curriculum.length} lessons
                      </span>
                      <span className="rounded-full bg-[#0A0A0F] px-2.5 py-1">
                        {videoCount} videos
                      </span>
                      <span className="rounded-full bg-[#0A0A0F] px-2.5 py-1">{course.duration}</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {course.curriculum.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(245,240,232,0.06)] bg-[#0A0A0F] px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate">{lesson.title}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-xs ${
                              lesson.youtubeId
                                ? 'bg-[rgba(201,168,76,0.12)] text-[#E8C96D]'
                                : 'bg-[rgba(245,240,232,0.06)] text-[#8f8779]'
                            }`}
                          >
                            {lesson.youtubeId ? lesson.youtubeId : 'No video'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {activeTab === 'add-course' && (
            <section className="mt-7">
              <form onSubmit={handleCourseSubmit} className="space-y-6">
                <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                  <h2 className="font-display text-xl font-bold">Course info</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[#8f8779]">Title *</label>
                      <input
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        placeholder="Course title"
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs text-[#8f8779]">Description</label>
                      <textarea
                        value={courseDescription}
                        onChange={(e) => setCourseDescription(e.target.value)}
                        placeholder="Short course description"
                        rows={3}
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#8f8779]">Slug *</label>
                      <input
                        value={courseSlug}
                        onChange={(e) => setCourseSlug(e.target.value)}
                        placeholder="course-slug"
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#8f8779]">Teacher name</label>
                      <input
                        value={courseTeacherName}
                        onChange={(e) => setCourseTeacherName(e.target.value)}
                        placeholder="Teacher name"
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#8f8779]">Category</label>
                      <select
                        value={courseCategory}
                        onChange={(e) => setCourseCategory(e.target.value)}
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                      >
                        <option value="music-production">Music Production</option>
                        <option value="melody-voice">Melody &amp; Voice</option>
                        <option value="sound-design">Sound Design</option>
                        <option value="mixing-mastering">Mixing &amp; Mastering</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#8f8779]">Level</label>
                      <select
                        value={courseLevel}
                        onChange={(e) => setCourseLevel(e.target.value)}
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-xl font-bold">Lessons</h2>
                    <button
                      type="button"
                      onClick={addLesson}
                      className="rounded-lg border border-[rgba(201,168,76,0.25)] px-3 py-2 text-xs font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.1)]"
                    >
                      + Add lesson
                    </button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {lessons.map((lesson, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-[rgba(245,240,232,0.06)] bg-[#0A0A0F] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#E8C96D]">
                            Lesson {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeLesson(index)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-[#8f8779]">Title *</label>
                            <input
                              value={lesson.title}
                              onChange={(e) => updateLesson(index, 'title', e.target.value)}
                              placeholder="Lesson title"
                              className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-[#8f8779]">YouTube ID or URL</label>
                            <input
                              value={lesson.youtubeId}
                              onChange={(e) => updateLesson(index, 'youtubeId', e.target.value)}
                              placeholder="https://youtu.be/... эсвэл 11 тэмдэгттэй ID"
                              className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-[#8f8779]">Duration (min)</label>
                            <input
                              type="number"
                              value={lesson.durationMinutes}
                              onChange={(e) => updateLesson(index, 'durationMinutes', Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-[#8f8779]">Summary</label>
                            <textarea
                              value={lesson.summary}
                              onChange={(e) => updateLesson(index, 'summary', e.target.value)}
                              placeholder="What the student learns"
                              rows={2}
                              className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-[#8f8779]">Дадлага</label>
                            <input
                              value={lesson.exercise}
                              onChange={(e) => updateLesson(index, 'exercise', e.target.value)}
                              placeholder="Practice task"
                              className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs text-[#8f8779]">Гол санаа</label>
                            <input
                              value={lesson.takeaway}
                              onChange={(e) => updateLesson(index, 'takeaway', e.target.value)}
                              placeholder="Key takeaway"
                              className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#111118] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {lessons.length === 0 && (
                      <p className="py-6 text-center text-sm text-[#8f8779]">
                        Хичээл хараахан нэмэгдээгүй байна. + Хичээл нэмэх товчоор эхлээрэй.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingCourse}
                  className="w-full rounded-lg bg-[#C9A84C] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#E8C96D] disabled:opacity-50"
                >
                  {savingCourse ? 'Saving...' : 'Save course & lessons'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'knowledge' && (
            <section className="mt-7 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <form
                onSubmit={handleKnowledgeSubmit}
                className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5"
              >
                <h2 className="font-display text-xl font-bold">Add RAG answer</h2>
                <div className="mt-5 space-y-4">
                  <input
                    value={knowledgeForm.category}
                    onChange={(event) =>
                      setKnowledgeForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                    placeholder="Category"
                    className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                  />
                  <input
                    value={knowledgeForm.question}
                    onChange={(event) =>
                      setKnowledgeForm((prev) => ({ ...prev, question: event.target.value }))
                    }
                    placeholder="Question"
                    className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                  />
                  <textarea
                    value={knowledgeForm.answer}
                    onChange={(event) =>
                      setKnowledgeForm((prev) => ({ ...prev, answer: event.target.value }))
                    }
                    placeholder="Answer"
                    rows={6}
                    className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                  />
                  <input
                    value={knowledgeForm.source}
                    onChange={(event) =>
                      setKnowledgeForm((prev) => ({ ...prev, source: event.target.value }))
                    }
                    placeholder="Source"
                    className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm outline-none focus:border-[rgba(201,168,76,0.35)]"
                  />
                  <button
                    type="submit"
                    disabled={savingKnowledge}
                    className="w-full rounded-lg bg-[#C9A84C] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#E8C96D] disabled:opacity-50"
                  >
                    {savingKnowledge ? 'Saving...' : 'Save answer'}
                  </button>
                </div>
              </form>

              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                <h2 className="font-display text-xl font-bold">Knowledge base entries</h2>
                <div className="mt-5 space-y-3">
                  {knowledgeBase.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-[rgba(245,240,232,0.06)] bg-[#0A0A0F] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-[#a49368]">
                            {item.category}
                          </p>
                          <h3 className="mt-1 font-semibold">{item.question}</h3>
                        </div>
                        <button
                          onClick={() => handleDeleteKnowledge(item.id)}
                          className="rounded-lg border border-[rgba(255,120,120,0.25)] px-3 py-2 text-xs font-semibold text-[#ff9b9b] transition hover:bg-[rgba(255,120,120,0.08)]"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#a9a091]">{item.answer}</p>
                      {item.source && <p className="mt-2 text-xs text-[#7A7570]">Source: {item.source}</p>}
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'activity' && (
            <section className="mt-7 grid gap-5 xl:grid-cols-3">
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                <h2 className="font-display text-xl font-bold">Recent chats</h2>
                <div className="mt-4 space-y-3">
                  {chatMessages.map((message) => (
                    <article key={message.id} className="rounded-lg bg-[#0A0A0F] p-3">
                      <p className="line-clamp-2 text-sm">{message.user_message}</p>
                      <p className="mt-2 text-xs text-[#7A7570]">{formatDate(message.created_at)}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                <h2 className="font-display text-xl font-bold">Recent uploads</h2>
                <div className="mt-4 space-y-3">
                  {audioFiles.map((file) => (
                    <article key={file.id} className="rounded-lg bg-[#0A0A0F] p-3">
                      <p className="truncate text-sm font-semibold">{file.filename}</p>
                      <p className="mt-2 text-xs text-[#7A7570]">
                        {formatBytes(file.file_size_bytes)} / {file.mime_type || 'unknown'} /{' '}
                        {file.is_processed ? 'processed' : 'pending'}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                <h2 className="font-display text-xl font-bold">Recent payments</h2>
                <div className="mt-4 space-y-3">
                  {payments.map((payment) => (
                    <article key={payment.id} className="rounded-lg bg-[#0A0A0F] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">
                          {payment.amount.toLocaleString()} {payment.currency || 'MNT'}
                        </p>
                        <span className="rounded-full bg-[rgba(245,240,232,0.06)] px-2 py-1 text-xs text-[#a9a091]">
                          {payment.status || 'pending'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[#7A7570]">{formatDate(payment.created_at)}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'system' && (
            <section className="mt-7 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                <h2 className="font-display text-xl font-bold">Admin setup checklist</h2>
                <div className="mt-5 space-y-3 text-sm leading-6 text-[#a9a091]">
                  <p>1. Register your owner account normally from the app.</p>
                  <p>2. Run Frontend/supabase-schema.sql inside Supabase SQL Editor.</p>
                  <p>3. Run Frontend/supabase-admin-setup.sql and replace admin@example.com with your owner email.</p>
                  <p>4. Sign out and sign in again, then open /admin.</p>
                </div>
              </div>
              <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#111118] p-5">
                <h2 className="font-display text-xl font-bold">Current readiness</h2>
                <div className="mt-5 space-y-3 text-sm text-[#a9a091]">
                  <p>Admin profile flag: active</p>
                  <p>Course catalog source: src/lib/data.ts</p>
                  <p>Chat provider: configured by CHAT_PROVIDER in .env.local</p>
                  <p>RAG entries visible to admin: {knowledgeBase.length}</p>
                  <p>Loaded database tables: profiles, knowledge, chats, uploads, payments.</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
