import Link from 'next/link';
import { Waves } from '@/components/ui/Waves';

type HeroSectionProps = {
  id: string;
};

export default function HeroSection({ id }: HeroSectionProps) {
  return (
    <section
      id={id}
      className="snap-section relative flex items-center overflow-hidden px-8 pt-24 sm:px-14 lg:px-20"
    >
      <Waves
        className="pointer-events-none opacity-65"
        strokeColor="#D9C38A"
        backgroundColor="#090A0D"
        pointerSize={0.6}
        quality="balanced"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(201,168,76,0.24),transparent_36%),radial-gradient(circle_at_80%_70%,rgba(145,95,35,0.16),transparent_32%)]" />

      <div className="relative z-20 mx-auto flex w-full max-w-[1280px] items-end justify-between gap-10 pb-14">
        <div className="max-w-[780px]">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-px w-10 bg-[var(--gold)]" />
            <span
              className="uppercase text-[var(--gold)]"
              style={{ fontSize: '11px', letterSpacing: '0.2em' }}
            >
              Melodex сургалт
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: 'clamp(72px, 10vw, 140px)',
              lineHeight: 0.92,
              letterSpacing: '0.02em',
            }}
          >
            <span className="block text-[var(--text)]">Сур.</span>
            <span
              className="block text-transparent"
              style={{ WebkitTextStroke: '1.5px var(--gold)' }}
            >
              Бүтээ.
            </span>
            <span className="block text-[var(--gold)]">Дуусга.</span>
          </h1>

          <p
            className="mt-7 max-w-[360px] text-[var(--text-muted)]"
            style={{ fontSize: '15px', fontWeight: 300, lineHeight: 1.7 }}
          >
            Rhythm, melody, arrangement, mixing-ийг дараалалтай сурч, санаагаа бодит track болгон
            хөгжүүл.
          </p>

          <div className="mt-10 flex flex-wrap items-end gap-7">
            <Link
              href="/courses"
              className="inline-flex items-center justify-center px-8 py-3.5 uppercase"
              style={{
                borderRadius: 0,
                background: 'var(--gold)',
                color: '#0c0c0b',
                fontSize: '13px',
                letterSpacing: '0.08em',
              }}
            >
              Хичээл эхлэх
            </Link>
            <Link
              href="#features"
              className="border-b border-[var(--text-dim)] pb-1 text-[13px] uppercase text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)]"
              style={{ letterSpacing: '0.08em' }}
            >
              Модулиуд үзэх
            </Link>
          </div>
        </div>

        <div className="hidden items-end gap-3 lg:flex">
          <span className="h-14 w-px bg-[var(--gold)]" />
          <span
            className="uppercase text-[var(--text-muted)]"
            style={{ fontSize: '11px', letterSpacing: '0.12em' }}
          >
            Доош гүйлгэх
          </span>
        </div>
      </div>
    </section>
  );
}
