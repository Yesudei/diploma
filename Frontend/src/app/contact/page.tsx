import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import SectionLabel from '@/components/ui/SectionLabel';

export default function ContactPage() {
  return (
    <>
      <Nav />
      <main className="pt-[140px] pb-20 bg-[#0A0A0F] min-h-screen">
        <div className="px-[60px] mb-16">
          <SectionLabel>Холбоо барих</SectionLabel>
          <h1 className="font-display text-[clamp(38px,5vw,62px)] font-black leading-[1.09] mb-3.5">
            Бидэнтэй <em className="not-italic text-[#C9A84C]">холбогдох</em>
          </h1>
          <p className="text-[#7A7570] text-base max-w-[500px] leading-[1.7]">
            Асуулт, санал хүсэлт байвал бидэнтэй холбогдоорой.
          </p>
        </div>

        <div className="px-[60px]">
          <div className="grid grid-cols-2 gap-10 max-w-[900px]">
            <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-[17px] p-9">
              <h2 className="font-display text-[22px] font-bold mb-7">Санал, хүсэлт илгээх</h2>
              <form className="space-y-5">
                <div>
                  <label className="block text-[#7A7570] text-xs font-semibold mb-1.5 tracking-wide">
                    Нэр
                  </label>
                  <input
                    type="text"
                    placeholder="Таны нэр"
                    className="w-full bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] text-sm px-4 py-3 rounded-[10px] outline-none focus:border-[rgba(201,168,76,0.40)] transition-colors placeholder:text-[rgba(122,117,112,0.6)]"
                  />
                </div>
                <div>
                  <label className="block text-[#7A7570] text-xs font-semibold mb-1.5 tracking-wide">
                    И-мэйл
                  </label>
                  <input
                    type="email"
                    placeholder="tanii@email.com"
                    className="w-full bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] text-sm px-4 py-3 rounded-[10px] outline-none focus:border-[rgba(201,168,76,0.40)] transition-colors placeholder:text-[rgba(122,117,112,0.6)]"
                  />
                </div>
                <div>
                  <label className="block text-[#7A7570] text-xs font-semibold mb-1.5 tracking-wide">
                    Мессеж
                  </label>
                  <textarea
                    placeholder="Мессежээ бичнэ үү..."
                    rows={5}
                    className="w-full bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] text-sm px-4 py-3 rounded-[10px] outline-none focus:border-[rgba(201,168,76,0.40)] transition-colors placeholder:text-[rgba(122,117,112,0.6)] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#C9A84C] text-[#0A0A0F] font-bold py-4 rounded-[10px] hover:bg-[#E8C96D] transition-all hover:shadow-[0_8px_26px_rgba(201,168,76,0.3)]"
                >
                  Илгээх
                </button>
              </form>
            </div>

            <div className="space-y-5">
              {[
                { icon: '📧', label: 'И-мэйл', value: 'info@nomadsounds.mn' },
                { icon: '📞', label: 'Утас', value: '+976 9911-2233' },
                { icon: '📍', label: 'Хаяг', value: 'Улаанбаатар, Монгол Улс' },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-[17px] p-7 flex items-center gap-5"
                >
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <div className="text-[#7A7570] text-xs font-semibold uppercase tracking-wide mb-1">
                      {label}
                    </div>
                    <div className="text-[#F5F0E8] text-sm font-medium">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
