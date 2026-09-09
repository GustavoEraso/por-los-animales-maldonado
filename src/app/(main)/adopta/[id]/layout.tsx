import type { Metadata } from 'next';
import { getAnimalById } from '@/lib/data/animals';

type RouteParams = { id: string };

/* -------- generateMetadata -------- */
export async function generateMetadata(
  { params }: { params: Promise<RouteParams> } // 👈  params es una Promise
): Promise<Metadata> {
  const { id } = await params;

  const animal = await getAnimalById(id);
  const baseUrl = 'https://www.porlosanimalesmaldonado.org';
  if (!animal) {
    return {
      title: 'Animal no encontrado',
      robots: { index: false, follow: false },
      openGraph: {
        type: 'article',
        title: 'Animal no encontrado',
        description: 'No se pudo encontrar el animal solicitado.',
        url: `${baseUrl}/adopta/${id}`,
      },
    };
  }
  const { name, description, images, isAvailable } = animal;

  const cover = images?.length ? images?.[0]?.imgUrl : null;

  return {
    title: `${name} - Por los Animales Maldonado`,
    robots: { index: isAvailable === true, follow: true },
    openGraph: {
      type: 'article',
      title: name,
      description,
      url: `${baseUrl}/adopta/${id}`,
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
