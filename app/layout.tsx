import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NIS2 Screener · Tech Stn',
  description:
    'Preliminär bedömning om ert företag omfattas av svenska cybersäkerhetslagen (NIS2).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
