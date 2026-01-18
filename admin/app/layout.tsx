import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sorio Admin',
  description: 'Admin panel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
