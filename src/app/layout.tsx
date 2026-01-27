import { Analytics } from '@vercel/analytics/react';

import { Roboto } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import UnauthorizedAlert from '@/components/UnauthorizedAlert';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={` antialiased  ${roboto.variable}`}>
        <AuthProvider>
          <UnauthorizedAlert />
          <Header />
          {children}
          <Analytics />
          <Footer />
          <ToastContainer position="bottom-right" theme="colored" />
        </AuthProvider>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_ANALYTICS_ID ?? ''} />
    </html>
  );
}
