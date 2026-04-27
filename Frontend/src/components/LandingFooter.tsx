import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="border-t border-[rgba(201,169,78,0.12)] bg-[rgba(12,12,11,0.82)] backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between px-[44px] py-3.5">
        <p className="text-[12px] text-[var(--text-dim)]">
          © 2025 Melodex. Бүх эрх хуулиар хамгаалагдсан.
        </p>
        <div className="flex items-center gap-7">
          <Link
            href="/"
            className="text-[12px] text-[var(--text-dim)] transition-colors hover:text-[var(--gold)]"
          >
            Нөхцөл
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
