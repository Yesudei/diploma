'use client';
import { useState, useEffect, useRef } from 'react';
import { courses, Lesson } from '@/lib/data';
import { teachers } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases } from '@/hooks/usePurchases';
import { supabase } from '@/lib/supabase';
import apiService from '@/services/api';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import type { ChatMessage } from '@/types';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });

const categoryLabel: Record<string, string> = {
  'music-production': 'MUSIC-PRODUCTION',
  'mixing-mastering': 'MIXING-MASTERING',
  'sound-design': 'SOUND-DESIGN',
  'melody-voice': 'MELODY-VOICE',
  'audio-engineering': 'AUDIO-ENGINEERING',
  basics: 'Үндэс',
  beats: 'Битийн',
  mixing: 'Миксинг',
  mastering: 'Мастеринг',
};

type SelfCheckMode = 'per-lesson' | 'final-only';

interface SelfCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
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
  const [buying, setBuying] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [showTeacherPreview, setShowTeacherPreview] = useState(false);
  const [showMentorChat, setShowMentorChat] = useState(false);
  const [mentorChatInput, setMentorChatInput] = useState('');
  const [mentorMessages, setMentorMessages] = useState<ChatMessage[]>([]);
  const [sendingMentorMessage, setSendingMentorMessage] = useState(false);
  const [selfCheckMode, setSelfCheckMode] = useState<SelfCheckMode>('per-lesson');
  const [lessonCompletedIds, setLessonCompletedIds] = useState<string[]>([]);
  const [lessonQuizPassedIds, setLessonQuizPassedIds] = useState<string[]>([]);
  const [courseQuizPassed, setCourseQuizPassed] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<SelfCheckQuiz | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
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
  }, [slug]);

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
          'Rhythm pattern-уудыг хэсэг хэсгээр нь зохион байгуулж ажиллахын гол давуу тал юу вэ?',
        options: [
          'Arrange хийхэд бүтэц, workflow тодорхой болдог',
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
          'Бүх сувгийг ижил loud болгох',
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
    const wrongLowDuration = Math.max(1, lesson.durationMinutes - 4);
    const wrongHighDuration = lesson.durationMinutes + 4;

    return {
      id: `lesson-quiz-${lesson.id}`,
      type: 'lesson',
      lessonId: lesson.id,
      title: `${lessonIndex + 1}-р хичээлийн Self-check`,
      subtitle: lesson.title,
      passScore: 2,
      questions: [
        {
          id: `${lesson.id}-q-topic`,
          question: 'Энэ хичээлийн гол сэдэв аль нь вэ?',
          options: [
            lesson.title,
            `${course.title}-ийн course summary`,
            'Final mastering checklist',
            'Marketplace asset upload',
          ],
          correctIndex: 0,
        },
        {
          id: `${lesson.id}-q-duration`,
          question: 'Энэ хичээлийн урт хэдэн минут вэ?',
          options: [
            `${lesson.durationMinutes} мин`,
            `${wrongLowDuration} мин`,
            `${wrongHighDuration} мин`,
            `${lesson.durationMinutes + 9} мин`,
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
      teacher?.name || teachers.find((item) => item.id !== course.teacherId)?.name || 'Unknown';
    const secondTeacher =
      teachers.find((item) => item.id !== course.teacherId && item.name !== firstTeacher)?.name ||
      'Unknown';

    return {
      id: `course-quiz-${course.id}`,
      type: 'course',
      title: 'Бүтэн курсийн Self-check',
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
          question: 'Энэ курсийн ангилал аль нь вэ?',
          options: [
            categoryLabel[course.category] || course.category,
            'AI Analysis',
            'Marketplace Design',
            'Audio Upload',
          ],
          correctIndex: 0,
        },
        {
          id: `${course.id}-cq-teacher`,
          question: 'Курсийг хөтөлж буй ментор хэн бэ?',
          options: [teacher?.name || 'Unknown Mentor', firstTeacher, secondTeacher, 'Guest Mentor'],
          correctIndex: 0,
        },
        {
          id: `${course.id}-cq-pricing`,
          question: 'Энэ курсийн төлбөрийн хэлбэр аль нь вэ?',
          options:
            course.price === 0
              ? ['Үнэгүй', 'Сарын subscription', 'Нэг удаагийн $99', 'Enterprise only']
              : [
                  'Нэг удаагийн төлбөр',
                  'Үнэгүй',
                  'Зөвхөн trial хэрэглэгчид',
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

  const handleBuy = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setBuying(true);

    const { error } = await supabase
      .from('purchased_courses')
      .insert({ user_id: user.id, course_id: course.id });

    if (error) {
      toast.error('Алдаа гарлаа. Дахин оролдоно уу.');
    } else {
      toast.success('Амжилттай худалдаж авлаа!');
    }
    setBuying(false);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.free || alreadyOwned) {
      setCurrentLesson(lesson);
      setShowLockedModal(false);
    } else if (!user) {
      router.push('/auth/login');
    } else {
      setShowLockedModal(true);
    }
  };

  const closeModal = () => {
    setShowLockedModal(false);
    setCurrentLesson(null);
  };

  const handleContactMentor = () => {
    setShowMentorChat(true);
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
      const message = error instanceof Error ? error.message : 'Message failed';
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
      toast.success(`Lesson self-check амжилттай (${correct}/${total})`);
      return;
    }

    setCourseQuizPassed(true);
    toast.success(`Курсийн эцсийн тест амжилттай (${correct}/${total})`);
  };

  const handleCloseQuiz = () => {
    setShowQuizModal(false);
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizScore(null);
  };

  const hasVideoCurrentLesson = Boolean(currentLesson?.youtubeId);

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#0A0A0F] pb-20 pt-24 sm:pt-28">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-14">
          {showLockedModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-md rounded-2xl border border-[rgba(245,240,232,0.12)] bg-[#1A1A1A] p-7 sm:p-8">
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
                    disabled={buying}
                    className="mb-3 w-full rounded-xl bg-[#C9A84C] py-3 font-bold text-black transition hover:bg-[#E8C96D]"
                  >
                    {buying ? 'Төлж байна...' : `₮${course.price.toLocaleString()} - Худалдаж авах`}
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
              <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[rgba(217,195,138,0.3)] bg-[linear-gradient(165deg,rgba(217,195,138,0.1),rgba(12,13,20,0.98)_48%)]">
                <div className="flex items-start justify-between border-b border-[rgba(245,240,232,0.08)] px-5 py-4 sm:px-7">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a69262]">
                      Self-check Test
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
            <section className="mb-8 overflow-hidden rounded-[24px] border border-[rgba(245,240,232,0.1)] bg-[#111118] p-4 sm:p-5">
              {!hasVideoCurrentLesson ? (
                <div className="overflow-hidden rounded-[20px] border border-[rgba(217,195,138,0.22)] bg-[linear-gradient(145deg,rgba(217,195,138,0.12),rgba(12,13,19,0.98)_48%)] p-6 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A84C]">
                        Lesson brief
                      </p>
                      <h2 className="mt-3 font-display text-[clamp(28px,4vw,44px)] font-black leading-[1.04] text-[#F5F0E8]">
                        {currentLesson.title}
                      </h2>
                    </div>
                    <button
                      onClick={() => setCurrentLesson(null)}
                      className="rounded-full border border-[rgba(245,240,232,0.1)] px-3 py-1.5 text-sm text-[#8f8779] transition hover:border-[rgba(217,195,138,0.32)] hover:text-[#F5F0E8]"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#b8ad93] sm:text-base">
                    Энэ бол Melodex-ийн дотоод lesson card. Гол санаа, хийх exercise, авч үлдэх
                    takeaway-г эндээс уншаад шууд даалгавраа хийгээд ахицаа тэмдэглэж болно.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.04)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#8d836f]">Focus</p>
                      <p className="mt-2 text-sm leading-6 text-[#F5F0E8]">
                        {currentLesson.summary ||
                          'Энэ lesson-ийн үндсэн ойлголтуудыг богино, төвлөрсөн байдлаар судална.'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.04)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#8d836f]">Exercise</p>
                      <p className="mt-2 text-sm leading-6 text-[#F5F0E8]">
                        {currentLesson.exercise || 'Сонсож, туршиж, өөрийн хувилбараа гарга.'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.04)] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#8d836f]">Takeaway</p>
                      <p className="mt-2 text-sm leading-6 text-[#F5F0E8]">
                        {currentLesson.takeaway ||
                          'Хичээлийн дараа нэг тодорхой санааг авч үлдэнэ.'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={handleLessonCompleted}
                      className="rounded-xl border border-[rgba(201,168,76,0.32)] bg-[rgba(201,168,76,0.12)] px-5 py-3 text-sm font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.2)]"
                    >
                      Дууссан гэж тэмдэглэх
                    </button>
                    <button
                      onClick={() => openLessonQuiz(currentLesson)}
                      className="rounded-xl border border-[rgba(245,240,232,0.14)] px-5 py-3 text-sm font-semibold text-[#d8ccb1] transition hover:border-[rgba(217,195,138,0.35)] hover:text-[#F5F0E8]"
                    >
                      Self-check
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <VideoPlayer videoId={currentLesson.youtubeId || ''} onComplete={() => {}} />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-white sm:text-xl">
                        {currentLesson.title}
                      </h2>
                      <p className="text-sm text-[#7A7570]">{currentLesson.durationMinutes} мин</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleLessonCompleted}
                        className="rounded-lg border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.14)] px-3 py-2 text-sm font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.22)]"
                      >
                        Дууссан гэж тэмдэглэх
                      </button>
                      <button
                        onClick={() => openLessonQuiz(currentLesson)}
                        className="rounded-lg border border-[rgba(245,240,232,0.14)] px-3 py-2 text-sm font-semibold text-[#d8ccb1] transition hover:border-[rgba(217,195,138,0.35)] hover:text-[#F5F0E8]"
                      >
                        Self-check
                      </button>
                      <button
                        onClick={() => setCurrentLesson(null)}
                        className="text-[#7A7570] transition hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          <section className="relative overflow-hidden rounded-[30px] border border-[rgba(217,195,138,0.22)] bg-[linear-gradient(165deg,rgba(217,195,138,0.12),rgba(17,17,24,0.95)_42%)] p-6 sm:p-8">
            <div className="pointer-events-none absolute right-[-60px] top-[-80px] h-56 w-56 rounded-full bg-[rgba(217,195,138,0.14)] blur-3xl" />
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
                        className="group flex flex-1 items-center justify-between rounded-xl border border-[rgba(245,240,232,0.08)] bg-[linear-gradient(135deg,rgba(17,17,24,0.96),rgba(14,15,21,0.96))] p-4 text-left transition hover:border-[rgba(201,168,76,0.28)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.32)]"
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
                        <span className="text-xs font-semibold text-[#C9A84C] transition group-hover:text-[#E8C96D]">
                          Hover for profile
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleContactMentor}
                        className="rounded-xl border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] px-4 py-3 text-sm font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.2)]"
                      >
                        Contact
                      </button>
                    </div>

                    {showTeacherPreview && (
                      <div className="z-30 mt-3 w-full rounded-2xl border border-[rgba(217,195,138,0.28)] bg-[#0d0f15] p-5 shadow-[0_24px_52px_rgba(0,0,0,0.5)] sm:max-w-[460px] lg:absolute lg:left-[calc(100%+16px)] lg:top-0 lg:mt-0 lg:w-[380px]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(217,195,138,0.4)] bg-gradient-to-br from-[#3a2b11] to-[#1a1408] font-display text-2xl text-[#E8C96D]">
                              {teacher.name[0]}
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9f8f67]">
                                Producer Profile
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
                            Specialty
                          </p>
                          <p className="mt-1 text-sm font-medium text-[#d9cba8]">
                            {teacher.specialty}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#b8ad93]">{teacher.bio}</p>
                        </div>

                        {teacher.instruments && teacher.instruments.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs uppercase tracking-[0.12em] text-[#8f8779]">
                              Uses
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
                  <div className="mt-4 rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[#10121b] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a69262]">
                          Self-check setup
                        </p>
                        <p className="mt-1 text-sm text-[#b8ad93]">
                          Lesson бүр тест өгөх эсвэл бүтэн курсийн төгсгөлийн нэг тест сонгоно уу.
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
                          Lesson бүр
                        </button>
                        <button
                          onClick={() => setSelfCheckMode('final-only')}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            selfCheckMode === 'final-only'
                              ? 'border-[rgba(217,195,138,0.45)] bg-[rgba(201,168,76,0.16)] text-[#F5F0E8]'
                              : 'border-[rgba(245,240,232,0.14)] text-[#b7aa8d] hover:border-[rgba(217,195,138,0.32)]'
                          }`}
                        >
                          Курсийн төгсгөлд
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-[#c6bda8] sm:grid-cols-3">
                      <p className="rounded-lg border border-[rgba(245,240,232,0.08)] bg-[#121522] px-3 py-2">
                        Дуусгасан lesson: {lessonCompletedIds.length}/{course.curriculum.length}
                      </p>
                      <p className="rounded-lg border border-[rgba(245,240,232,0.08)] bg-[#121522] px-3 py-2">
                        Lesson тест: {lessonQuizPassedIds.length}/{course.curriculum.length}
                      </p>
                      <p className="rounded-lg border border-[rgba(245,240,232,0.08)] bg-[#121522] px-3 py-2">
                        Final test: {courseQuizPassed ? 'Тэнцсэн' : 'Өгөөгүй'}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-[#8c816b]">
                        {finalQuizUnlocked
                          ? 'Final self-check тест нээгдсэн.'
                          : selfCheckMode === 'per-lesson'
                            ? 'Final тест нээхийн тулд lesson бүрийн тестийг давна уу.'
                            : 'Final тест нээхийн тулд бүх lesson-ээ дуусгасан гэж тэмдэглэнэ үү.'}
                      </p>
                      <button
                        onClick={openCourseQuiz}
                        disabled={!finalQuizUnlocked}
                        className="rounded-xl bg-[#C9A84C] px-4 py-2 text-sm font-bold text-[#0A0A0F] transition hover:bg-[#E8C96D] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Бүтэн курсийн тест эхлэх
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    {course.curriculum.map((lesson, i) => (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        className="flex w-full items-center gap-3 rounded-xl border border-[rgba(245,240,232,0.06)] bg-[#111118] p-3.5 text-left transition hover:border-[rgba(201,168,76,0.22)]"
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
                                LESSON NOTE
                              </span>
                            )}
                            {lessonQuizPassedIds.includes(lesson.id) && (
                              <span className="rounded-full border border-[rgba(217,195,138,0.35)] bg-[rgba(217,195,138,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#E8C96D]">
                                SELF-CHECK ✓
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
                        <span className="text-xs text-[#7A7570]">{lesson.durationMinutes} мин</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="h-fit lg:sticky lg:top-24" id="buy-section">
                {course.price === 0 ? (
                  <div className="rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[#111118] p-6">
                    <div className="text-center">
                      <div className="font-display text-4xl font-black text-[#C9A84C]">Үнэгүй</div>
                      <p className="mt-2 text-sm text-[#7A7570]">Бүртгэлгүй үзэх боломжтой</p>
                      <button
                        onClick={() =>
                          course.curriculum[0] && setCurrentLesson(course.curriculum[0])
                        }
                        className="mt-6 w-full rounded-xl bg-[#C9A84C] py-3.5 font-bold text-[#0A0A0F] transition hover:bg-[#E8C96D]"
                      >
                        Эхлэх
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[#111118] p-6">
                    <div className="text-center">
                      <div className="font-display text-4xl font-black text-[#C9A84C]">
                        ₮{course.price.toLocaleString()}
                      </div>
                      <p className="mt-2 text-sm text-[#7A7570]">Нэг удаагийн төлбөр</p>
                    </div>

                    <div className="mt-6">
                      {!user ? (
                        <button
                          onClick={() => router.push('/auth/login')}
                          className="w-full rounded-xl bg-[#C9A84C] py-3.5 font-bold text-[#0A0A0F] transition hover:bg-[#E8C96D]"
                        >
                          Нэвтрэх
                        </button>
                      ) : alreadyOwned ? (
                        <button
                          onClick={() =>
                            course.curriculum[0] && setCurrentLesson(course.curriculum[0])
                          }
                          className="w-full rounded-xl bg-[#C9A84C] py-3.5 font-bold text-[#0A0A0F] transition hover:bg-[#E8C96D]"
                        >
                          Үзэж эхлэх
                        </button>
                      ) : (
                        <button
                          onClick={handleBuy}
                          disabled={buying}
                          className="w-full rounded-xl bg-[#C9A84C] py-3.5 font-bold text-[#0A0A0F] transition hover:bg-[#E8C96D] disabled:opacity-60"
                        >
                          {buying ? 'Төлж байна...' : 'Худалдаж авах'}
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
                  </div>
                )}
              </aside>
            </div>
          </section>
        </div>
      </main>

      {teacher && (
        <div className="fixed bottom-4 right-4 z-40 w-[min(380px,calc(100vw-1.5rem))]">
          {showMentorChat ? (
            <div className="overflow-hidden rounded-2xl border border-[rgba(217,195,138,0.3)] bg-[#0d0f15] shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between border-b border-[rgba(245,240,232,0.08)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] text-xs font-bold text-[#E8C96D]">
                    {teacher.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#F5F0E8]">{teacher.name}</p>
                    <p className="text-xs text-[#8f8779]">{teacher.role}</p>
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
                  <p className="text-sm text-[#7A7570]">
                    Сайн байна уу! Би {teacher.name}. Юугаар туслах вэ?
                  </p>
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
                    placeholder={`${teacher.name}-д зурвас бичих...`}
                    className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.35)]"
                  />
                  <button
                    onClick={handleSendMentorMessage}
                    disabled={!mentorChatInput.trim() || sendingMentorMessage}
                    className="rounded-lg bg-[rgba(201,168,76,0.14)] px-3 py-2 text-sm font-semibold text-[#E8C96D] transition hover:bg-[rgba(201,168,76,0.24)] disabled:opacity-50"
                  >
                    {sendingMentorMessage ? '...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowMentorChat(true)}
              className="ml-auto flex items-center gap-2 rounded-full border border-[rgba(201,168,76,0.32)] bg-[rgba(201,168,76,0.16)] px-4 py-2.5 text-sm font-semibold text-[#E8C96D] shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition hover:bg-[rgba(201,168,76,0.24)]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(201,168,76,0.22)] text-xs font-bold">
                {teacher.name[0]}
              </span>
              Contact {teacher.name.split(' ')[0]}
            </button>
          )}
        </div>
      )}
      <Footer />
    </>
  );
}
