'use client';

import { useReveal } from '@/hooks/useReveal';
import Link from 'next/link';

type PathItem = {
  num: string;
  title: string;
  desc: string;
  active?: boolean;
  category?: string;
};

type LearningPathSectionProps = {
  id: string;
};

const pathItems: PathItem[] = [
  {
    num: '01',
    title: 'Хэмнэл ба groove',
    desc: 'Beat, groove, drum pattern-ийн суурь',
    active: true,
    category: 'beats',
  },
  {
    num: '02',
    title: 'Аялгуу ба harmony',
    desc: 'Scale, chord progression, voice leading-ийн үндэс',
    category: 'melody-voice',
  },
  {
    num: '03',
    title: 'Arrangement',
    desc: 'Instrumentation, layering, dynamics ашиглан бүтцээ хөгжүүлэх',
    category: 'music-production',
  },
  {
    num: '04',
    title: 'Mixing & mastering',
    desc: 'EQ, compression, reverb, loudness-ийн суурь',
    category: 'mixing-mastering',
  },
];

export default function LearningPathSection({ id }: LearningPathSectionProps) {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section
      id={id}
      ref={ref}
      className={`snap-section ${isVisible ? 'reveal-visible' : 'reveal'} relative`}
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-[1fr_0.92fr]">
        <div className="pt-2">
          <p className="studio-kicker">Хөтөлбөр</p>
          <h2
            className="mt-3 leading-[0.95] text-[var(--text)]"
            style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(64px,7vw,108px)' }}
          >
            Суралцах
            <span className="block">замнал</span>
          </h2>

          <div className="mt-12 overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[rgba(9,10,13,0.42)]">
            {pathItems.map((item) => (
              <Link
                key={item.num}
                href={item.category ? `/courses?category=${item.category}` : '/courses'}
                className="group grid grid-cols-[42px_1fr_auto] items-center gap-5 border-b border-[rgba(245,240,232,0.07)] px-5 py-6 transition-colors last:border-b-0 hover:bg-[rgba(201,169,78,0.055)]"
              >
                <p
                  className="text-[var(--text-dim)]"
                  style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px' }}
                >
                  {item.num}
                </p>

                <div>
                  <p
                    className="text-[30px] leading-none text-[var(--text)] transition-colors group-hover:text-[var(--gold-light)]"
                    style={{ fontFamily: 'var(--font-bebas)' }}
                  >
                    {item.title}
                  </p>
                  <p className="mt-2 text-[15px] text-[var(--text-muted)]">{item.desc}</p>
                </div>

                {item.active ? (
                  <span
                    className="inline-flex items-center rounded-full border border-[var(--gold)] px-3 py-1 uppercase text-[var(--gold)]"
                    style={{ fontSize: '11px', letterSpacing: '0.12em' }}
                  >
                    Идэвхтэй
                  </span>
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-[rgba(201,169,78,0.2)] text-[var(--gold)] opacity-0 transition-opacity group-hover:opacity-100">
                    →
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="studio-panel relative rounded-[32px] p-7 sm:p-9">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="studio-kicker">Studio route</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Сурах дараалал track шиг уншигдана</p>
            </div>
            <span className="studio-chip rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.12em]">
              live path
            </span>
          </div>

          <div className="space-y-4">
            {pathItems.map((item, index) => (
              <div
                key={item.num}
                className="grid grid-cols-[36px_1fr_auto] items-center gap-4 rounded-2xl border border-[rgba(245,240,232,0.075)] bg-[rgba(8,9,12,0.42)] p-3"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[rgba(201,169,78,0.12)] text-xs font-bold text-[var(--gold-light)]">
                  {item.num}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                  <div className="studio-meter mt-2">
                    <span style={{ width: `${36 + index * 17}%` }} />
                  </div>
                </div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {index === 0 ? 'start' : 'next'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.03)] p-5">
              <p
                className="leading-none text-[var(--gold)]"
                style={{ fontFamily: 'var(--font-bebas)', fontSize: '76px' }}
              >
                148+
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">модуль</p>
            </div>
            <div className="rounded-3xl border border-[rgba(245,240,232,0.08)] bg-[rgba(245,240,232,0.03)] p-5">
              <div className="studio-wave-bars h-[76px]" aria-hidden>
                {[42, 26, 58, 35, 68, 49, 30, 62, 38, 54, 24, 46].map((height, index) => (
                  <span key={index} style={{ height }} />
                ))}
              </div>
              <p className="mt-3 text-sm text-[var(--text-muted)]">beat → mix workflow</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
