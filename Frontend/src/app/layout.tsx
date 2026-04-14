import './globals.css';

export const metadata = {
  title: 'AI Шийдэл — Хөгжим Боловсруулалтын Платформ',
  description: 'Design and Development of AI-Insisted Music Producing Website',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body className="bg-bg text-cream font-sans antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
