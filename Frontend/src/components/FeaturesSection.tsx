'use client';

import { useReveal } from '@/hooks/useReveal';
import Link from 'next/link';

type FeatureCard = {
  num: string;
  tag: string;
  title: string;
  desc: string;
  link?: string;
};

type FeaturesSectionProps = {
  id: string;
};

const cards: FeatureCard[] = [
  {
    num: '01',
    tag: 'Онцлох хичээл',
    title: 'Богино модуль',
    desc: 'Модуль бүр нэг чадварт төвлөрнө. Ингэснээр ойлгомжтой, дараалалтай сурна.',
    link: '/courses',
  },
  {
    num: '02',
    tag: 'Сургалтын сан',
    title: 'Суурь хөтөлбөр',
    desc: 'Rhythm, melody, harmony, arrangement, mixing зэрэг суурь чадварууд нэг замналд багтсан.',
    link: '/courses',
  },
  {
    num: '03',
    tag: 'Менторын дэмжлэг',
    title: 'Дараагийн шат',
    desc: 'Цаашдаа менторын санал, баялаг хичээлийн материал, ахиц хянах систем нэмэгдэнэ.',
  },
];

export default function FeaturesSection({ id }: FeaturesSectionProps) {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <section
      id={id}
      ref={ref}
      className={`snap-section ${isVisible ? 'reveal-visible' : 'reveal'}`}
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2
            className="uppercase text-[var(--text)]"
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(48px,6vw,92px)',
              letterSpacing: '0.04em',
              lineHeight: 0.95,
            }}
          >
            Сурах
            <span className="block text-[var(--gold)]">замналаа тодорхойл</span>
          </h2>
          <p className="max-w-[400px] text-[14px] font-light leading-7 text-[var(--text-muted)]">
            Хичээлүүдийг богино, сонсож туршихад амар хэсгүүдээр зохион байгуулсан.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.num}
              href={card.link || '#'}
              className={`studio-card feature-card group rounded-[28px] p-8 sm:p-10 ${card.link ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between gap-5">
                <p
                  className="leading-none text-[var(--text-dim)]"
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: '80px',
                    fontWeight: 300,
                  }}
                >
                  {card.num}
                </p>
                <div className="studio-wave-bars mt-2 h-12" aria-hidden>
                  {[22, 38, 18, 46, 28, 34].map((height, index) => (
                    <span key={index} style={{ height, width: 3 }} />
                  ))}
                </div>
              </div>
              <p className="studio-kicker mt-6">{card.tag}</p>
              <h3
                className="mt-3 uppercase text-[var(--text)] transition-colors group-hover:text-[var(--gold-light)]"
                style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize: '32px',
                  letterSpacing: '0.04em',
                }}
              >
                {card.title}
              </h3>
              <p
                className="mt-3 text-[var(--text-muted)]"
                style={{ fontSize: '14px', fontWeight: 300, lineHeight: 1.7 }}
              >
                {card.desc}
              </p>
              <div className="mt-8 flex items-center justify-between border-t border-[rgba(245,240,232,0.08)] pt-4">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-dim)]">
                  module
                </span>
                <span className="text-[var(--gold)]">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
