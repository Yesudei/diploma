import Link from 'next/link';

type SourceItem = {
  label: string;
  url: string;
  note: string;
};

const sources: SourceItem[] = [
  {
    label: 'YouTube Lesson Videos',
    url: 'https://www.youtube.com/',
    note: 'Курсын видео хичээлүүдийн үндсэн эх сурвалж.',
  },
  {
    label: 'YouTube Data API - Videos: list',
    url: 'https://developers.google.com/youtube/v3/docs/videos/list',
    note: 'Хичээлийн хугацааг динамикаар уншихад ашигласан баримт.',
  },
  {
    label: 'Google Fonts',
    url: 'https://fonts.google.com/',
    note: 'Bebas Neue, DM Sans, Cormorant Garamond фонтуудын эх сурвалж.',
  },
  {
    label: 'Supabase',
    url: 'https://supabase.com/',
    note: 'Нэвтрэлт болон өгөгдлийн backend үйлчилгээ.',
  },
];

export default function SourcesPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0F] px-4 pb-14 pt-28 sm:px-8 lg:px-14">
      <div className="mx-auto w-full max-w-[980px] rounded-2xl border border-[rgba(201,169,78,0.18)] bg-[rgba(13,13,18,0.96)] p-6 sm:p-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(201,169,78,0.14)] pb-4">
          <h1 className="font-display text-3xl text-[#F0EAD8] sm:text-4xl">Эх сурвалж</h1>
          <Link
            href="/"
            className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--gold)]"
          >
            ← Нүүр рүү буцах
          </Link>
        </div>

        <ul className="space-y-3">
          {sources.map((source) => (
            <li
              key={source.url}
              className="rounded-xl border border-[rgba(201,169,78,0.14)] bg-[rgba(255,255,255,0.01)] p-4"
            >
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="text-[15px] font-semibold text-[var(--gold-light)] transition-colors hover:text-[var(--gold)]"
              >
                {source.label}
              </a>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{source.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

