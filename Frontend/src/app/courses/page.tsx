'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { courses } from '@/lib/data';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });
const CourseCard = dynamic(() => import('@/components/cards/CourseCard'), { ssr: false });

export default function CoursesPage() {
  const [query, setQuery] = useState('');

  const filtered = courses.filter((c) => 
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  const free = filtered.filter((c) => c.price === 0);
  const paid = filtered.filter((c) => c.price > 0);

  return (
    <>
      <Nav />
      <main className="pt-[140px] pb-20 bg-[#0A0A0F] min-h-screen">
        <div className="px-[60px] mb-14">
          <h1 className="font-display text-[clamp(38px,5vw,62px)] font-black leading-[1.09] mb-3.5">
            Хичээлүүд
          </h1>
          <p className="text-[#7A7570] text-base max-w-[480px] leading-[1.7]">
            FL Studio-ийн үнэгүй болон төлбөртэй хичээлүүд.
          </p>
        </div>

        <div className="px-[60px] mb-9">
          <input
            type="text"
            placeholder="Хичээл хайх..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-[#111118] border border-[rgba(245,240,232,0.07)] text-[#F5F0E8] placeholder-[#7A7570] text-sm px-4 py-2 rounded-lg outline-none w-[300px] focus:border-[rgba(201,168,76,0.30)]"
          />
        </div>

        {free.length > 0 && (
          <section className="px-[60px] mb-14">
            <h2 className="font-display text-[22px] font-bold mb-7">Үнэгүй</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {free.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        )}

        {paid.length > 0 && (
          <section className="px-[60px]">
            <h2 className="font-display text-[22px] font-bold mb-7">Төлбөртэй</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
