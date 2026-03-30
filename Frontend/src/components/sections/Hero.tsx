'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.55,
    delay,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
});

const WAVE_HEIGHTS = [
  20, 45, 80, 60, 90, 40, 70, 50, 100, 55, 75, 30, 85, 65, 45, 95, 35, 70, 55, 80, 25, 60, 90, 40,
  75, 50, 100, 65, 30, 85, 20, 55, 70, 45, 80, 35, 60, 48, 72, 88,
];

function StaffLines() {
  return (
    <svg
      className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none"
      width="320"
      height="400"
      viewBox="0 0 320 400"
      fill="none"
    >
      {[0, 20, 40, 60, 80].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#C9A84C" strokeWidth="1.2" />
      ))}
      {[0, 20, 40, 60, 80].map((offset) =>
        [40, 120, 200, 280].map((x) => (
          <line
            key={`${x}-${offset}`}
            x1={x}
            y1={offset}
            x2={x}
            y2={offset + 80}
            stroke="#C9A84C"
            strokeWidth="1.2"
          />
        ))
      )}
      <ellipse cx="60" cy="40" rx="18" ry="12" stroke="#C9A84C" strokeWidth="1.5" />
      <ellipse cx="160" cy="60" rx="18" ry="12" stroke="#C9A84C" strokeWidth="1.5" />
      <ellipse cx="260" cy="40" rx="18" ry="12" stroke="#C9A84C" strokeWidth="1.5" />
      <line x1="0" y1="80" x2="320" y2="80" stroke="#C9A84C" strokeWidth="1.2" />
      {[0, 100, 200, 300].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#C9A84C" strokeWidth="0.6" />
      ))}
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center px-[60px] relative overflow-hidden bg-bg">
      <div className="absolute w-[700px] h-[700px] rounded-full -top-48 -right-24 bg-[radial-gradient(ellipse,rgba(201,168,76,0.12),transparent_70%)] blur-[60px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bottom-0 left-48 bg-[radial-gradient(ellipse,rgba(120,80,200,0.08),transparent_70%)] blur-[60px] pointer-events-none" />

      <StaffLines />

      <div className="relative z-10 max-w-[680px] pt-10">
        <motion.div
          {...fadeUp(0)}
          className="inline-flex items-center gap-2 bg-[rgba(201,168,76,0.13)] border border-[rgba(201,168,76,0.30)] text-[#C9A84C] text-[11px] font-bold uppercase tracking-[0.12em] px-4 py-1.5 rounded-full mb-8"
        >
          <span className="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-pulse" />
          МОНГОЛЫН АНХНЫ FL STUDIO ПЛАТФОРМ
        </motion.div>

        <motion.h1
          {...fadeUp(0.08)}
          className="font-display text-[clamp(52px,6vw,86px)] font-black leading-[1.06] tracking-tight mb-6"
        >
          FL Studio-р
          <br />
          хөгжим
          <br />
          <em
            className="not-italic text-[#C9A84C] font-display font-black"
            style={{ fontStyle: 'italic' }}
          >
            бүтээхийг
          </em>{' '}
          сур
        </motion.h1>

        <motion.p
          {...fadeUp(0.16)}
          className="text-[#7A7570] text-lg leading-[1.75] mb-12 max-w-[500px]"
        >
          Мэргэжлийн продюсеруудаас Beat Making, Mixing, Mastering зэрэг FL Studio-н бүх нууцыг сур.
          Гэрээсээ, хүссэн цагтаа.
        </motion.p>

        <motion.div {...fadeUp(0.24)} className="flex gap-4 flex-wrap">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center bg-[#C9A84C] text-[#0A0A0F] font-bold text-base px-10 py-[17px] rounded-xl transition-all hover:bg-[#E8C96D] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(201,168,76,0.28)]"
          >
            Үнэгүй эхлэх
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center bg-transparent border border-[rgba(245,240,232,0.20)] text-[#F5F0E8] font-semibold text-base px-10 py-[17px] rounded-xl transition-all hover:bg-[rgba(245,240,232,0.05)] hover:border-[rgba(245,240,232,0.40)]"
          >
            Хичээлүүд үзэх →
          </Link>
        </motion.div>
      </div>

      <motion.div
        {...fadeUp(0.1)}
        className="absolute right-[60px] top-1/2 -translate-y-1/2 w-[460px] bg-[#111118] border border-[rgba(201,168,76,0.15)] rounded-[24px] p-9 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center gap-3.5 bg-[rgba(201,168,76,0.08)] border border-[rgba(201,168,76,0.15)] rounded-xl p-3.5 mb-6">
          <div className="w-10 h-10 bg-[#C9A84C] rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7V3.5l8 3.5-8 3.5V7z" fill="#0A0A0F" />
            </svg>
          </div>
          <div>
            <p className="text-[#7A7570] text-[11.5px] mb-0.5">Одоо тоглож байна</p>
            <p className="text-[#F5F0E8] text-sm font-semibold">Beat Making — 2-р хичээл</p>
          </div>
        </div>

        <div className="flex items-center gap-[3px] h-[60px] mb-6">
          {WAVE_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="w-1 bg-[#C9A84C] rounded-sm opacity-80"
              style={{
                height: `${h}%`,
                animation: `wave 1.2s ease-in-out ${(i * 0.048).toFixed(3)}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="flex pt-5 border-t border-[rgba(245,240,232,0.06)]">
          {[
            { n: '500+', l: 'Сурагчид' },
            { n: '48', l: 'Хичээлүүд' },
            { n: '3', l: 'Мэргэжлийн багш' },
          ].map(({ n, l }) => (
            <div
              key={l}
              className="flex-1 text-center border-l border-[rgba(245,240,232,0.06)] first:border-l-0"
            >
              <div className="font-display text-[#C9A84C] text-[28px] font-bold leading-none">
                {n}
              </div>
              <div className="text-[#7A7570] text-xs mt-1">{l}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
