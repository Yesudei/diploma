'use client';
import { useState } from 'react';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import CourseCard from '@/components/cards/CourseCard';
import SectionLabel from '@/components/ui/SectionLabel';
import { courses } from '@/lib/data';
import { Category, Level } from '@/lib/types';

const categoryFilters: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'Бүгд' },
  { value: 'basics', label: 'Үндэс' },
  { value: 'beats', label: 'Beat Making' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'sound-design', label: 'Sound Design' },
  { value: 'mastering', label: 'Mastering' },
];

const levelFilters: { value: Level | 'all'; label: string }[] = [
  { value: 'all', label: 'Бүх түвшин' },
  { value: 'beginner', label: 'Анхан шат' },
  { value: 'intermediate', label: 'Дунд' },
  { value: 'advanced', label: 'Ахисан' },
];

export default function CoursesPage() {
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [level, setLevel] = useState<Level | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = courses.filter((c) => {
    const matchI = category === 'all' || c.category === category;
    const matchL = level === 'all' || c.level === level;
    const matchQ = c.title.toLowerCase().includes(query.toLowerCase());
    return matchI && matchL && matchQ;
  });

  const free = filtered.filter((c) => c.price === 0);
  const paid = filtered.filter((c) => c.price > 0);

  const FilterBtn = ({
    active,
    onClick,
    label,
  }: {
    active: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      onClick={onClick}
      className={`text-sm px-[17px] py-2 rounded-full border transition-all ${active ? 'bg-[rgba(201,168,76,0.13)] border-[rgba(201,168,76,0.40)] text-[#C9A84C]' : 'bg-[#111118] border-[rgba(245,240,232,0.07)] text-[#7A7570] hover:border-[rgba(201,168,76,0.30)] hover:text-[#F5F0E8]'}`}
    >
      {label}
    </button>
  );

  return (
    <>
      <Nav />
      <main className="pt-[140px] pb-20 bg-[#0A0A0F] min-h-screen">
        <div className="px-[60px] mb-14">
          <SectionLabel>Бүх хичээлүүд</SectionLabel>
          <h1 className="font-display text-[clamp(38px,5vw,62px)] font-black leading-[1.09] mb-3.5">
            Хөгжмийн <em className="not-italic text-[#C9A84C]">аялал</em>
            <br />
            энд эхэлнэ
          </h1>
          <p className="text-[#7A7570] text-base max-w-[480px] leading-[1.7]">
            Анхан шатнаас мэргэжлийн түвшин хүртэл. Өөрт тохирох хичээлээ олоорой.
          </p>
        </div>

        <div className="px-[60px] mb-9 flex items-center gap-2.5 flex-wrap">
          {categoryFilters.map((f) => (
            <FilterBtn
              key={f.value}
              active={category === f.value}
              onClick={() => setCategory(f.value as Category | 'all')}
              label={f.label}
            />
          ))}
          <div className="w-px h-5 bg-[rgba(245,240,232,0.07)]" />
          {levelFilters.slice(1).map((f) => (
            <FilterBtn
              key={f.value}
              active={level === f.value}
              onClick={() => setLevel(f.value as Level | 'all')}
              label={f.label}
            />
          ))}
          <div className="ml-auto relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A7570]"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Хичээл хайх..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-[#111118] border border-[rgba(245,240,232,0.07)] text-[#F5F0E8] placeholder-[#7A7570] text-sm pl-9 pr-4 py-2 rounded-[9px] outline-none w-[200px] focus:border-[rgba(201,168,76,0.30)] transition-colors"
            />
          </div>
        </div>

        {free.length > 0 && (
          <section className="px-[60px] mb-14">
            <div className="flex items-center gap-5 mb-7">
              <h2 className="font-display text-[22px] font-bold whitespace-nowrap">
                Үнэгүй хичээлүүд
              </h2>
              <div className="flex-1 h-px bg-[rgba(245,240,232,0.06)]" />
              <span className="text-xs text-[#7A7570] whitespace-nowrap">{free.length} хичээл</span>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {free.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}

        {paid.length > 0 && (
          <section className="px-[60px]">
            <div className="flex items-center gap-5 mb-7">
              <h2 className="font-display text-[22px] font-bold whitespace-nowrap">
                Төлбөртэй хичээлүүд
              </h2>
              <div className="flex-1 h-px bg-[rgba(245,240,232,0.06)]" />
              <span className="text-xs text-[#7A7570] whitespace-nowrap">₮5,000 / хичээл</span>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {paid.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
