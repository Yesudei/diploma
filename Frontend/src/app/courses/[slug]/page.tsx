'use client';
import { useState, useEffect, useRef } from 'react';
import { courses, Lesson } from '@/lib/data';
import { teachers } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases } from '@/hooks/usePurchases';
import apiService from '@/services/api';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types';
import { getYouTubeDuration } from '@/lib/youtube';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });

const categoryLabel: Record<string, string> = {
  'music-production': 'MUSIC-PRODUCTION',
  'mixing-mastering': 'MIXING-MASTERING',
  'sound-design': 'SOUND-DESIGN',
  'melody-voice': 'MELODY-VOICE',
  'audio-engineering': 'AUDIO-ENGINEERING',
  basics: 'Үндэс',
  beats: 'Beat хийх',
  mixing: 'Миксинг',
  mastering: 'Мастеринг',
};

type SelfCheckMode = 'per-lesson' | 'final-only';
type LessonPanelTab = 'overview' | 'practice' | 'takeaway' | 'quiz';

const lessonPanelTabs: Array<{ id: LessonPanelTab; label: string }> = [
  { id: 'overview', label: 'Тайлбар' },
  { id: 'practice', label: 'Дадлага' },
  { id: 'takeaway', label: 'Гол санаа' },
  { id: 'quiz', label: 'Тест' },
];

interface SelfCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

function LessonPanelBlock({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a69262]">
        {kicker}
      </p>
      <h3 className="mt-2 font-display text-2xl font-black text-[#F5F0E8]">{title}</h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#b8ad93] sm:text-base">{body}</p>
    </div>
  );
}

