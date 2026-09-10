import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { getContactsData } from '@/lib/data/contacts';
import { SITE_URL, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s - ${SITE_NAME}`,
  },
  description: 'Somos un grupo de particulares que ayuda a animales en situación de calle.',
  openGraph: {
    title: SITE_NAME,
    description: 'Somos un grupo de particulares que ayuda a animales en situación de calle.',
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og/cachorritos.jpg`,
        width: 1200,
        height: 630,
        alt: 'Por Los Animales Maldonado',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
};

/**
 * Main layout component for public-facing pages.
 * Server Component that fetches contacts and renders WhatsAppFloat.
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const contacts = await getContactsData();

  return (
    <>
      {children}
      {contacts && contacts.length > 0 && <WhatsAppFloat contacts={contacts} />}
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_ANALYTICS_ID ?? ''} />
    </>
  );
}
