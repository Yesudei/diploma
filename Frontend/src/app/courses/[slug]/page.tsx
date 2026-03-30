'use client';
import { useState, useEffect } from 'react';
import { courses, Lesson } from '@/lib/data';
import { teachers } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases } from '@/hooks/usePurchases';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false });

const categoryLabel: Record<string, string> = {
  basics: 'Үндэс',
  beats: 'Beat Making',
  mixing: 'Mixing',
  'sound-design': 'Sound Design',
  mastering: 'Mastering',
};

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const [slug, setSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const course = courses.find((c) => c.slug === slug);
  const teacher = course ? teachers.find((t) => t.id === course.teacherId) : null;
  const { user } = useAuth();
  const { canWatch, loading: purchasesLoading } = usePurchases();
  const router = useRouter();
  const [buying, setBuying] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (params?.slug) {
      setSlug(params.slug);
      setLoading(false);
    }
  }, [params]);

  if (loading || !slug) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#7A7570]">Ачаалж байна...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-[#7A7570]">
        Хичээл олдсонгүй
      </div>
    );
  }

  const alreadyOwned = canWatch(course.id, course.price);

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

  return (
    <>
      <Nav />
      <main className="pt-[100px] pb-20 px-[60px] min-h-screen bg-[#0A0A0F]">
        <div className="max-w-6xl mx-auto">
          {showLockedModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-8 max-w-md w-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#C9A84C]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Төлбөр төлөх шаардлагатай</h3>
                  <p className="text-[#7A7570] mb-6">
                    Энэ хичээл нь төлбөртэй. Хичээлд хандахын тулд худалдаж аваарай.
                  </p>
                  <button
                    onClick={handleBuy}
                    disabled={buying}
                    className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded-xl hover:bg-[#E8C96D] transition mb-3"
                  >
                    {buying ? 'Төлөх гэж байна...' : `₮${course.price.toLocaleString()} - Худалдаж авах`}
                  </button>
                  <button
                    onClick={closeModal}
                    className="w-full text-[#7A7570] hover:text-white py-2 transition"
                  >
                    Болих
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentLesson && (currentLesson.free || alreadyOwned) && (
            <div className="mb-8">
              <VideoPlayer 
                videoId={currentLesson.youtubeId}
                onComplete={() => {}}
              />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{currentLesson.title}</h2>
                  <p className="text-[#7A7570] text-sm">{currentLesson.durationMinutes} мин</p>
                </div>
                <button 
                  onClick={() => setCurrentLesson(null)}
                  className="text-[#7A7570] hover:text-white transition"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-[1fr_380px] gap-16">
            <div>
              <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-3">
                {categoryLabel[course.category] || course.category}
              </div>
              <h1 className="font-display text-[clamp(32px,4vw,52px)] font-bold mb-4">
                {course.title}
              </h1>
              <p className="text-[#7A7570] text-lg leading-relaxed mb-8">{course.description}</p>

              {teacher && (
                <div className="flex items-center gap-3 mb-10 p-4 bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2a1f08] to-[#1a1406] border border-[rgba(201,168,76,0.18)] flex items-center justify-center font-display text-[#C9A84C] text-xl">
                    {teacher.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-[#F5F0E8]">{teacher.name}</div>
                    <div className="text-[#7A7570] text-sm">{teacher.role}</div>
                  </div>
                </div>
              )}

              <h2 className="font-display text-xl font-bold mb-4">Хичээлийн агуулга ({course.curriculum.length} хичээл)</h2>
              <div className="space-y-2">
                {course.curriculum.map((lesson, i) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson)}
                    className="w-full flex items-center gap-3 p-3.5 bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl hover:border-[rgba(201,168,76,0.2)] transition text-left"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#18181F] flex items-center justify-center text-xs text-[#7A7570] font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-[#F5F0E8]">{lesson.title}</span>
                    {lesson.free ? (
                      <span className="text-[#C9A84C] text-xs font-bold">Үнэгүй</span>
                    ) : alreadyOwned ? (
                      <span className="text-[#C9A84C] text-xs">✓</span>
                    ) : (
                      <svg className="w-4 h-4 text-[#7A7570]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                    <span className="text-[#7A7570] text-xs">{lesson.durationMinutes}мін</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="sticky top-24 h-fit" id="buy-section">
              {course.price === 0 ? (
                <div className="bg-[#111118] border border-[rgba(201,168,76,0.15)] rounded-2xl p-7">
                  <div className="text-center">
                    <div className="font-display text-4xl font-bold text-[#C9A84C] mb-2">Үнэгүй</div>
                    <p className="text-[#7A7570] text-sm mb-6">Бүртгэлгүй үзэх боломжтой</p>
                    <button
                      onClick={() => course.curriculum[0] && setCurrentLesson(course.curriculum[0])}
                      className="w-full bg-[#C9A84C] text-[#0A0A0F] font-bold py-4 rounded-xl hover:bg-[#E8C96D] transition-all"
                    >
                      Эхлэх →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#111118] border border-[rgba(201,168,76,0.15)] rounded-2xl p-7">
                  <div className="text-center mb-6">
                    <div className="font-display text-4xl font-bold text-[#C9A84C] mb-1">
                      ₮{course.price.toLocaleString()}
                    </div>
                    <p className="text-[#7A7570] text-sm">Нэг удаагийн төлбөр</p>
                  </div>

                  {!user ? (
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="w-full bg-[#C9A84C] text-[#0A0A0F] font-bold py-4 rounded-xl hover:bg-[#E8C96D] transition-all mb-4"
                    >
                      Нэвтрэх
                    </button>
                  ) : alreadyOwned ? (
                    <button
                      onClick={() => course.curriculum[0] && setCurrentLesson(course.curriculum[0])}
                      className="w-full bg-[#C9A84C] text-[#0A0A0F] font-bold py-4 rounded-xl hover:bg-[#E8C96D] transition-all"
                    >
                      Үзэх →
                    </button>
                  ) : (
                    <button
                      onClick={handleBuy}
                      disabled={buying}
                      className="w-full bg-[#C9A84C] text-[#0A0A0F] font-bold py-4 rounded-xl hover:bg-[#E8C96D] transition-all disabled:opacity-60"
                    >
                      {buying ? 'Төлөх гэж байна...' : 'Худалдаж авах'}
                    </button>
                  )}

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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
