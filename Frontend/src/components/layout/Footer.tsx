import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#111118] border-t border-[rgba(245,240,232,0.06)] pt-16 pb-10">
      <div className="px-[60px]">
        <div className="grid grid-cols-2 gap-12 mb-14">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="#C9A84C" strokeWidth="1.5" />
                <path d="M10 18V10l10 4-10 4z" fill="#C9A84C" />
              </svg>
              <span className="font-display font-bold text-[#C9A84C] text-[17px] tracking-wide">
                melodex
              </span>
            </Link>
            <p className="text-[#7A7570] text-[13px] leading-relaxed max-w-[220px]">
              Монгол хэл дээрх FL Studio хичээлийн платформ.
            </p>
          </div>

          <div>
            <h4 className="text-[#F5F0E8] text-sm font-semibold mb-4">Холбоос</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/courses" className="text-[#7A7570] text-sm hover:text-[#C9A84C] transition-colors">
                  Хичээлүүд
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-[#7A7570] text-sm hover:text-[#C9A84C] transition-colors">
                  Нэвтрэх
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-[#7A7570] text-sm hover:text-[#C9A84C] transition-colors">
                  Бүртгүүлэх
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-7 border-t border-[rgba(245,240,232,0.06)]">
          <p className="text-[#4A4540] text-xs">© 2025 melodex. Бүх эрх хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
}
