import Nav from '@/components/layout/Nav';

export default function ProfilePage() {
  return (
    <>
      <Nav />
      <main className="pt-[120px] pb-20 bg-[#0A0A0F] min-h-screen">
        <div className="px-[60px] mb-10">
          <h1 className="font-display text-[clamp(32px,4vw,48px)] font-black leading-[1.1] mb-1.5">
            Профайл
          </h1>
          <p className="text-[#7A7570] text-base">Хувийн мэдээлэл, тохиргоо</p>
        </div>

        <div className="px-[60px]">
          <div className="max-w-[600px]">
            <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-[17px] p-8 mb-6">
              <h2 className="font-display text-[20px] font-bold mb-6">Хувийн мэдээлэл</h2>
              <form className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[#7A7570] text-xs font-semibold mb-1.5 tracking-wide">
                      Нэр
                    </label>
                    <input
                      type="text"
                      defaultValue="Хэрэглэгч"
                      className="w-full bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] text-sm px-4 py-3 rounded-[10px] outline-none focus:border-[rgba(201,168,76,0.40)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#7A7570] text-xs font-semibold mb-1.5 tracking-wide">
                      И-мэйл
                    </label>
                    <input
                      type="email"
                      defaultValue="user@example.com"
                      className="w-full bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] text-sm px-4 py-3 rounded-[10px] outline-none focus:border-[rgba(201,168,76,0.40)] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#7A7570] text-xs font-semibold mb-1.5 tracking-wide">
                    Хоолой
                  </label>
                  <select className="w-full bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] text-sm px-4 py-3 rounded-[10px] outline-none focus:border-[rgba(201,168,76,0.40)] transition-colors">
                    <option>Гитар</option>
                    <option>Пиано</option>
                    <option>Дуу хоолой</option>
                    <option>Онол</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-[#C9A84C] text-[#0A0A0F] font-bold py-3.5 px-8 rounded-[10px] hover:bg-[#E8C96D] transition-all"
                >
                  Хадгалах
                </button>
              </form>
            </div>

            <div className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-[17px] p-8">
              <h2 className="font-display text-[20px] font-bold mb-6">Нууц үг өөрчлөх</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-[#7A7570] text-xs font-semibold mb-1.5 tracking-wide">
                    Одоогийн нууц үг
                  </label>
                  <input
                    type="password"
                    className="w-full bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] text-sm px-4 py-3 rounded-[10px] outline-none focus:border-[rgba(201,168,76,0.40)] transition-colors placeholder:text-[rgba(122,117,112,0.6)]"
                  />
                </div>
                <div>
                  <label className="block text-[#7A7570] text-xs font-semibold mb-1.5 tracking-wide">
                    Шинэ нууц үг
                  </label>
                  <input
                    type="password"
                    className="w-full bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] text-sm px-4 py-3 rounded-[10px] outline-none focus:border-[rgba(201,168,76,0.40)] transition-colors placeholder:text-[rgba(122,117,112,0.6)]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#18181F] border border-[rgba(245,240,232,0.08)] text-[#F5F0E8] font-medium py-3.5 px-8 rounded-[10px] hover:bg-[rgba(245,240,232,0.05)] transition-all"
                >
                  Нууц үг өөрчлөх
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
