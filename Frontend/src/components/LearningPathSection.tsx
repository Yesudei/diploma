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
    title: 'Хэмнэл ба Ритм',
    desc: 'Beat, groove, polyrhythm — үндэс суурь',
    active: true,
    category: 'beats',
  },
  {
    num: '02',
    title: 'Мелоди ба Хармони',
    desc: 'Scale, chord progression, voice leading',
    category: 'melody-voice',
  },
  {
    num: '03',
    title: 'Аранжировк',
    desc: 'Instrumentation, layering, dynamics',
    category: 'music-production',
  },
  {
    num: '04',
    title: 'Миксинг & Мастеринг',
    desc: 'EQ, compression, spatial processing',
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
          <p
            className="uppercase text-[var(--gold)]"
            style={{ fontSize: '11px', letterSpacing: '0.18em' }}
          >
            Хөтөлбөр
          </p>
          <h2
            className="mt-3 leading-[0.95] text-[var(--text)]"
            style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(64px,7vw,108px)' }}
          >
            Суралцах
            <span className="block">замнал</span>
          </h2>

          <div className="mt-12 border-t border-[var(--border-gold)]">
            {pathItems.map((item) => (
              <Link
                key={item.num}
                href={item.category ? `/courses?category=${item.category}` : '/courses'}
                className="group grid grid-cols-[42px_1fr_auto] items-center gap-5 border-b border-[var(--border-gold)] py-6 transition-colors hover:bg-[rgba(201,169,78,0.04)]"
              >
                <p
                  className="text-[var(--text-dim)]"
                  style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px' }}
                >
                  {item.num}
                </p>

                <div>
                  <p
                    className="text-[30px] leading-none text-[var(--text)]"
                    style={{ fontFamily: 'var(--font-bebas)' }}
                  >
                    {item.title}
                  </p>
                  <p className="mt-2 text-[15px] text-[var(--text-muted)]">{item.desc}</p>
                </div>

                {item.active ? (
                  <span
                    className="inline-flex items-center border border-[var(--gold)] px-3 py-1 uppercase text-[var(--gold)]"
                    style={{ fontSize: '11px', letterSpacing: '0.12em' }}
                  >
                    Идэвхтэй
                  </span>
                ) : (
                  <span className="text-[var(--gold)] opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative border border-[var(--border-gold)] bg-[linear-gradient(180deg,rgba(26,24,19,0.55),rgba(20,20,18,0.62))] p-9">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_14%,rgba(201,169,78,0.12),transparent_52%)]" />

          <div className="relative flex h-full flex-col justify-between">
            <div className="mx-auto mt-6 h-[62%] w-[80%] border border-[rgba(201,169,78,0.06)] opacity-50" />

            <div>
              <p
                className="leading-none text-[var(--gold)]"
                style={{ fontFamily: 'var(--font-bebas)', fontSize: '76px' }}
              >
                148+
              </p>
              <p className="mt-2 text-[15px] text-[var(--text-muted)]">модуль хичээл</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
