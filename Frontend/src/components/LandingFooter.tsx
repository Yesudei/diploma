import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(201,169,78,0.12)] bg-[rgba(8,9,12,0.88)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-[44px]">
        <p className="text-[12px] text-[var(--text-dim)]">
          © 2025 Melodex. Бүх эрх хуулиар хамгаалагдсан.
        </p>
        <div className="flex flex-wrap items-center gap-4 sm:gap-7">
          <Link
            href="/"
            className="text-[12px] text-[var(--text-dim)] transition-colors hover:text-[var(--gold)]"
          >
            Үйлчилгээний нөхцөл
          </Link>
          <Link
            href="/"
            className="text-[12px] text-[var(--text-dim)] transition-colors hover:text-[var(--gold)]"
          >
            Нууцлал
          </Link>
          <Link
            href="/"
            className="text-[12px] text-[var(--text-dim)] transition-colors hover:text-[var(--gold)]"
          >
            Холбоо барих
          </Link>
          <Link
            href="/sources"
            className="text-[12px] text-[var(--text-dim)] transition-colors hover:text-[var(--gold)]"
          >
            Эх сурвалж
          </Link>
        </div>
      </div>
    </footer>
  );
}
