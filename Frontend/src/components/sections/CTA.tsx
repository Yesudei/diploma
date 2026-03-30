import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-24 px-[60px] bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-[#111118] border border-[rgba(201,168,76,0.20)] rounded-[24px] p-16 text-center relative overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full -top-48 left-1/2 -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(201,168,76,0.08),transparent_70%)] blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="font-display text-[clamp(36px,4vw,54px)] font-black leading-[1.1] mb-5">
              Өнөөдөр л эхлээд
              <br />
              <em className="not-italic text-[#C9A84C]">хөгжмийн аялал</em>д ор!
            </h2>
            <p className="text-[#7A7570] text-base max-w-[420px] mx-auto leading-[1.7] mb-10">
              500+ сурагчидтай болсон. Та ч бас оролцоорой.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
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
                Хичээлүүд үзэх
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
