import { Teacher } from '@/lib/types';

const avatarColors: Record<string, string> = {
  bat: 'from-[#2a1f08] to-[#1a1406]',
  bold: 'from-[#081a10] to-[#061410]',
  tuyaa: 'from-[#1a0d10] to-[#140a0c]',
};

export default function TeacherCard({ teacher }: { teacher: Teacher }) {
  return (
    <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-[17px] p-7 pb-8 text-center hover:border-[rgba(201,168,76,0.20)] hover:-translate-y-1 transition-all duration-300">
      <div
        className={`w-[88px] h-[88px] rounded-full mx-auto mb-5 bg-gradient-to-br ${avatarColors[teacher.id]} flex items-center justify-center text-4xl font-display font-bold text-[rgba(201,168,76,0.80)]`}
      >
        {teacher.name[0]}
      </div>

      <h3 className="font-display text-[19px] font-bold mb-0.5">{teacher.name}</h3>
      <p className="text-[#C9A84C] text-[12px] font-semibold uppercase tracking-wide mb-4">
        {teacher.role}
      </p>
      <p className="text-[#7A7570] text-[13px] leading-relaxed mb-5 line-clamp-3">{teacher.bio}</p>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {teacher.instruments.map((inst) => (
          <span
            key={inst}
            className="bg-[rgba(201,168,76,0.10)] border border-[rgba(201,168,76,0.20)] text-[#C9A84C] text-[11px] font-semibold px-2.5 py-1 rounded-full"
          >
            {inst}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-5 border-t border-[rgba(245,240,232,0.06)]">
        <div>
          <div className="text-[#C9A84C] font-display font-bold text-[20px] leading-none">
            {teacher.stats.studentCount}+
          </div>
          <div className="text-[#7A7570] text-[11px] mt-1">Сурагчид</div>
        </div>
        <div>
          <div className="text-[#C9A84C] font-display font-bold text-[20px] leading-none">
            {teacher.stats.rating}
          </div>
          <div className="text-[#7A7570] text-[11px] mt-1">⭐ Үнэлгээ</div>
        </div>
      </div>
    </div>
  );
}
