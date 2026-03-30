import Link from 'next/link';
import { Course } from '@/lib/types';
import { teachers } from '@/lib/data';

const thumbColors: Record<string, string> = {
  basics: 'from-[#1a1208] to-[#0f0d06]',
  beats: 'from-[#0d1520] to-[#080c14]',
  mixing: 'from-[#1a0d10] to-[#100a0c]',
  'sound-design': 'from-[#100a1a] to-[#0a0810]',
  mastering: 'from-[#1a1208] to-[#0d0d06]',
};

const thumbEmoji: Record<string, string> = {
  basics: '🎛️',
  beats: '🥁',
  mixing: '🎚️',
  'sound-design': '🎹',
  mastering: '🏆',
};

const levelLabel: Record<string, string> = {
  beginner: 'Анхан шат',
  intermediate: 'Дунд',
  advanced: 'Ахисан',
};

export default function CourseCard({ course }: { course: Course }) {
  const teacher = teachers.find((t) => t.id === course.teacherId);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-[17px] overflow-hidden hover:-translate-y-1.5 hover:border-[rgba(201,168,76,0.20)] hover:shadow-[0_20px_56px_rgba(0,0,0,0.5)] transition-all duration-300"
    >
      <div
        className={`aspect-video flex items-center justify-center text-5xl relative bg-gradient-to-br ${thumbColors[course.category]}`}
      >
        <span>{thumbEmoji[course.category]}</span>
        <span className="absolute top-2.5 left-2.5 bg-[rgba(10,10,15,0.85)] backdrop-blur-sm border border-[rgba(201,168,76,0.20)] text-[#C9A84C] text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
          {levelLabel[course.level]}
        </span>
        {course.price === 0 && (
          <span className="absolute top-2.5 right-2.5 bg-[#C9A84C] text-[#0A0A0F] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Үнэгүй
          </span>
        )}
      </div>

      <div className="p-5 pb-6">
        <div className="text-[10.5px] font-bold uppercase tracking-widest text-[#C9A84C] mb-1.5">
          {course.category}
        </div>
        <h3 className="font-display text-[17px] font-bold leading-snug mb-2 group-hover:text-[#E8C96D] transition-colors">
          {course.title}
        </h3>
        <p className="text-[#7A7570] text-[13px] leading-relaxed mb-4 line-clamp-2">
          {course.description}
        </p>

        <div className="flex gap-3 text-[11.5px] text-[#7A7570] pt-3 border-t border-[rgba(245,240,232,0.05)] mb-3">
          <span>⏱ {course.duration}</span>
          {teacher && <span>👨‍🏫 {teacher.name}</span>}
          <span>📚 {course.lessonsCount} хичээл</span>
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`font-display font-bold text-[#C9A84C] ${course.price === 0 ? 'text-[#7A7570] font-sans text-sm' : 'text-[19px]'}`}
          >
            {course.price === 0 ? 'Үнэгүй' : `₮${course.price.toLocaleString()}`}
          </span>
          <button className="bg-[rgba(201,168,76,0.13)] border border-[rgba(201,168,76,0.25)] text-[#C9A84C] text-xs font-bold px-3.5 py-1.5 rounded-lg hover:bg-[#C9A84C] hover:text-[#0A0A0F] transition-all">
            {course.price === 0 ? 'Үзэх →' : 'Авах →'}
          </button>
        </div>
      </div>
    </Link>
  );
}
