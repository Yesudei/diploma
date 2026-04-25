'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Nav from '@/components/layout/Nav';
import { Waves } from '@/components/ui/Waves';
import { courses } from '@/lib/data';

const highlights = [
  {
    tag: 'Онцлох хичээл',
    title: 'Товч модуль',
    desc: 'Нэг модуль бүр нэг чадварт төвлөрнө. Илүү цэгцтэй, илүү ойлгомжтой.',
  },
  {
    tag: 'Одоогийн сан',
    title: 'Суурь хөтөлбөр',
    desc: 'Rhythm, melody, harmony, arrangement, mix гэсэн гол сууриуд нэг урсгалд орсон.',
  },
  {
    tag: 'Ментор дэмжлэг',
    title: 'Дараагийн шат',
    desc: 'Цаашдаа менторын feedback, илүү баялаг lesson media, ахицын систем нэмэгдэнэ.',
  },
];

const pathBlocks = [
  {
    id: '01',
    name: 'Rhythm',
    detail: 'Pulse, groove, tempo, bar мэдрэмжээ тогтвортой болгоно.',
  },
  {
    id: '02',
    name: 'Pitch',
    detail: 'Melody, chord, bassline-аар hook болон harmonic мэдрэмжээ өсгөнө.',
  },
  {
    id: '03',
    name: 'Form',
    detail: 'Arrangement, transition, mix clarity-аар idea-гаа бүтэн урсгал болгоно.',
  },
];

