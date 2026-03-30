import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import SectionLabel from '@/components/ui/SectionLabel';
import TeacherCard from '@/components/cards/TeacherCard';
import { teachers } from '@/lib/data';

export default function TeachersPage() {
  return (
    <>
      <Nav />
      <main className="pt-[140px] pb-20 bg-[#0A0A0F] min-h-screen">
        <div className="px-[60px] mb-16">
          <SectionLabel>Багш нар</SectionLabel>
          <h1 className="font-display text-[clamp(38px,5vw,62px)] font-black leading-[1.09] mb-3.5">
            Манай <em className="not-italic text-[#C9A84C]">мэргэжлийн</em>
            <br />
            багш нар
          </h1>
          <p className="text-[#7A7570] text-base max-w-[500px] leading-[1.7]">
            Олон жилийн туршлагатай, Монголын хөгжмийн талбарт алдартай багш нараас суралцаарай.
          </p>
        </div>

        <div className="px-[60px]">
          <div className="grid grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
