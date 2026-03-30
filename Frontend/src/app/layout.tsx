import { Playfair_Display, DM_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata = {
  title: 'melodex — Хөгжмийн платформ',
  description: 'Монгол хэл дээрх хөгжмийн хичээлийн платформ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-bg text-cream font-sans antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
