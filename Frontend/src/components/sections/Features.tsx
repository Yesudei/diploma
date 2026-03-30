import SectionLabel from '@/components/ui/SectionLabel';

const features = [
  {
    icon: '🎛️',
    title: 'FL Studio хичээлүүд',
    desc: 'FL Studio-н бүх онцлог, plugin, техникийг алхам алхмаар заана',
  },
  {
    icon: '🎧',
    title: 'Мэргэжлийн продюсерууд',
    desc: 'Жинхэнэ туршлагатай Монгол продюсеруудаас сур',
  },
  { icon: '📊', title: 'Ахиц хянах систем', desc: 'Хичээлийн явц, дуусгасан хичээлүүдээ хянах' },
  { icon: '🕐', title: 'Уян хатан цаг', desc: '24/7 хүссэн үедээ, хэдэн ч удаа үзэх боломжтой' },
  { icon: '💬', title: 'Асуулт хариулт', desc: 'Продюсер багш нартаа шууд асуулт тавих боломж' },
  {
    icon: '🎵',
    title: 'Project файл авах',
    desc: 'Хичээл бүрт FL Studio .flp project файл хавсаргана',
  },
];

export default function Features() {
  return (
    <section className="py-24 px-[60px] bg-[#111118]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <SectionLabel center>Давуу талууд</SectionLabel>
          <h2 className="font-display text-[clamp(36px,4vw,56px)] font-black leading-[1.1]">
            Яагаад <em className="not-italic text-[#C9A84C]">биднийг</em> сонгох вэ?
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-[#111118] border border-[rgba(245,240,232,0.06)] rounded-[17px] p-7 hover:border-[rgba(201,168,76,0.20)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-4xl mb-5">{icon}</div>
              <h3 className="font-display text-[18px] font-bold mb-2.5">{title}</h3>
              <p className="text-[#7A7570] text-[13.5px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
