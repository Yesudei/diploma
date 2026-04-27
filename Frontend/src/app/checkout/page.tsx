'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { courses } from '@/lib/data';
import { addLocalPurchasedCourse } from '@/lib/mockPayments';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });

type PaymentMethod = 'card' | 'qpay' | 'bank';

type CardFormState = {
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  email: string;
};

const formatPrice = (price: number): string => `₮${price.toLocaleString()}`;

const maskCardInput = (value: string): string =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();

const maskExpiryInput = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length < 3) return cleaned;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [processing, setProcessing] = useState(false);
  const [cardForm, setCardForm] = useState<CardFormState>({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    email: '',
  });

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

    if (course.price === 0) {
      addLocalPurchasedCourse(course.id);
      router.push(`/courses/${course.slug}`);
      return;
    }

    if (paymentMethod === 'card') {
      const cleanCard = cardForm.cardNumber.replace(/\s/g, '');
      const isCardValid = cleanCard.length === 16;
      const isExpiryValid = /^\d{2}\/\d{2}$/.test(cardForm.expiry);
      const isCvvValid = /^\d{3,4}$/.test(cardForm.cvv);
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cardForm.email.trim());

      if (!cardForm.cardholder.trim() || !isCardValid || !isExpiryValid || !isCvvValid || !isEmailValid) {
        toast.error('Картын мэдээллээ бүрэн зөв оруулна уу.');
        return;
      }
    }

    setProcessing(true);

    await new Promise((resolve) => {
      setTimeout(resolve, 1300);
    });

    addLocalPurchasedCourse(course.id);
    toast.success('Төлбөр амжилттай. Курс нээгдлээ.');
    router.push(`/courses/${course.slug}?payment=success`);
  };

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#0A0A0F] pb-14 pt-28 sm:pt-32">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-14">
          {!course ? (
            <section className="rounded-2xl border border-[rgba(245,240,232,0.12)] bg-[#111118] p-8 text-center">
              <h1 className="font-display text-3xl font-bold text-[#F5F0E8]">Төлбөрийн мэдээлэл олдсонгүй</h1>
              <p className="mt-3 text-sm text-[#8e8778]">
                Курс сонгож байгаад дахин оролдоно уу.
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
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a69262]">Secure checkout</p>
                <h1 className="mt-3 font-display text-3xl font-bold text-[#F5F0E8]">Төлбөр хийх</h1>
                <p className="mt-2 text-sm text-[#9f9279]">
                  Demo checkout: backend/API холболтгүй, сургалтын тестэд зориулав.
                </p>

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      paymentMethod === 'card'
                        ? 'border-[rgba(217,195,138,0.45)] bg-[rgba(201,168,76,0.14)]'
                        : 'border-[rgba(245,240,232,0.12)] bg-[#11131b]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#F5F0E8]">Картаар төлөх</p>
                    <p className="text-xs text-[#8e8778]">Visa / MasterCard</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qpay')}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      paymentMethod === 'qpay'
                        ? 'border-[rgba(217,195,138,0.45)] bg-[rgba(201,168,76,0.14)]'
                        : 'border-[rgba(245,240,232,0.12)] bg-[#11131b]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#F5F0E8]">QPay</p>
                    <p className="text-xs text-[#8e8778]">QR код уншуулж төлөх</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      paymentMethod === 'bank'
                        ? 'border-[rgba(217,195,138,0.45)] bg-[rgba(201,168,76,0.14)]'
                        : 'border-[rgba(245,240,232,0.12)] bg-[#11131b]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#F5F0E8]">Дансаар шилжүүлэх</p>
                    <p className="text-xs text-[#8e8778]">Банкны дансны мэдээлэл ашиглах</p>
                  </button>
                </div>

                {paymentMethod === 'card' && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-xs text-[#a19783]">Карт эзэмшигчийн нэр</span>
                      <input
                        value={cardForm.cardholder}
                        onChange={(event) =>
                          setCardForm((prev) => ({ ...prev, cardholder: event.target.value }))
                        }
                        placeholder="Bat-Erdene D"
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2.5 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.4)]"
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-xs text-[#a19783]">Картын дугаар</span>
                      <input
                        value={cardForm.cardNumber}
                        onChange={(event) =>
                          setCardForm((prev) => ({
                            ...prev,
                            cardNumber: maskCardInput(event.target.value),
                          }))
                        }
                        placeholder="0000 0000 0000 0000"
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2.5 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.4)]"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs text-[#a19783]">Хүчинтэй хугацаа</span>
                      <input
                        value={cardForm.expiry}
                        onChange={(event) =>
                          setCardForm((prev) => ({
                            ...prev,
                            expiry: maskExpiryInput(event.target.value),
                          }))
                        }
                        placeholder="MM/YY"
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2.5 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.4)]"
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-xs text-[#a19783]">CVV</span>
                      <input
                        value={cardForm.cvv}
                        onChange={(event) =>
                          setCardForm((prev) => ({
                            ...prev,
                            cvv: event.target.value.replace(/\D/g, '').slice(0, 4),
                          }))
                        }
                        placeholder="123"
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2.5 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.4)]"
                      />
                    </label>

                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-xs text-[#a19783]">Имэйл</span>
                      <input
                        type="email"
                        value={cardForm.email}
                        onChange={(event) =>
                          setCardForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-[rgba(245,240,232,0.12)] bg-[#0A0A0F] px-3 py-2.5 text-sm text-[#F5F0E8] outline-none focus:border-[rgba(201,168,76,0.4)]"
                      />
                    </label>
                  </div>
                )}

                {paymentMethod === 'qpay' && (
                  <div className="mt-6 rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0f1118] p-4">
                    <div className="mx-auto grid h-44 w-44 place-items-center rounded-lg border border-[rgba(201,168,76,0.28)] bg-[radial-gradient(circle_at_40%_30%,rgba(201,168,76,0.2),rgba(12,12,11,0.95)_60%)] text-xs text-[#c7bb9e]">
                      QR Demo
                    </div>
                    <p className="mt-3 text-center text-xs text-[#8e8778]">
                      Энэ бол demo QR. Төлбөрийн API холболтгүй.
                    </p>
                  </div>
                )}

                {paymentMethod === 'bank' && (
                  <div className="mt-6 rounded-xl border border-[rgba(245,240,232,0.12)] bg-[#0f1118] p-4 text-sm text-[#c8bda3]">
                    <p>Хүлээн авагч: Melodex Training LLC</p>
                    <p className="mt-1">Банк: ХААН Банк</p>
                    <p className="mt-1">Данс: 5000 1234 5678 9012</p>
                    <p className="mt-2 text-xs text-[#8e8778]">Demo мэдээлэл, бодит шилжүүлэг хийхгүй.</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={processing}
                  className="mt-6 w-full rounded-xl bg-[#C9A84C] py-3.5 text-sm font-bold text-[#0A0A0F] transition hover:bg-[#E8C96D] disabled:opacity-60"
                >
                  {processing ? 'Төлбөр боловсруулж байна...' : `${formatPrice(course.price)} төлөх`}
                </button>
              </div>

              <aside className="h-fit rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[#111118] p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a69262]">Захиалгын мэдээлэл</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#F5F0E8]">{course.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#9f9279]">{course.description}</p>

                <div className="mt-5 space-y-2 rounded-xl border border-[rgba(245,240,232,0.1)] bg-[#0f1118] p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8e8778]">Нийт lesson</span>
                    <span className="font-semibold text-[#F5F0E8]">{course.curriculum.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8e8778]">Үнэгүй preview</span>
                    <span className="font-semibold text-[#F5F0E8]">{freeLessons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8e8778]">Төлбөртэй lesson</span>
                    <span className="font-semibold text-[#F5F0E8]">{paidLessons}</span>
                  </div>
                  <div className="mt-3 border-t border-[rgba(245,240,232,0.08)] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8778]">Нийт төлбөр</span>
                      <span className="font-display text-2xl text-[#C9A84C]">{formatPrice(course.price)}</span>
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

