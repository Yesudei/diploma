import Link from 'next/link';
import { Course } from '@/lib/types';
import { teachers } from '@/lib/data';

const thumbColors: Record<string, string> = {
  'music-production': 'from-[#1a1208] to-[#0f0d06]',
  'mixing-mastering': 'from-[#1a0d10] to-[#100a0c]',
  'sound-design': 'from-[#100a1a] to-[#0a0810]',
  'melody-voice': 'from-[#0d1520] to-[#080c14]',
  'audio-engineering': 'from-[#132018] to-[#0a120d]',
};

const categoryLabel: Record<string, string> = {
  'music-production': 'Production',
  'mixing-mastering': 'Mix / Master',
  'sound-design': 'Sound Design',
  'melody-voice': 'Melody',
  'audio-engineering': 'Audio Engineering',
};

const levelLabel: Record<string, string> = {
  beginner: 'Анхан шат',
  intermediate: 'Дунд шат',
  advanced: 'Ахисан',
};

export default function CourseCard({ course }: { course: Course }) {
  const teacher = teachers.find((t) => t.id === course.teacherId);
  const totalLessons = course.curriculum?.length || course.lessonsCount;
  const totalMinutes =
    course.curriculum?.reduce((sum, lesson) => sum + lesson.durationMinutes, 0) || 0;
  const freeLessons = course.curriculum?.filter((lesson) => lesson.free).length || 0;
  const freeRatio = totalLessons > 0 ? (freeLessons / totalLessons) * 100 : 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="studio-card group block overflow-hidden rounded-[24px]"
    >
      <div
        className={`relative aspect-video flex items-center justify-center bg-gradient-to-br ${
          thumbColors[course.category] || 'from-[#1a1208] to-[#0f0d06]'
        }`}
      >
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(245,240,232,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(245,240,232,0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="studio-wave-bars h-24" aria-hidden>
          {[28, 54, 34, 76, 44, 62, 24, 70, 38, 58, 32, 48, 22, 64].map((height, index) => (
            <span key={index} style={{ height, width: 5 }} />
          ))}
        </div>
        <span className="absolute bottom-4 left-4 font-display text-5xl font-black uppercase tracking-[0.02em] text-[rgba(245,240,232,0.16)]">
          {categoryLabel[course.category]?.slice(0, 4) || course.category.slice(0, 4)}
        </span>
        <span className="absolute left-3 top-3 rounded-full border border-[rgba(201,168,76,0.24)] bg-[rgba(10,10,15,0.78)] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#C9A84C] backdrop-blur-sm">
          {levelLabel[course.level]}
        </span>
        {course.price === 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-[#C9A84C] px-3 py-1 text-[10px] font-bold text-[#0A0A0F]">
            Үнэгүй
          </span>
        )}
      </div>

      <div className="p-5 pb-6">
        <div className="studio-kicker mb-2">
          {categoryLabel[course.category] || course.category}
        </div>
        <h3 className="mb-2 font-display text-[17px] font-bold leading-snug transition-colors group-hover:text-[#E8C96D]">
          {course.title}
        </h3>
        <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-[#7A7570]">
          {course.description}
        </p>

        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="rounded-xl border border-[rgba(245,240,232,0.07)] bg-[rgba(245,240,232,0.035)] p-2.5">
            <p className="font-semibold text-[#F5F0E8]">{totalLessons}</p>
            <p className="text-[#7A7570]">Хичээл</p>
          </div>
          <div className="rounded-xl border border-[rgba(245,240,232,0.07)] bg-[rgba(245,240,232,0.035)] p-2.5">
            <p className="font-semibold text-[#F5F0E8]">{Math.round(totalMinutes / 60)}ц</p>
            <p className="text-[#7A7570]">Нийт хугацаа</p>
          </div>
          <div className="rounded-xl border border-[rgba(245,240,232,0.07)] bg-[rgba(245,240,232,0.035)] p-2.5">
            <p className="font-semibold text-[#F5F0E8]">{freeLessons}</p>
            <p className="text-[#7A7570]">Үнэгүй</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[#8f8779]">
            <span>Үнэгүй хичээл</span>
            <span>
              {freeLessons}/{totalLessons}
            </span>
          </div>
          <div className="studio-meter">
            <span style={{ width: `${Math.max(8, freeRatio)}%` }} />
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-3 border-t border-[rgba(245,240,232,0.05)] pt-3 text-[11.5px] text-[#7A7570]">
          <span>{course.duration}</span>
          {teacher && <span>{teacher.name}</span>}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`font-bold text-[#C9A84C] ${
              course.price === 0 ? 'font-sans text-sm text-[#7A7570]' : 'font-display text-[19px]'
            }`}
          >
            {course.price === 0 ? 'Үнэгүй' : `₮${course.price.toLocaleString()}`}
          </span>
          <button className="studio-ghost-button rounded-full px-3.5 py-1.5 text-xs font-bold">
            {course.price === 0 ? 'Судлах →' : 'Худалдаж авах →'}
          </button>
        </div>
      </div>
    </Link>
  );
}
