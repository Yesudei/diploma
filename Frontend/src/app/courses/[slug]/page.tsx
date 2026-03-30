'use client';
import { useState } from 'react';
import { courses } from '@/lib/data';
import { teachers } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { usePurchases } from '@/hooks/usePurchases';
import { purchaseCourse, createPayment, confirmPayment } from '@/lib/database';
import { useRouter } from 'next/navigation';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';

const categoryLabel: Record<string, string> = {
  basics: 'Үндэс',
  beats: 'Beat Making',
  mixing: 'Mixing',
  'sound-design': 'Sound Design',
  mastering: 'Mastering',
};

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = courses.find((c) => c.slug === params.slug);
  const teacher = course ? teachers.find((t) => t.id === course.teacherId) : null;
  const { user } = useAuth();
  const { canWatch } = usePurchases();
  const router = useRouter();
  const [buying, setBuying] = useState(false);

  if (!course)
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center text-[#7A7570]">
        Хичээл олдсонгүй
      </div>
    );

  const alreadyOwned = canWatch(course.id, course.price);

  const handleBuy = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setBuying(true);
    const { data: payment } = await createPayment(user.id, course.id, course.price, 'qpay');
    if (payment) {
      await confirmPayment(payment.id);
      await purchaseCourse(user.id, course.id);
      router.push(`/dashboard/watch/${course.id}`);
    }
    setBuying(false);
  };

  return (
    <>
      <Nav />
      <main className="pt-[100px] pb-20 px-[60px] min-h-screen bg-[#0A0A0F]">
        <div className="grid grid-cols-[1fr_380px] gap-16 max-w-6xl mx-auto">
          <div>
            <div className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-3">
              {categoryLabel[course.category]}
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

            <h2 className="font-display text-xl font-bold mb-4">Хичээлийн агуулга</h2>
            <div className="space-y-2">
              {course.curriculum.map((lesson, i) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 p-3.5 bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-xl"
                >
                  <span className="w-7 h-7 rounded-full bg-[#18181F] flex items-center justify-center text-xs text-[#7A7570] font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-[#F5F0E8]">{lesson.title}</span>
                  {lesson.free ? (
                    <span className="text-[#C9A84C] text-xs font-bold">Үнэгүй</span>
                  ) : (
                    <span className="text-[#7A7570] text-xs">🔒</span>
                  )}
                  <span className="text-[#7A7570] text-xs">{lesson.durationMinutes}мін</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky top-24 h-fit">
            <div className="bg-[#111118] border border-[rgba(201,168,76,0.15)] rounded-2xl p-7">
              <div className="font-display text-4xl font-bold text-[#C9A84C] mb-1">
                {course.price === 0 ? 'Үнэгүй' : `₮${course.price.toLocaleString()}`}
              </div>
              <p className="text-[#7A7570] text-sm mb-6">
                {course.price > 0 && '.FLP project файл хавсаргана'}
              </p>

              {alreadyOwned ? (
                <button
                  onClick={() => router.push(`/dashboard/watch/${course.id}`)}
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
                  {buying ? 'Боловсруулж байна...' : course.price === 0 ? 'Эхлэх' : 'Худалдаж авах'}
                </button>
              )}

              <div className="mt-5 space-y-2 text-sm text-[#7A7570]">
                <div className="flex items-center gap-2">
                  <span className="text-[#C9A84C]">✓</span> Хязгааргүй хугацаагаар үзэх
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#C9A84C]">✓</span> {course.curriculum.length} хичээл
                </div>
                {course.price > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#C9A84C]">✓</span> .FLP project файл
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[#C9A84C]">✓</span> 7 хоногийн буцаалт
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
