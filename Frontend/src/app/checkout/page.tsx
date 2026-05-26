'use client';

import { Suspense, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { courses } from '@/lib/data';
import { BANK_TRANSFER_ACCOUNT } from '@/lib/bank-payment';
import { createBankTransferPayment } from '@/lib/database';
import { useAuth } from '@/hooks/useAuth';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });

const formatPrice = (price: number): string => `₮${price.toLocaleString()}`;

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0A0A0F] px-4 py-28 text-center text-[#b8ad93]">
          Төлбөрийн хуудсыг ачаалж байна...
        </main>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [submittedReference, setSubmittedReference] = useState('');

  const course = useMemo(() => {
    const courseId = searchParams.get('courseId');
    const slug = searchParams.get('slug');

    return (
      courses.find((item) => item.id === courseId) ||
      courses.find((item) => item.slug === slug) ||
      null
    );
  }, [searchParams]);

  const freeLessons = course?.curriculum.filter((lesson) => lesson.free).length ?? 0;
  const paidLessons = (course?.curriculum.length ?? 0) - freeLessons;

  const handleConfirmPayment = async () => {
    if (!course) return;

    if (!user) {
      toast.error('Төлбөр бүртгүүлэхийн тулд нэвтэрнэ үү.');
      router.push(
        `/auth/login?redirect=/checkout?courseId=${encodeURIComponent(course.id)}&slug=${encodeURIComponent(course.slug)}`,
      );
      return;
    }

    if (course.price === 0) {
      router.push(`/courses/${course.slug}`);
      return;
    }

    setProcessing(true);

    try {
      const payment = await createBankTransferPayment(user.id, course.id, course.price);
      setSubmittedReference(payment.paymentReference);
      toast.success('Төлбөрийн хүсэлт бүртгэгдлээ. Шилжүүлгээ хийгээд админ баталгаажуулна.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Төлбөр бүртгэхэд алдаа гарлаа.';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#0A0A0F] pb-14 pt-28 sm:pt-32">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-14">
          {!course ? (
            <section className="rounded-2xl border border-[rgba(245,240,232,0.12)] bg-[#111118] p-8 text-center">
              <h1 className="font-display text-3xl font-bold text-[#F5F0E8]">
                Төлбөрийн мэдээлэл олдсонгүй
              </h1>
              <p className="mt-3 text-sm text-[#8e8778]">
                Курс сонгоод дахин оролдоно уу.
              </p>
              <Link
                href="/courses"
                className="mt-6 inline-flex rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0A0A0F]"
              >
                Хичээлүүд рүү буцах
              </Link>
            </section>
          ) : (
            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="rounded-2xl border border-[rgba(217,195,138,0.22)] bg-[linear-gradient(165deg,rgba(217,195,138,0.08),rgba(17,17,24,0.95)_44%)] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a69262]">
                  Bank transfer
                </p>
                <h1 className="mt-3 font-display text-3xl font-bold text-[#F5F0E8]">
                  Төлбөр хийх
                </h1>
                <p className="mt-2 text-sm text-[#9f9279]">
                  Одоогоор банкны шилжүүлгээр төлбөр авч, админ баталгаажуулсны дараа курс
                  нээгдэнэ.
                </p>

                <div className="mt-6 rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0f1118] p-4 text-sm text-[#c8bda3]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a69262]">
                    Шилжүүлэх данс
                  </p>
                  <dl className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#8e8778]">Банк</dt>
                      <dd className="font-semibold text-[#F5F0E8]">
                        {BANK_TRANSFER_ACCOUNT.bankName}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#8e8778]">Данс</dt>
                      <dd className="font-semibold text-[#F5F0E8]">
                        {BANK_TRANSFER_ACCOUNT.accountNumber}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-[#8e8778]">Нэр</dt>
                      <dd className="font-semibold text-[#F5F0E8]">
                        {BANK_TRANSFER_ACCOUNT.accountName}
                      </dd>
                    </div>
                    {submittedReference && (
                      <div className="flex items-center justify-between gap-4 border-t border-[rgba(245,240,232,0.08)] pt-3">
                        <dt className="text-[#8e8778]">Гүйлгээний утга</dt>
                        <dd className="font-semibold text-[#E8C96D]">{submittedReference}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={processing || authLoading || Boolean(submittedReference)}
                  className="mt-6 w-full rounded-xl bg-[#C9A84C] py-3.5 text-sm font-bold text-[#0A0A0F] transition hover:bg-[#E8C96D] disabled:opacity-60"
                >
                  {submittedReference
                    ? 'Хүсэлт бүртгэгдсэн'
                    : processing
                      ? 'Бүртгэж байна...'
                      : `${formatPrice(course.price)} төлбөрийн хүсэлт илгээх`}
                </button>

                {submittedReference && (
                  <p className="mt-3 text-xs leading-5 text-[#9f9279]">
                    Гүйлгээний утга дээр энэ кодыг бичвэл админ төлбөрийг хурдан шалгана.
                  </p>
                )}
              </div>

              <aside className="h-fit rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[#111118] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a69262]">
                  Захиалгын мэдээлэл
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#F5F0E8]">
                  {course.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#9f9279]">{course.description}</p>

                <div className="mt-5 space-y-2 rounded-xl border border-[rgba(245,240,232,0.1)] bg-[#0f1118] p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8e8778]">Нийт хичээл</span>
                    <span className="font-semibold text-[#F5F0E8]">{course.curriculum.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8e8778]">Үнэгүй үзэлт</span>
                    <span className="font-semibold text-[#F5F0E8]">{freeLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8e8778]">Төлбөртэй хичээл</span>
                    <span className="font-semibold text-[#F5F0E8]">{paidLessons}</span>
                  </div>
                  <div className="mt-3 border-t border-[rgba(245,240,232,0.08)] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8778]">Нийт төлбөр</span>
                      <span className="font-display text-2xl text-[#C9A84C]">
                        {formatPrice(course.price)}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/courses/${course.slug}`}
                  className="mt-5 inline-flex text-xs text-[#8e8778] transition-colors hover:text-[#C9A84C]"
                >
                  ← Курс руу буцах
                </Link>
              </aside>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