interface SelfCheckQuiz {
  id: string;
  type: 'lesson' | 'course';
  title: string;
  subtitle: string;
  passScore: number;
  lessonId?: string;
  questions: SelfCheckQuestion[];
}

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const [slug, setSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const course = courses.find((c) => c.slug === slug);
  const teacher = course ? teachers.find((t) => t.id === course.teacherId) : null;
  const { user } = useAuth();
  const { canWatch } = usePurchases();
  const router = useRouter();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [showTeacherPreview, setShowTeacherPreview] = useState(false);
  const [showMentorChat, setShowMentorChat] = useState(false);
  const [mentorChatInput, setMentorChatInput] = useState('');
  const [mentorMessages, setMentorMessages] = useState<ChatMessage[]>([]);
  const [sendingMentorMessage, setSendingMentorMessage] = useState(false);
  const [selfCheckMode, setSelfCheckMode] = useState<SelfCheckMode>('per-lesson');
  const [lessonPanelTab, setLessonPanelTab] = useState<LessonPanelTab>('overview');
  const [lessonCompletedIds, setLessonCompletedIds] = useState<string[]>([]);
  const [lessonQuizPassedIds, setLessonQuizPassedIds] = useState<string[]>([]);
  const [courseQuizPassed, setCourseQuizPassed] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<SelfCheckQuiz | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [lessonDurations, setLessonDurations] = useState<Record<string, number>>({});
  const teacherPreviewRef = useRef<HTMLDivElement>(null);
  const mentorChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params?.slug) {
      setSlug(params.slug);
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (!showTeacherPreview) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (teacherPreviewRef.current && !teacherPreviewRef.current.contains(event.target as Node)) {
        setShowTeacherPreview(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showTeacherPreview]);

  useEffect(() => {
    if (showMentorChat) {
      mentorChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mentorMessages, showMentorChat]);

  useEffect(() => {
    if (!slug) return;
    setCurrentLesson(null);
    setLessonCompletedIds([]);
    setLessonQuizPassedIds([]);
    setCourseQuizPassed(false);
    setActiveQuiz(null);
    setShowQuizModal(false);
    setQuizAnswers({});
    setQuizScore(null);
    setLessonPanelTab('overview');
  }, [slug]);

  useEffect(() => {
    if (!course?.curriculum) return;

    const fetchDurations = async () => {
      const newDurations: Record<string, number> = {};
      const fetchPromises = course.curriculum
        .filter((lesson) => lesson.youtubeId)
        .map(async (lesson) => {
          const duration = await getYouTubeDuration(lesson.youtubeId!);
          if (duration) {
            newDurations[lesson.id] = duration;
          }
        });

      await Promise.all(fetchPromises);
      if (Object.keys(newDurations).length > 0) {
        setLessonDurations(newDurations);
      }
    };

    fetchDurations();
  }, [course]);

  useEffect(() => {
    if (!course?.curriculum?.length || currentLesson) return;

    const hasAccess = canWatch(course.id, course.price);
    const initialLesson = hasAccess
      ? course.curriculum[0]
      : course.curriculum.find((lesson) => lesson.free);

    if (initialLesson) {
      setCurrentLesson(initialLesson);
    }
  }, [canWatch, course, currentLesson]);

  if (loading || !slug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F]">
        <div className="text-[#7A7570]">Ачаалж байна...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] text-[#7A7570]">
        Хичээл олдсонгүй
      </div>
    );
  }

  const alreadyOwned = canWatch(course.id, course.price);
  const freeLessonsCount = course.curriculum.filter((lesson) => lesson.free).length;
  const paidLessonsCount = course.curriculum.length - freeLessonsCount;
  const hasActiveLesson = Boolean(currentLesson && (currentLesson.free || alreadyOwned));
  const nextCourses = courses
    .filter((item) => item.id !== course.id)
    .sort((a, b) => {
      const aScore = a.category === course.category ? 1 : 0;
      const bScore = b.category === course.category ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, 4);
  const allLessonsCompleted = lessonCompletedIds.length === course.curriculum.length;
  const allLessonQuizzesPassed = lessonQuizPassedIds.length === course.curriculum.length;
  const finalQuizUnlocked =
    selfCheckMode === 'final-only' ? allLessonsCompleted : allLessonQuizzesPassed;

  const categoryConceptQuestion = (() => {
    const byCategory: Record<
      string,
      { question: string; options: string[]; correctIndex: number }
    > = {
      'music-production': {
        question:
          'Rhythm pattern-уудаа хэсэг хэсгээр нь зохион байгуулахын гол давуу тал юу вэ?',
        options: [
          'Arrangement хийхэд бүтэц, ажлын урсгал тодорхой болдог',
          'CPU хэрэглээг 100% зогсоодог',
          'Mastering-ийг автоматаар хийдэг',
          'Вокалыг бүрэн устгадаг',
        ],
        correctIndex: 0,
      },
      'mixing-mastering': {
        question: 'EQ-г зөв ашиглах үндсэн зорилго юу вэ?',
        options: [
          'Фреквенсийн зөрчлийг цэвэрлэж тэнцвэр гаргах',
          'Бүх сувгийг ижил чанга болгох',
          'Pitch-ийг автоматаар засах',
          'Render хурдыг 2x болгох',
        ],
        correctIndex: 0,
      },
      'sound-design': {
        question: 'Sound design-д Filter ашиглах гол үүрэг юу вэ?',
        options: [
          'Фреквенсийн хэсгийг хасах эсвэл тодруулах',
          'Tempo-г тогтмол болгох',
          'MIDI-г аудио болгох',
          'Track-уудыг автоматаар master хийх',
        ],
        correctIndex: 0,
      },
    };

    return (
      byCategory[course.category] || {
        question: 'Сайн сургалтын гол зарчим юу вэ?',
        options: [
          'Тогтмол давтаж, практикт хэрэгжүүлэх',
          'Зөвхөн plug-in цуглуулах',
          'Нэг өдөрт бүхнийг сурах',
          'Сонсголын шалгалт алгасах',
        ],
        correctIndex: 0,
      }
    );
  })();

  const buildLessonQuiz = (lesson: Lesson): SelfCheckQuiz => {
    const lessonIndex = course.curriculum.findIndex((item) => item.id === lesson.id);
    const resolvedDuration = lessonDurations[lesson.id] ?? lesson.durationMinutes;
    const wrongLowDuration = Math.max(1, resolvedDuration - 4);
    const wrongHighDuration = resolvedDuration + 4;

    return {
      id: `lesson-quiz-${lesson.id}`,
      type: 'lesson',
      lessonId: lesson.id,
      title: `${lessonIndex + 1}-р хичээлийн өөрийгөө шалгах тест`,
      subtitle: lesson.title,
      passScore: 2,
      questions: [
        {
          id: `${lesson.id}-q-topic`,
          question: 'Энэ хичээлийн гол сэдэв аль нь вэ?',
          options: [
            lesson.title,
            `${course.title}-ийн курсын товч агуулга`,
            'Mastering-ийн эцсийн checklist',
            'Маркетплейс рүү asset upload хийх',
          ],
          correctIndex: 0,
        },
        {
          id: `${lesson.id}-q-duration`,
          question: 'Энэ хичээлийн урт хэдэн минут вэ?',
          options: [
            `${resolvedDuration} мин`,
            `${wrongLowDuration} мин`,
            `${wrongHighDuration} мин`,
            `${resolvedDuration + 9} мин`,
          ],
          correctIndex: 0,
        },
        {
          id: `${lesson.id}-q-concept`,
          question: categoryConceptQuestion.question,
          options: categoryConceptQuestion.options,
          correctIndex: categoryConceptQuestion.correctIndex,
        },
      ],
    };
  };

  const buildCourseQuiz = (): SelfCheckQuiz => {
    const lessonCount = course.curriculum.length;
    const firstWrongCount = lessonCount + 1;
    const secondWrongCount = Math.max(1, lessonCount - 1);
    const firstTeacher =
      teacher?.name || teachers.find((item) => item.id !== course.teacherId)?.name || 'Тодорхойгүй';
    const secondTeacher =
      teachers.find((item) => item.id !== course.teacherId && item.name !== firstTeacher)?.name ||
      'Тодорхойгүй';

    return {
      id: `course-quiz-${course.id}`,
      type: 'course',
      title: 'Бүтэн курсын өөрийгөө шалгах тест',
      subtitle: `${course.title} - эцсийн шалгалт`,
      passScore: 4,
      questions: [
        {
          id: `${course.id}-cq-lesson-count`,
          question: `"${course.title}" нийт хэдэн хичээлтэй вэ?`,
          options: [
            `${lessonCount} хичээл`,
            `${firstWrongCount} хичээл`,
            `${secondWrongCount} хичээл`,
            `${lessonCount + 3} хичээл`,
          ],
          correctIndex: 0,
        },
        {
          id: `${course.id}-cq-category`,
          question: 'Энэ курсын ангилал аль нь вэ?',
          options: [
            categoryLabel[course.category] || course.category,
            'Mix шинжилгээ',
            'Маркетплейс дизайн',
            'Аудио файл нэмэх',
          ],
          correctIndex: 0,
        },
        {
          id: `${course.id}-cq-teacher`,
          question: 'Курсийг хөтөлж буй ментор хэн бэ?',
          options: [teacher?.name || 'Тодорхойгүй ментор', firstTeacher, secondTeacher, 'Зочин ментор'],
          correctIndex: 0,
        },
        {
          id: `${course.id}-cq-pricing`,
          question: 'Энэ курсын төлбөрийн хэлбэр аль нь вэ?',
          options:
            course.price === 0
              ? ['Үнэгүй', 'Сарын багц', 'Нэг удаагийн $99', 'Зөвхөн байгууллагад']
              : [
                  'Нэг удаагийн төлбөр',
                  'Үнэгүй',
                  'Зөвхөн туршилтын хэрэглэгчид',
                  'Зөвхөн байгууллагад',
                ],
          correctIndex: 0,
        },
        {
          id: `${course.id}-cq-concept`,
          question: categoryConceptQuestion.question,
          options: categoryConceptQuestion.options,
          correctIndex: categoryConceptQuestion.correctIndex,
        },
      ],
    };
  };

  const handleBuy = () => {
    router.push(`/checkout?courseId=${encodeURIComponent(course.id)}&slug=${encodeURIComponent(course.slug)}`);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.free || alreadyOwned) {
      setCurrentLesson(lesson);
      setLessonPanelTab('overview');
      setShowLockedModal(false);
    } else {
      setShowLockedModal(true);
    }
  };

  const closeModal = () => {
    setShowLockedModal(false);
    setCurrentLesson(null);
  };

  const handleSendMentorMessage = async () => {
    const text = mentorChatInput.trim();
    if (!text || !teacher) return;

    if (!user) {
      toast.error('Ментортой чатлахын тулд нэвтэрнэ үү');
      router.push('/auth/login');
      return;
    }

    const userMessage: ChatMessage = {
      id: `course-local-user-${Date.now()}`,
      user_id: user.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const nextHistory = [...mentorMessages, userMessage];
    setMentorMessages(nextHistory);
    setMentorChatInput('');
    setSendingMentorMessage(true);

    try {
      const response = await apiService.sendChatMessage({
        message: `[mentor:${teacher.id}:${teacher.name}] ${text}`,
        conversation_history: nextHistory,
      });

      const assistantMessage: ChatMessage = {
        id: response.id,
        user_id: user.id,
        role: 'assistant',
        content: response.message,
        created_at: response.timestamp,
        sources: response.sources,
      };

      setMentorMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Зурвас илгээхэд алдаа гарлаа';
      toast.error(message);
    } finally {
      setSendingMentorMessage(false);
    }
  };

  const openLessonQuiz = (lesson: Lesson) => {
    setActiveQuiz(buildLessonQuiz(lesson));
    setQuizAnswers({});
    setQuizScore(null);
    setShowQuizModal(true);
  };

  const openCourseQuiz = () => {
    setActiveQuiz(buildCourseQuiz());
    setQuizAnswers({});
    setQuizScore(null);
    setShowQuizModal(true);
  };

  const handleLessonCompleted = () => {
    if (!currentLesson) return;

    setLessonCompletedIds((prev) =>
      prev.includes(currentLesson.id) ? prev : [...prev, currentLesson.id]
    );

    if (selfCheckMode === 'per-lesson' && !lessonQuizPassedIds.includes(currentLesson.id)) {
      openLessonQuiz(currentLesson);
      return;
    }

    toast.success('Хичээл дууссан гэж тэмдэглэлээ');
  };

  const handlePickQuizAnswer = (questionId: string, optionIndex: number) => {
    if (quizScore !== null) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;

    const total = activeQuiz.questions.length;
    if (Object.keys(quizAnswers).length !== total) {
      toast.error('Бүх асуултад хариулаад шалгана уу');
      return;
    }

    const correct = activeQuiz.questions.reduce((count, question) => {
      return quizAnswers[question.id] === question.correctIndex ? count + 1 : count;
    }, 0);

    setQuizScore(correct);

    const passed = correct >= activeQuiz.passScore;
    if (!passed) {
      toast.error(`Тэнцсэнгүй (${correct}/${total}). Дахин оролдоно уу.`);
      return;
    }

    if (activeQuiz.type === 'lesson' && activeQuiz.lessonId) {
      const lessonId = activeQuiz.lessonId;
      setLessonQuizPassedIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
      toast.success(`Хичээлийн тест амжилттай (${correct}/${total})`);
      return;
    }

    setCourseQuizPassed(true);
    toast.success(`Курсын эцсийн тест амжилттай (${correct}/${total})`);
  };

  const handleCloseQuiz = () => {
    setShowQuizModal(false);
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizScore(null);
  };

  const hasVideoCurrentLesson = Boolean(currentLesson?.youtubeId);
  const currentLessonIndex = currentLesson
    ? course.curriculum.findIndex((lesson) => lesson.id === currentLesson.id)
    : -1;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < course.curriculum.length - 1
      ? course.curriculum[currentLessonIndex + 1]
      : null;
  const currentLessonDuration = currentLesson
    ? lessonDurations[currentLesson.id] || currentLesson.durationMinutes
    : 0;
  const currentLessonNumber = currentLessonIndex >= 0 ? currentLessonIndex + 1 : 0;
  const courseProgressPercent = Math.round(
    (lessonCompletedIds.length / Math.max(course.curriculum.length, 1)) * 100
  );
  const currentLessonDone = currentLesson ? lessonCompletedIds.includes(currentLesson.id) : false;
  const currentLessonQuizDone = currentLesson
    ? lessonQuizPassedIds.includes(currentLesson.id)
    : false;

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#0A0A0F] pb-20 pt-24 sm:pt-28">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-14">
          {showLockedModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="studio-panel w-full max-w-md rounded-[28px] p-7 sm:p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A84C]/20">
                    <svg
                      className="h-8 w-8 text-[#C9A84C]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-white">Төлбөр төлөх шаардлагатай</h3>
                  <p className="mb-6 text-sm leading-7 text-[#7A7570]">
                    Энэ хичээл нь төлбөртэй. Хичээлд хандахын тулд эхлээд худалдаж авна уу.
                  </p>
                  <button
                    onClick={handleBuy}
                    className="studio-button mb-3 w-full rounded-xl py-3 font-bold"
                  >
                    {`₮${course.price.toLocaleString()} - Худалдаж авах`}
                  </button>
                  <button
                    onClick={closeModal}
                    className="w-full py-2 text-[#7A7570] transition hover:text-white"
                  >
                    Болих
                  </button>
                </div>
              </div>
            </div>
          )}

          {showQuizModal && activeQuiz && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4">
              <div className="studio-panel w-full max-w-2xl overflow-hidden rounded-[28px]">
                <div className="flex items-start justify-between border-b border-[rgba(245,240,232,0.08)] px-5 py-4 sm:px-7">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a69262]">
                      Өөрийгөө шалгах тест
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-[#F5F0E8]">{activeQuiz.title}</h3>
                    <p className="mt-1 text-sm text-[#9c9077]">{activeQuiz.subtitle}</p>
                  </div>
                  <button
                    onClick={handleCloseQuiz}
                    className="rounded-md px-2 py-1 text-[#8f8779] transition hover:bg-[rgba(245,240,232,0.08)] hover:text-[#F5F0E8]"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-[65vh] space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
                  {activeQuiz.questions.map((question, questionIndex) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[#0f1018] p-4"
                    >
                      <p className="text-sm font-semibold text-[#d6c8a4]">
                        Асуулт {questionIndex + 1}
                      </p>
                      <p className="mt-1 text-base text-[#F5F0E8]">{question.question}</p>
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const selected = quizAnswers[question.id] === optionIndex;
                          const showResultState = quizScore !== null;
                          const isCorrect = optionIndex === question.correctIndex;
                          const isWrongSelection = showResultState && selected && !isCorrect;

                          return (
                            <button
                              key={`${question.id}-${optionIndex}`}
                              type="button"
                              onClick={() => handlePickQuizAnswer(question.id, optionIndex)}
                              className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                showResultState
                                  ? isCorrect
                                    ? 'border-[rgba(133,213,141,0.45)] bg-[rgba(46,102,57,0.3)] text-[#dff7e2]'
                                    : isWrongSelection
                                      ? 'border-[rgba(216,88,88,0.45)] bg-[rgba(102,40,40,0.28)] text-[#ffd8d8]'
                                      : 'border-[rgba(245,240,232,0.1)] bg-[#121522] text-[#b0a58c]'
                                  : selected
                                    ? 'border-[rgba(217,195,138,0.45)] bg-[rgba(217,195,138,0.16)] text-[#F5F0E8]'
                                    : 'border-[rgba(245,240,232,0.1)] bg-[#121522] text-[#d8d0bf] hover:border-[rgba(217,195,138,0.3)]'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(245,240,232,0.08)] px-5 py-4 sm:px-7">
                  <p className="text-sm text-[#9c9077]">
                    Тэнцэх босго: {activeQuiz.passScore}/{activeQuiz.questions.length}
                    {quizScore !== null && (
                      <span className="ml-2 font-semibold text-[#F5F0E8]">
                        Таны оноо: {quizScore}/{activeQuiz.questions.length}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {quizScore !== null && (
                      <button
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizScore(null);
                        }}
                        className="rounded-xl border border-[rgba(245,240,232,0.16)] px-4 py-2 text-sm font-semibold text-[#d9ceb3] transition hover:border-[rgba(217,195,138,0.35)]"
                      >
                        Дахин өгөх
                      </button>
                    )}
                    <button
                      onClick={handleSubmitQuiz}
                      className="rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-bold text-[#0A0A0F] transition hover:bg-[#E8C96D]"
                    >
                      Шалгах
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentLesson && (currentLesson.free || alreadyOwned) && (
            <section
              id="active-player"
              className="mb-8 overflow-hidden rounded-[34px] border border-[rgba(245,240,232,0.08)] bg-[linear-gradient(145deg,rgba(245,240,232,0.05),rgba(8,9,12,0.96)_48%),#0B0C10] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.42)] sm:p-4"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0">
                  <div className="overflow-hidden rounded-[28px] border border-[rgba(245,240,232,0.08)] bg-[#050609]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(245,240,232,0.08)] px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(201,168,76,0.28)] bg-[rgba(201,168,76,0.08)] text-xs font-black text-[#E8C96D]">
                          {String(currentLessonNumber).padStart(2, '0')}
                        </span>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#a69262]">
                            Студи сесс
                          </p>
                          <h2 className="mt-1 line-clamp-1 font-display text-xl font-black text-[#F5F0E8] sm:text-2xl">
                            {currentLesson.title}
                          </h2>
                        </div>
                      </div>
                      <button
                        onClick={() => setCurrentLesson(null)}
                        className="rounded-full border border-[rgba(245,240,232,0.1)] px-3 py-1.5 text-sm text-[#8f8779] transition hover:border-[rgba(217,195,138,0.32)] hover:text-[#F5F0E8]"
                      >
                        Хаах
                      </button>
                    </div>

                    <div className="relative">
                      {hasVideoCurrentLesson ? (
                        <VideoPlayer videoId={currentLesson.youtubeId || ''} onComplete={() => {}} />
                      ) : (
                        <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(201,169,78,0.12),transparent_42%),#08090D] p-8 text-center">
                          <div className="absolute inset-x-8 bottom-10 flex h-24 items-end justify-center gap-2 opacity-70">
                            {[42, 70, 38, 104, 62, 130, 86, 118, 54, 78, 44].map((height, index) => (
                              <span
                                key={index}
                                className="w-3 rounded-full bg-[linear-gradient(180deg,#E8C96D,#7FA4A8)]"
                                style={{ height }}
                              />
                            ))}
                          </div>
                          <div className="relative z-10 max-w-[560px]">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E8C96D]">
                              Хичээлийн товч
                            </p>
                            <h3 className="mt-4 font-display text-[clamp(34px,6vw,68px)] font-black leading-[0.92]">
                              Унш. Турш. Тэмдэглэ.
                            </h3>
                            <p className="mx-auto mt-4 max-w-[460px] text-sm leading-7 text-[#b8ad93]">
                              Видео байхгүй хичээл дээр гол санаа, дадлага, шалгах тестээ нэг дор
                              ажиллуулна.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[rgba(245,240,232,0.08)] p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="studio-chip rounded-full px-3 py-1 text-xs font-bold">
                            {currentLessonDuration} мин
                          </span>
                          <span className="studio-chip rounded-full px-3 py-1 text-xs font-bold">
                            {currentLessonDone ? 'Дууссан' : 'Явагдаж байна'}
                          </span>
                          <span className="studio-chip rounded-full px-3 py-1 text-xs font-bold">
                            {currentLessonQuizDone ? 'Тест давсан' : 'Тест хүлээгдэж байна'}
                          </span>
                        </div>
                        <div className="min-w-[180px]">
                          <div className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-[#8f8779]">
                            <span>Курсын ахиц</span>
                            <span>{courseProgressPercent}%</span>
                          </div>
                          <div className="studio-meter">
                            <span style={{ width: `${courseProgressPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[28px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.035)] p-3 sm:p-4">
                    <div className="grid gap-2 rounded-2xl bg-[#090A0D]/60 p-1 sm:grid-cols-4">
                      {lessonPanelTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setLessonPanelTab(tab.id)}
                          className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                            lessonPanelTab === tab.id
                              ? 'bg-[rgba(201,169,78,0.16)] text-[#E8C96D]'
                              : 'text-[#8f8779] hover:bg-white/[0.04] hover:text-[#F5F0E8]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-[rgba(245,240,232,0.07)] bg-[#090A0D]/44 p-5">
                      {lessonPanelTab === 'overview' && (
                        <LessonPanelBlock
                          kicker="Гол анхаарах зүйл"
                          title={currentLesson.title}
                          body={
                            currentLesson.summary ||
                            'Энэ хичээлийн үндсэн ойлголтуудыг богино, төвлөрсөн байдлаар судална.'
                          }
                        />
                      )}
                      {lessonPanelTab === 'practice' && (
                        <LessonPanelBlock
                          kicker="Дадлага"
                          title="Өөрийн project дээр турших"
                          body={currentLesson.exercise || 'Сонсож, туршиж, өөрийн хувилбараа гарга.'}
                        />
                      )}
                      {lessonPanelTab === 'takeaway' && (
                        <LessonPanelBlock
                          kicker="Авч үлдэх санаа"
                          title="Дараагийн beat дээр ашиглах"
                          body={
                            currentLesson.takeaway ||
                            'Хичээлийн дараа нэг тодорхой санаа авч үлдэнэ.'
                          }
                        />
                      )}
                      {lessonPanelTab === 'quiz' && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <LessonPanelBlock
                            kicker="Өөрийгөө шалгах"
                            title="Ойлгосноо баталгаажуулах"
                            body="Хичээлийн дараа богино тест өгч, цааш явахад бэлэн эсэхээ шалгаарай."
                          />
                          <button
                            onClick={() => openLessonQuiz(currentLesson)}
                            className="studio-button rounded-full px-5 py-3 text-sm font-black"
                          >
                            Тест эхлэх
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={handleLessonCompleted}
                        className="studio-button rounded-full px-5 py-3 text-sm font-black"
                      >
                        Дууссан гэж тэмдэглэх
                      </button>
                      {nextLesson && (
                        <button
                          onClick={() => handleLessonClick(nextLesson)}
                          className="studio-ghost-button rounded-full px-5 py-3 text-sm font-bold"
                        >
                          Дараагийн хичээл
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <aside className="h-fit overflow-hidden rounded-[28px] border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.035)] xl:sticky xl:top-24">
                  <div className="border-b border-[rgba(245,240,232,0.08)] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#a69262]">
                      Хичээлийн дараалал
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-4">
                      <p className="font-display text-3xl font-black text-[#F5F0E8]">
                        {currentLessonNumber}/{course.curriculum.length}
                      </p>
                      <p className="text-right text-xs leading-5 text-[#8f8779]">
                        {lessonCompletedIds.length} дууссан
                      </p>
                    </div>
                  </div>
                  <div className="max-h-[650px] overflow-y-auto p-3">
                    {course.curriculum.map((lesson, i) => {
                      const isActiveLesson = currentLesson.id === lesson.id;
                      const isCompletedLesson = lessonCompletedIds.includes(lesson.id);
                      const isLockedLesson = !lesson.free && !alreadyOwned;
                      const lessonDuration = lessonDurations[lesson.id] || lesson.durationMinutes;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className={`relative flex w-full gap-3 rounded-2xl border p-3 text-left transition ${
                            isActiveLesson
                              ? 'border-[rgba(217,195,138,0.45)] bg-[rgba(201,168,76,0.14)]'
                              : isLockedLesson
                                ? 'border-[rgba(245,240,232,0.06)] bg-[#0b0d12]/70 opacity-70 hover:border-[rgba(217,195,138,0.2)]'
                                : 'border-[rgba(245,240,232,0.08)] bg-[#11131b] hover:border-[rgba(217,195,138,0.28)]'
                          }`}
                        >
                          <span className="relative flex flex-col items-center">
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-full border text-[11px] font-black ${
                                isActiveLesson
                                  ? 'border-[rgba(201,169,78,0.55)] text-[#E8C96D]'
                                  : isCompletedLesson
                                    ? 'border-[rgba(125,211,168,0.4)] text-[#7DD3A8]'
                                    : 'border-[rgba(245,240,232,0.1)] text-[#8b816f]'
                              }`}
                            >
                              {isCompletedLesson ? '✓' : i + 1}
                            </span>
                            {i < course.curriculum.length - 1 && (
                              <span className="mt-2 h-8 w-px bg-[rgba(245,240,232,0.1)]" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 block text-sm font-bold text-[#F5F0E8]">
                              {lesson.title}
                            </span>
                            <span className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] font-bold text-[#8f8779]">
                                {lessonDuration} мин
                              </span>
                              {lesson.free && (
                                <span className="rounded-full bg-[rgba(201,169,78,0.1)] px-2 py-0.5 text-[11px] font-bold text-[#E8C96D]">
                                  Үнэгүй
                                </span>
                              )}
                              {lesson.contentType === 'brief' && (
                                <span className="rounded-full bg-[rgba(127,164,168,0.12)] px-2 py-0.5 text-[11px] font-bold text-[#9BC7CC]">
                                  Товч
                                </span>
                              )}
                              {lessonQuizPassedIds.includes(lesson.id) && (
                                <span className="rounded-full bg-[rgba(125,211,168,0.12)] px-2 py-0.5 text-[11px] font-bold text-[#7DD3A8]">
                                  Тест ✓
                                </span>
                              )}
                            </span>
                          </span>
                          {isLockedLesson && <span className="text-sm text-[#a99771]">Түгжээтэй</span>}
                        </button>
                      );
                    })}
                  </div>
                </aside>
              </div>
            </section>
          )}

          {!hasActiveLesson && (
            <section className="studio-panel rounded-[32px] p-6 sm:p-8">
              <div className="relative grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-12">
                <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A84C]">
                  {categoryLabel[course.category] || course.category}
                </div>
                <h1 className="mt-3 font-display text-[clamp(30px,4vw,54px)] font-black leading-[1.03] text-[#F5F0E8]">
                  {course.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[#b8ad93]">
                  {course.description}
                </p>

                {teacher && (
                  <div
                    ref={teacherPreviewRef}
                    className="relative z-10 mt-8"
                    onMouseEnter={() => setShowTeacherPreview(true)}
                    onMouseLeave={() => setShowTeacherPreview(false)}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTeacherPreview((v) => !v)}
                        className="studio-card group flex flex-1 items-center justify-between rounded-2xl p-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,168,76,0.26)] bg-gradient-to-br from-[#34270f] to-[#1a1406] font-display text-xl text-[#E8C96D]">
                            {teacher.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-[#F5F0E8]">{teacher.name}</div>
                            <div className="text-sm text-[#8e8678]">
                              {teacher.role} • {teacher.specialty}
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>

                    {showTeacherPreview && (
                      <div className="studio-panel z-30 mt-3 w-full rounded-2xl p-5 sm:max-w-[460px] lg:absolute lg:left-[calc(100%+16px)] lg:top-0 lg:mt-0 lg:w-[380px]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(217,195,138,0.4)] bg-gradient-to-br from-[#3a2b11] to-[#1a1408] font-display text-2xl text-[#E8C96D]">
                              {teacher.name[0]}
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9f8f67]">
                                Менторын танилцуулга
                              </p>
                              <h3 className="mt-1 text-xl font-bold text-[#F5F0E8]">
                                {teacher.name}
                              </h3>
                              <p className="text-sm text-[#b5a98a]">{teacher.role}</p>
                            </div>
                          </div>
                          <div className="rounded-full border border-[rgba(217,195,138,0.3)] bg-[rgba(217,195,138,0.12)] px-2.5 py-1 text-xs font-semibold text-[#E8C96D]">
                            {teacher.stats?.rating || '-'} / 5
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-[rgba(245,240,232,0.1)] bg-[#11131b] p-3.5">
                          <p className="text-xs uppercase tracking-[0.12em] text-[#8f8779]">
                            Чиглэл
                          </p>
                          <p className="mt-1 text-sm font-medium text-[#d9cba8]">
                            {teacher.specialty}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#b8ad93]">{teacher.bio}</p>
                        </div>

                        {teacher.instruments && teacher.instruments.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs uppercase tracking-[0.12em] text-[#8f8779]">
                              Ашигладаг хэрэгсэл
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {teacher.instruments.map((tool) => (
                                <span
                                  key={tool}
                                  className="rounded-full border border-[rgba(245,240,232,0.12)] bg-[rgba(245,240,232,0.04)] px-2.5 py-1 text-xs text-[#d7cba8]"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                          <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#12151e] p-3 text-center">
                            <p className="font-display text-lg font-bold text-[#F5F0E8]">
                              {teacher.stats?.studentCount?.toLocaleString() || '-'}+
                            </p>
                            <p className="mt-1 text-[#7A7570]">Сурагч</p>
                          </div>
                          <div className="rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#12151e] p-3 text-center">
                            <p className="font-display text-lg font-bold text-[#F5F0E8]">
                              {teacher.stats?.rating || '-'}
                            </p>
                            <p className="mt-1 text-[#7A7570]">Үнэлгээ</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-9">
                  <h2 className="font-display text-xl font-bold text-[#F5F0E8] sm:text-2xl">
                    Хичээлийн агуулга ({course.curriculum.length} хичээл)
                  </h2>
                  <div className="studio-card mt-4 rounded-2xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a69262]">
                          Тестийн тохиргоо
                        </p>
                        <p className="mt-1 text-sm text-[#b8ad93]">
                          Хичээл бүрийн тест эсвэл бүтэн курсын төгсгөлийн нэг тестээс сонгоно уу.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelfCheckMode('per-lesson')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            selfCheckMode === 'per-lesson'
                              ? 'border-[rgba(217,195,138,0.45)] bg-[rgba(201,168,76,0.16)] text-[#F5F0E8]'
                              : 'border-[rgba(245,240,232,0.14)] text-[#b7aa8d] hover:border-[rgba(217,195,138,0.32)]'
                          }`}
                        >
                          Хичээл бүр
                        </button>
                        <button
                          onClick={() => setSelfCheckMode('final-only')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            selfCheckMode === 'final-only'
                              ? 'border-[rgba(217,195,138,0.45)] bg-[rgba(201,168,76,0.16)] text-[#F5F0E8]'
                              : 'border-[rgba(245,240,232,0.14)] text-[#b7aa8d] hover:border-[rgba(217,195,138,0.32)]'
                          }`}
                        >
                          Курсын төгсгөлд
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[#c6bda8] sm:grid-cols-3">
                      <p className="rounded-lg border border-[rgba(245,240,232,0.08)] bg-[#121522] px-3 py-2">
                        Дуусгасан хичээл: {lessonCompletedIds.length}/{course.curriculum.length}
                      </p>
                      <p className="rounded-lg border border-[rgba(245,240,232,0.08)] bg-[#121522] px-3 py-2">
                        Хичээлийн тест: {lessonQuizPassedIds.length}/{course.curriculum.length}
                      </p>
                      <p className="rounded-lg border border-[rgba(245,240,232,0.08)] bg-[#121522] px-3 py-2">
                        Эцсийн тест: {courseQuizPassed ? 'Тэнцсэн' : 'Өгөөгүй'}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-[#8c816b]">
                        {finalQuizUnlocked
                          ? 'Эцсийн өөрийгөө шалгах тест нээгдсэн.'
                          : selfCheckMode === 'per-lesson'
                            ? 'Эцсийн тест нээхийн тулд хичээл бүрийн тестийг давна уу.'
                            : 'Эцсийн тест нээхийн тулд бүх хичээлээ дуусгасан гэж тэмдэглэнэ үү.'}
                      </p>
                      <button
                        onClick={openCourseQuiz}
                        disabled={!finalQuizUnlocked}
                        className="studio-button rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Бүтэн курсын тест эхлэх
                      </button>
                    </div>
                  </div>
                  {!hasVideoCurrentLesson && (
                    <div className="mt-4 space-y-2.5">
                      {course.curriculum.map((lesson, i) => (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className="flex w-full items-center gap-3 rounded-xl border border-[rgba(245,240,232,0.08)] bg-[rgba(8,9,12,0.36)] p-3.5 text-left transition hover:border-[rgba(201,168,76,0.28)]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18181F] text-xs font-bold text-[#7A7570]">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <span className="text-sm text-[#F5F0E8]">{lesson.title}</span>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {lessonCompletedIds.includes(lesson.id) && (
                                <span className="rounded-full border border-[rgba(117,214,144,0.3)] bg-[rgba(46,102,57,0.25)] px-2 py-0.5 text-[10px] font-semibold text-[#dff7e2]">
                                  ДУУССАН
                                </span>
                              )}
                              {lesson.contentType === 'brief' && (
                                <span className="rounded-full border border-[rgba(88,130,216,0.32)] bg-[rgba(49,74,122,0.24)] px-2 py-0.5 text-[10px] font-semibold text-[#cfe0ff]">
                                  Товч хичээл
                                </span>
                              )}
                              {lessonQuizPassedIds.includes(lesson.id) && (
                                <span className="rounded-full border border-[rgba(217,195,138,0.35)] bg-[rgba(217,195,138,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#E8C96D]">
                                  Тест ✓
                                </span>
                              )}
                            </div>
                          </div>
                          {lesson.free ? (
                            <span className="text-xs font-bold text-[#C9A84C]">Үнэгүй</span>
                          ) : alreadyOwned ? (
                            <span className="text-xs text-[#C9A84C]">✓</span>
                          ) : (
                            <svg
                              className="h-4 w-4 text-[#7A7570]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"
                              />
                            </svg>
                          )}
                          <span className="text-xs text-[#7A7570]">
                            {lessonDurations[lesson.id] || lesson.durationMinutes} мин
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <aside className="h-fit lg:sticky lg:top-24" id="buy-section">
                {course.price === 0 ? (
                  <div className="studio-card rounded-2xl p-6">
                    <div className="text-center">
                      <div className="font-display text-4xl font-black text-[#C9A84C]">Үнэгүй</div>
                      <p className="mt-2 text-sm text-[#7A7570]">
                        {hasActiveLesson ? 'Сонгосон хичээлээ үзэж байна' : 'Бүртгэлгүй үзэх боломжтой'}
                      </p>
                      <button
                        onClick={() => {
                          if (hasActiveLesson) {
                            document
                              .getElementById('active-player')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            return;
                          }
                          if (course.curriculum[0]) setCurrentLesson(course.curriculum[0]);
                        }}
                        className="studio-button mt-6 w-full rounded-xl py-3.5 font-bold"
                      >
                        {hasActiveLesson ? 'Одоо үзэж байна' : 'Эхлэх'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="studio-card rounded-2xl p-6">
                    <div className="text-center">
                      <div className="font-display text-4xl font-black text-[#C9A84C]">
                        ₮{course.price.toLocaleString()}
                      </div>
                      <p className="mt-2 text-sm text-[#7A7570]">Нэг удаагийн төлбөр</p>
                    </div>

                    <div className="mt-6">
                      {alreadyOwned ? (
                        <button
                          onClick={() => {
                            if (hasActiveLesson) {
                              document
                                .getElementById('active-player')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              return;
                            }
                            if (course.curriculum[0]) setCurrentLesson(course.curriculum[0]);
                          }}
                          className="studio-button w-full rounded-xl py-3.5 font-bold"
                        >
                          {hasActiveLesson ? 'Одоо үзэж байна' : 'Үзэж эхлэх'}
                        </button>
                      ) : (
                        <button
                          onClick={handleBuy}
                          className="studio-button w-full rounded-xl py-3.5 font-bold"
                        >
                          Худалдаж авах
                        </button>
                      )}
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-[#7A7570]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#C9A84C]">✓</span> Хязгааргүй хугацаагаар үзэх
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#C9A84C]">✓</span> {course.curriculum.length} хичээл
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#C9A84C]">✓</span> .FLP project файл
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-[rgba(245,240,232,0.1)] bg-[#0f1118] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a69262]">
                        Төлбөрийн хэсэг (туршилт)
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                        <span className="rounded-lg border border-[rgba(245,240,232,0.12)] bg-[rgba(245,240,232,0.03)] px-2 py-1.5 text-[#d9cfb6]">
                          QPay
                        </span>
                        <span className="rounded-lg border border-[rgba(245,240,232,0.12)] bg-[rgba(245,240,232,0.03)] px-2 py-1.5 text-[#d9cfb6]">
                          Visa
                        </span>
                        <span className="rounded-lg border border-[rgba(245,240,232,0.12)] bg-[rgba(245,240,232,0.03)] px-2 py-1.5 text-[#d9cfb6]">
                          MasterCard
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#9c9077]">
                        <p className="rounded-lg border border-[rgba(245,240,232,0.08)] bg-[#11141d] px-2.5 py-2">
                          Үнэгүй урьдчилсан үзэлт: {freeLessonsCount}
                        </p>
                        <p className="rounded-lg border border-[rgba(245,240,232,0.08)] bg-[#11141d] px-2.5 py-2">
                          Төлбөртэй хичээл: {paidLessonsCount}
                        </p>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-[#7f7564]">
                        Сургалтын туршилтын горимд худалдаж авах товч дармагц хандалт идэвхжинэ.
                      </p>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </section>
          )}

          {hasActiveLesson && nextCourses.length > 0 && (
            <section className="studio-panel mt-8 rounded-[28px] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a69262]">
                    Үргэлжлүүлэн сурах
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-[#F5F0E8]">
                    Дараагийн курсууд
                  </h2>
                </div>
                <button
                  onClick={() => router.push('/courses')}
                  className="rounded-lg border border-[rgba(245,240,232,0.14)] px-3 py-2 text-xs font-semibold text-[#d7cba8] transition hover:border-[rgba(217,195,138,0.35)] hover:text-[#F5F0E8]"
                >
                  Бүгдийг үзэх
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {nextCourses.map((item) => {
                  const previewCount = item.curriculum.filter((lesson) => lesson.free).length;

                  return (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/courses/${item.slug}`)}
                      className="group rounded-xl border border-[rgba(245,240,232,0.08)] bg-[#0f1118] p-4 text-left transition hover:border-[rgba(217,195,138,0.32)]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a69262]">
                        {categoryLabel[item.category] || item.category}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-sm font-bold text-[#F5F0E8] transition-colors group-hover:text-[#E8C96D]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs text-[#8d836f]">
                        {item.curriculum.length} хичээл • урьдчилсан үзэлт {previewCount}
                      </p>
                      <p className="mt-3 font-semibold text-[#C9A84C]">
                        {item.price === 0 ? 'Үнэгүй' : `₮${item.price.toLocaleString()}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {teacher && (
        <div className="fixed bottom-4 right-4 z-40 w-[min(380px,calc(100vw-1.5rem))]">
          {showMentorChat ? (
            <div className="overflow-hidden rounded-2xl border border-[rgba(217,195,138,0.3)] bg-[#0d0f15] shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between border-b border-[rgba(245,240,232,0.08)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] text-xs font-bold text-[#E8C96D]">
                    M
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F5F0E8]">Studio mentor</p>
                    <p className="text-xs text-[#8f8779]">Онлайн</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMentorChat(false)}
                  className="rounded-md px-2 py-1 text-sm text-[#8f8779] transition hover:bg-[rgba(245,240,232,0.08)] hover:text-[#F5F0E8]"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[320px] min-h-[220px] space-y-2 overflow-y-auto bg-[#0A0A0F] p-3">
                {mentorMessages.length === 0 ? (
                  <p className="text-sm text-[#7A7570]">Сайн байна уу! Би танд юугаар туслах вэ?</p>
                ) : (
                  mentorMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[86%] rounded-xl px-3 py-2 text-sm leading-6 ${
                        message.role === 'user'
                          ? 'ml-auto bg-[rgba(201,168,76,0.18)] text-[#f5e7bc]'
                          : 'bg-[#151722] text-[#d4d0c8]'
                      }`}
                    >
                      {message.content}
                    </div>
                  ))
                )}
                <div ref={mentorChatEndRef} />
              </div>

              {!user ? (
                <div className="border-t border-[rgba(245,240,232,0.08)] p-3">
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="w-full rounded-lg bg-[rgba(201,168,76,0.14)] px-3 py-2.5 text-sm font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.24)]"
                  >
                    Нэвтэрч чатлах
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 border-t border-[rgba(245,240,232,0.08)] p-3">
                  <input
                    value={mentorChatInput}
                    onChange={(e) => setMentorChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMentorMessage();
                      }
                    }}
                    placeholder="Зурвас бичих..."
                    className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.35)]"
                  />
                  <button
                    onClick={handleSendMentorMessage}
                    disabled={!mentorChatInput.trim() || sendingMentorMessage}
                    className="rounded-lg bg-[rgba(201,168,76,0.14)] px-3 py-2 text-sm font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.24)] disabled:opacity-50"
                  >
                    {sendingMentorMessage ? '...' : 'Илгээх'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowMentorChat(true)}
              className="chat-pulse ml-auto flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,168,76,0.32)] bg-[rgba(201,168,76,0.16)] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
              style={{ background: 'var(--gold)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#0c0c0b" aria-hidden>
                <path d="M12 3C6.9 3 3 6.58 3 11c0 2.19.99 4.17 2.65 5.61L4.5 21l4.72-1.43c.87.2 1.8.31 2.78.31 5.1 0 9-3.58 9-8s-3.9-8.88-9-8.88Zm-4 7.75a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Zm4 0a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Zm4 0a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
