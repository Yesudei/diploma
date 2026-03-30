import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#111118] border-t border-[rgba(245,240,232,0.06)] pt-16 pb-10">
      <div className="px-[60px]">
        <div className="grid grid-cols-4 gap-12 mb-14">
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
              Монгол хэл дээрх хөгжмийн хичээлийн платформ.
            </p>
          </div>

          <div>
            <h4 className="text-[#F5F0E8] text-sm font-semibold mb-4">Хичээлүүд</h4>
            <ul className="space-y-2.5">
              {['Гитар', 'Пиано', 'Дуу хоолой', 'Онол'].map((item) => (
                <li key={item}>
                  <Link
                    href="/courses"
                    className="text-[#7A7570] text-sm hover:text-[#C9A84C] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#F5F0E8] text-sm font-semibold mb-4">Компани</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Багш нар', href: '/teachers' },
                { label: 'Үнэ', href: '/pricing' },
                { label: 'Холбоо барих', href: '/contact' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[#7A7570] text-sm hover:text-[#C9A84C] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#F5F0E8] text-sm font-semibold mb-4">Бүртгэл</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Нэвтрэх', href: '/auth/login' },
                { label: 'Бүртгүүлэх', href: '/auth/register' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[#7A7570] text-sm hover:text-[#C9A84C] transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-7 border-t border-[rgba(245,240,232,0.06)] flex items-center justify-between">
          <p className="text-[#4A4540] text-xs">© 2025 melodex. Бүх эрх хамгаалагдсан.</p>
          <div className="flex items-center gap-4">
            {['Үйлчилгээний нөхцөл', 'Нууцлалын бодлого'].map((item) => (
              <button
                key={item}
                className="text-[#4A4540] text-xs hover:text-[#7A7570] transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
