import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Por Los Animales Maldonado',
  description: 'Somos un grupo de particulares que ayuda a animales en situación de calle.',
  openGraph: {
    title: 'Por Los Animales Maldonado',
    description: 'Somos un grupo de particulares que ayuda a animales en situación de calle.',
    url: 'https://porlosanimalesmaldonado.com',
    siteName: 'Por Los Animales Maldonado',
    images: [
      {
        url: 'https://porlosanimalesmaldonado.com/logo300.webp',
        width: 300,
        height: 300,
        alt: 'Logo de Por Los Animales Maldonado',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={` antialiased  ${roboto.variable}`}>
        <Header />
        {children}
        <Analytics />
        <Footer />
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_ANALYTICS_ID ?? ''} />
    </html>
  );
}