export default function HomePage() {
  useEffect(() => {
    document.body.classList.add('landing-snap-enabled');
    return () => {
      document.body.classList.remove('landing-snap-enabled');
    };
  }, []);

  const totalLessons = courses.reduce((sum, course) => sum + course.curriculum.length, 0);
  const totalHours = courses.reduce(
    (sum, course) =>
      sum + course.curriculum.reduce((lessonSum, lesson) => lessonSum + lesson.durationMinutes, 0),
    0
  );

  return (
    <>
      <Nav />
      <main id="landing-scroll-container" className="landing-scroll-container">
        <section className="landing-snap-section relative px-6 pb-8 pt-28 sm:px-10 lg:px-16">
          <Waves
            className="pointer-events-none opacity-65"
            strokeColor="#D9C38A"
            backgroundColor="#090A0D"
            pointerSize={0.6}
            quality="balanced"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(201,168,76,0.28),transparent_36%),radial-gradient(circle_at_80%_70%,rgba(145,95,35,0.22),transparent_32%)]" />

          <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-between">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="mb-6 inline-flex items-center rounded-full border border-[rgba(217,195,138,0.35)] bg-[rgba(13,15,20,0.65)] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f0deac]">
                  Melodex Foundations
                </p>
                <h1 className="font-display text-[clamp(42px,9vw,118px)] font-black leading-[0.94] text-[#f7f2e6]">
                  Анхны трэкээ
                  <span className="block text-[#d9c38a]">зөв сууриас</span>
                  эхлүүл
                </h1>
                <p className="mt-6 max-w-[560px] text-base leading-8 text-[#d0c6ab] sm:text-lg">
                  Сууриа цэгцтэй тавихад хэрэгтэй rhythm, melody, harmony, arrangement, mix-ийн
                  үндсийг богино, ойлгомжтой модулиар сур.
                </p>
              </div>

              <div className="self-end rounded-[30px] border border-[rgba(217,195,138,0.32)] bg-[rgba(11,12,16,0.75)] p-7 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9e8d63]">
                  Одоо сурах боломжтой
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[rgba(245,240,232,0.03)] p-4">
                    <p className="font-display text-3xl font-bold text-[#f7f2e6]">
                      {courses.length}
                    </p>
                    <p className="mt-1 text-xs text-[#9e8d63]">Курс</p>
                  </div>
                  <div className="rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[rgba(245,240,232,0.03)] p-4">
                    <p className="font-display text-3xl font-bold text-[#f7f2e6]">{totalLessons}</p>
                    <p className="mt-1 text-xs text-[#9e8d63]">Lesson</p>
                  </div>
                  <div className="rounded-2xl border border-[rgba(245,240,232,0.1)] bg-[rgba(245,240,232,0.03)] p-4">
                    <p className="font-display text-3xl font-bold text-[#f7f2e6]">
                      {(totalHours / 60).toFixed(1)}ц
                    </p>
                    <p className="mt-1 text-xs text-[#9e8d63]">Estimate</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-xl bg-[#d9c38a] px-9 py-4 text-base font-bold text-[#0a0a0f] transition hover:-translate-y-0.5 hover:bg-[#ebd7a4]"
              >
                Үнэгүйгээр эхлэх
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl border border-[rgba(245,240,232,0.3)] bg-[rgba(245,240,232,0.03)] px-9 py-4 text-base font-semibold text-[#f7f2e6] transition hover:bg-[rgba(245,240,232,0.12)]"
              >
                Бүртгүүлэх
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-snap-section bg-[#0f1117] px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-center">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <h2 className="font-display text-[clamp(34px,6vw,84px)] font-black leading-[0.98] text-[#f8f6ef]">
                Хүлээх биш
                <span className="block text-[#d9c38a]">бүтээж эхлэх</span>
              </h2>
              <p className="max-w-[420px] text-sm leading-7 text-[#a9a28f] sm:text-base">
                Хэсэг хэсэг зөвлөгөө цуглуулахын оронд, нэг цэгцтэй урсгалаар урагшил.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {highlights.map((item) => (
                <article
                  key={item.tag}
                  className="group rounded-[26px] border border-[rgba(217,195,138,0.28)] bg-[linear-gradient(180deg,rgba(18,20,28,0.9),rgba(10,11,15,0.9))] p-7 transition hover:-translate-y-1 hover:border-[rgba(217,195,138,0.62)]"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8f7d56]">
                    {item.tag}
                  </p>
                  <h3 className="mt-4 font-display text-3xl font-bold text-[#f8f6ef]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#b4aa92]">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-snap-section bg-[#0a0a0f] px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto grid w-full max-w-[1320px] flex-1 gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[30px] border border-[rgba(217,195,138,0.25)] bg-[radial-gradient(circle_at_top,rgba(217,195,138,0.12),rgba(13,13,17,0.95)_62%)] p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9e8d63]">Сургалтын замнал</p>
              <h2 className="mt-4 font-display text-[clamp(30px,4.5vw,66px)] font-black leading-[1.02] text-[#f7f2e6]">
                Фокусласан зам
                <span className="block text-[#d9c38a]">бүх продюсерт</span>
              </h2>
              <p className="mt-6 max-w-[480px] text-sm leading-7 text-[#bbb29b] sm:text-base">
                Энд тойруу, замбараагүй зөвлөгөө байхгүй. Модуль бүр нэг тодорхой чадварыг ахиулна.
              </p>
            </div>

            <div className="grid gap-4">
              {pathBlocks.map((block) => (
                <article
                  key={block.id}
                  className="flex flex-col justify-between rounded-[24px] border border-[rgba(245,240,232,0.12)] bg-[#11131a] p-6 sm:flex-row sm:items-end sm:gap-6"
                >
                  <div className="font-display text-4xl font-black text-[#d9c38a]">{block.id}</div>
                  <div className="max-w-[520px]">
                    <h3 className="font-display text-3xl font-bold text-[#f7f2e6]">{block.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#b9af97]">{block.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-snap-section relative bg-[#0e1015] px-6 py-14 sm:px-10 lg:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(217,195,138,0.24),transparent_34%)]" />
          <div className="relative mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-center">
            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9e8d63]">Төлөвлөгөө</p>
              <h2 className="mt-4 font-display text-[clamp(34px,5vw,72px)] font-black leading-[1] text-[#f7f2e6]">
                Өөрийн
                <span className="block text-[#d9c38a]">продакшны цаг</span>
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-[28px] border border-[rgba(245,240,232,0.12)] bg-[#11131a] p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#9e8d63]">Starter</p>
                <p className="mt-4 font-display text-6xl font-black text-[#f7f2e6]">Үнэгүй</p>
                <p className="mt-3 text-sm text-[#b9af97]">
                  Сууриа тавьж, self-check тестээр ойлголтоо баталгаажуул.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-[#ddd3b8]">
                  <li>Бүх суурь курс одоогоор үнэгүй</li>
                  <li>Товч, цэгцтэй lesson card</li>
                  <li>Self-check тестийн урсгал</li>
                </ul>
                <Link
                  href="/courses"
                  className="mt-8 inline-flex rounded-xl border border-[rgba(245,240,232,0.25)] px-6 py-3 text-sm font-semibold text-[#f7f2e6] transition hover:bg-[rgba(245,240,232,0.09)]"
                >
                  Үнэгүй судлах
                </Link>
              </article>

              <article className="rounded-[28px] border border-[rgba(217,195,138,0.58)] bg-[linear-gradient(180deg,rgba(217,195,138,0.15),rgba(16,17,23,0.9))] p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#f0deac]">Next</p>
                <p className="mt-4 font-display text-6xl font-black text-[#f7f2e6]">Soon</p>
                <p className="mt-3 text-sm text-[#d3c8ad]">
                  Дараагийн шатанд илүү баялаг курс, менторын feedback, project files нэмэгдэнэ.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-[#f0e7cf]">
                  <li>Илүү гүнзгий Melodex curriculum</li>
                  <li>Менторын layer ба feedback</li>
                  <li>Илүү хүчтэй progress tracking</li>
                </ul>
                <Link
                  href="/courses"
                  className="mt-8 inline-flex rounded-xl bg-[#d9c38a] px-6 py-3 text-sm font-bold text-[#0a0a0f] transition hover:bg-[#ebd7a4]"
                >
                  Одоогийн санг үзэх
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-snap-section relative px-6 py-14 sm:px-10 lg:px-16">
          <Waves
            className="pointer-events-none opacity-45"
            strokeColor="#e7d7ad"
            backgroundColor="#08090d"
            pointerSize={0.45}
            quality="lite"
          />
          <div className="relative mx-auto flex w-full max-w-[1320px] flex-1 flex-col items-start justify-center rounded-[32px] border border-[rgba(245,240,232,0.18)] bg-[rgba(7,8,12,0.55)] p-8 sm:p-12">
            <p className="text-xs uppercase tracking-[0.2em] text-[#a49368]">Эцсийн</p>
            <h2 className="mt-4 font-display text-[clamp(34px,6vw,88px)] font-black leading-[0.95] text-[#f8f4e8]">
              Анхны дуугаа
              <span className="block text-[#d9c38a]">гаргахын тулд</span>
            </h2>
            <p className="mt-5 max-w-[620px] text-base leading-8 text-[#cbbf9f]">
              Tutorial цуглуулахаа зогсоож, өнөөдрөөс бүтээж эхэл. Өдөр бүр зөв замаар дуугаа
              хөгжүүл.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-[#d9c38a] px-8 py-4 text-base font-bold text-[#0a0a0f] transition hover:-translate-y-0.5 hover:bg-[#ebd7a4]"
              >
                Melodex-т нэгдэх
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-xl border border-[rgba(245,240,232,0.28)] px-8 py-4 text-base font-semibold text-[#f8f4e8] transition hover:bg-[rgba(245,240,232,0.1)]"
              >
                Хөтөлбөр үзэх
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
