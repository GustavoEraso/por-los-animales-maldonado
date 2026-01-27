import type { Metadata } from 'next';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { fetchContacts } from '@/lib/fetchContacts';

export const metadata: Metadata = {
  title: 'Por Los Animales Maldonado',
  description: 'Somos un grupo de particulares que ayuda a animales en situación de calle.',
  openGraph: {
    title: 'Por Los Animales Maldonado',
    description: 'Somos un grupo de particulares que ayuda a animales en situación de calle.',
    url: 'https://porlosanimalesmaldonado.org',
    siteName: 'Por Los Animales Maldonado',
    images: [
      {
        url: 'https://porlosanimalesmaldonado.org/logo300.webp',
        width: 300,
        height: 300,
        alt: 'Logo de Por Los Animales Maldonado',
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
  const contacts = await fetchContacts();

  return (
    <>
      {children}
      {contacts && contacts.length > 0 && <WhatsAppFloat contacts={contacts} />}
    </>
  );
}
