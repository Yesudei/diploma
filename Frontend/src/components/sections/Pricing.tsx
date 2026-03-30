import SectionLabel from '@/components/ui/SectionLabel';
import PricingCard from '@/components/cards/PricingCard';

export default function Pricing() {
  return (
    <section className="py-24 px-[60px] bg-[#111118]">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center mb-14">
          <SectionLabel center>Үнэ</SectionLabel>
          <h2 className="font-display text-[clamp(36px,4vw,56px)] font-black leading-[1.1] mb-4">
            Өөрт тохирох <em className="not-italic text-[#C9A84C]">төлөвлөгөө</em> сонгох
          </h2>
          <p className="text-[#7A7570] text-base max-w-[460px] mx-auto leading-[1.7]">
            Хичээл тус бүрийг тусад нь авна. .FLP project файл хавсаргана.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <PricingCard
            title="Үнэгүй"
            price={0}
            description="FL Studio-тай танилцах, үндсэн арга барилаа тогтоох"
            features={[
              '3 үнэгүй хичээл',
              'FL Studio үндэс',
              'Анхны төсөл үүсгэх',
              'Багштай холбоо',
            ]}
            buttonLabel="Үнэгүй эхлэх"
          />
          <PricingCard
            title="Pro"
            price="₮15,000"
            period="/сар"
            description="Бүх хичээлүүдэд хандах, .FLP файлтой"
            features={[
              'Бүх хичээлүүд',
              '.FLP project файл',
              'Багштай холбоо 24/7',
              'Гэрчилгээ авнах',
              'Beat Making + Mixing',
            ]}
            highlighted
            buttonLabel="Pro эхлэх →"
          />
        </div>
      </div>
    </section>
  );
}
