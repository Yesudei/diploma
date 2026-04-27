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
    title: 'Товч модуль',
    desc: 'Нэг модуль бүр нэг чадварт төвлөрнө. Илүү цэгцтэй, илүү ойлгомжтой аргаар сурна.',
    link: '/courses',
  },
  {
    num: '02',
    tag: 'Одоогийн сан',
    title: 'Суурь хөтөлбөр',
    desc: 'Rhythm, melody, harmony, arrangement, mix гэсэн гол сууриуд нэг урсгалд орсон.',
    link: '/courses',
  },
  {
    num: '03',
    tag: 'Ментор дэмжлэг',
    title: 'Дараагийн шат',
    desc: 'Цаашдаа менторын feedback, илүү баялаг lesson media, ахицын систем нэмэгдэнэ.',
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
            Чиний хөгжмийн
            <span className="block text-[var(--gold)]">замналыг тодорхойл</span>
          </h2>
          <p className="max-w-[360px] text-[14px] font-light leading-7 text-[var(--text-muted)]">
            Юу санал болгох вэ
          </p>
        </div>

        <div
          className="grid overflow-hidden"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: 'var(--border-gold)',
          }}
        >
          {cards.map((card) => (
            <Link
              key={card.num}
              href={card.link || '#'}
              className={`feature-card ${card.link ? 'cursor-pointer transition-colors hover:bg-[rgba(26,24,19,0.8)]' : ''}`}
              style={{ background: 'var(--bg-card)', padding: '48px 40px' }}
            >
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
              <p
                className="mt-5 uppercase text-[var(--gold)]"
                style={{ fontSize: '10px', letterSpacing: '0.18em' }}
              >
                {card.tag}
              </p>
              <h3
                className="mt-3 uppercase text-[var(--text)]"
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
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
