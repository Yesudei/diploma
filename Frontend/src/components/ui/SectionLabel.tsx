export default function SectionLabel({
  children,
  center = false,
}: {
  children: string;
  center?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-[#C9A84C] text-[11px] font-bold tracking-[0.14em] uppercase mb-3.5 ${center ? 'justify-center' : ''}`}
    >
      <span className="w-7 h-px bg-[#C9A84C]" />
      {children}
      {center && <span className="w-7 h-px bg-[#C9A84C]" />}
    </div>
  );
}
