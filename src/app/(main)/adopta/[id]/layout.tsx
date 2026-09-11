import type { Metadata } from 'next';
import { getAnimalById } from '@/lib/data/animals';
import { SITE_URL } from '@/lib/site';

type RouteParams = { id: string };

/* -------- generateMetadata -------- */
export async function generateMetadata(
  { params }: { params: Promise<RouteParams> } // 👈  params es una Promise
): Promise<Metadata> {
  const { id } = await params;

  const animal = await getAnimalById(id);
  const animalUrl = `${SITE_URL}/adopta/${id}`;
  if (!animal) {
    return {
      title: 'Animal no encontrado',
      robots: { index: false, follow: false },
      openGraph: {
        type: 'article',
        title: 'Animal no encontrado',
        description: 'No se pudo encontrar el animal solicitado.',
        url: animalUrl,
      },
    };
  }
  const { name, description, images, isAvailable } = animal;

  const cover = images?.length ? images?.[0]?.imgUrl : null;

  return {
    title: name,
    robots: { index: isAvailable === true, follow: true },
    alternates: {
      canonical: animalUrl,
    },
    openGraph: {
      type: 'article',
      title: name,
      description,
      url: animalUrl,
      images: cover
        ? [{ url: cover, alt: `Foto de ${name}` }] // Solo la imagen del animal
        : undefined, // Deja que Next.js use las del layout padre
      section: 'Adopción',
    },
  };
}

/* -------- RootLayout -------- */
export default function RootLayout({
  children,
  params: _,
}: {
  children: React.ReactNode;
  params: Promise<RouteParams>;
}) {
  return <div>{children}</div>;
}
