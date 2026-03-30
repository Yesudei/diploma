import SectionLabel from '@/components/ui/SectionLabel';
import TeacherCard from '@/components/cards/TeacherCard';
import { teachers } from '@/lib/data';
import Link from 'next/link';

export default function Teachers() {
  return (
    <section className="py-24 px-[60px] bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-14">
          <SectionLabel center>Багш нар</SectionLabel>
          <h2 className="font-display text-[clamp(36px,4vw,56px)] font-black leading-[1.1]">
            Манай <em className="not-italic text-[#C9A84C]">мэргэжлийн</em> багш нар
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-5 mb-10">
          {teachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/teachers"
            className="inline-flex items-center gap-2 text-[#C9A84C] text-sm font-semibold hover:text-[#E8C96D] transition-colors"
          >
            Бүх багш нар →
          </Link>
        </div>
      </div>
    </section>
  );
}
