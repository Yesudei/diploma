import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import SectionLabel from '@/components/ui/SectionLabel';
import PricingCard from '@/components/cards/PricingCard';

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="pt-[140px] pb-20 bg-[#0A0A0F] min-h-screen">
        <div className="px-[60px] mb-16">
          <SectionLabel>Үнэ</SectionLabel>
          <h1 className="font-display text-[clamp(38px,5vw,62px)] font-black leading-[1.09] mb-3.5">
            Өөрт тохирох <em className="not-italic text-[#C9A84C]">төлөвлөгөө</em>
            <br />
            сонгох
          </h1>
          <p className="text-[#7A7570] text-base max-w-[500px] leading-[1.7]">
            Анхан шатнаас мэргэжлийн түвшин хүртэл. Бүх төлөвлөгөөнд үнэгүй хичээлүүд багтсан.
          </p>
        </div>

        <div className="px-[60px]">
          <div className="grid grid-cols-3 gap-6">
            <PricingCard
              title="Үнэгүй"
              price={0}
              description="Хичээлүүдтэй танилцах, сурах арга барилаа тогтоох"
              features={[
                '3 үнэгүй хичээл',
                'Бүх төрлийн хөгжим',
                'Суралцагчийн форум',
                'Үнэлгээ, сэтгэгдэл',
              ]}
              buttonLabel="Үнэгүй эхлэх"
            />
            <PricingCard
              title="Pro"
              price="₮15,000"
              period="/сар"
              description="Бүх хичээлүүдэд хандах, илүү гүнзгий мэдлэг олох"
              features={[
                'Бүх хичээлүүд',
                'Хязгааргүй хандах',
                'Гэрчилгээ авнах',
                'Зөвлөгөө 24/7',
                'Онлайн тест',
              ]}
              highlighted
              buttonLabel="Pro эхлэх →"
            />
            <PricingCard
              title="Enterprise"
              price="₮50,000"
              period="/сар"
              description="Байгууллага, сургалтын төвд зориулсан"
              features={['Бүх хичээлүүд', 'Олон хэрэглэгч', 'Статистик тайлан', 'Дэмжлэг']}
              buttonLabel="Холбогдох →"
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
