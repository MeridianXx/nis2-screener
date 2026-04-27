import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-display',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'NIS2-kollen',
  description:
    'Preliminär bedömning om ert företag omfattas av svenska cybersäkerhetslagen (NIS2).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = `${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable}`;
  return (
    <html lang="sv" className={fontVars}>
      <body className="bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
