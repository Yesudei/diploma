import './globals.css';
import Providers from '@/components/Common/Providers';
import { Bebas_Neue, DM_Sans, Cormorant_Garamond } from 'next/font/google';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
});

const dmSans = DM_Sans({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm',
});

const cormorant = Cormorant_Garamond({
  weight: '300',
  subsets: ['latin'],
  variable: '--font-cormorant',
});

export const metadata = {
  title: 'AI Шийдэл — Хөгжим Боловсруулалтын Платформ',
  description: 'Design and Development of AI-Insisted Music Producing Website',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="mn"
      className={`${bebasNeue.variable} ${dmSans.variable} ${cormorant.variable}`}
    >
      <body className="bg-[#0c0c0b] text-[#f0ead8] antialiased overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
