
import type { Metadata } from 'next';
import { fetchAnimals } from '@/lib/fetchAnimal';

type RouteParams = { id: string };

/* -------- generateMetadata -------- */
export async function generateMetadata(
  { params }: { params: Promise<RouteParams> }, // 👈  params es una Promise
): Promise<Metadata> {
  const { id } = await params;

  const [animal] = await fetchAnimals({ id });
  if (!animal) {
    return {
      title: 'Animal no encontrado',
      openGraph: {
        type: 'article',
        title: 'Animal no encontrado',
        description: 'No se pudo encontrar el animal solicitado.',
        url: `https://porlosanimalesmaldonado.com/adopta/${id}`,
      },
    };
  }
  const { name, description, images } = animal;

  const cover = images.length > 0 ? images[0].imgUrl : null;

return {
  title: `${name} - Por los Animales Maldonado`,
  openGraph: {
    type: 'article',
    title: name,
    description,
    url: `https://porlosanimalesmaldonado.com/adopta/${id}`,
    images: cover 
      ? [{ url: cover, alt: `Foto de ${name}` }] // Solo la imagen del animal
      : undefined, // Deja que Next.js use las del layout padre
    section: 'Adopción',
  },
};
}

/* -------- RootLayout -------- */
export default function RootLayout(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { children, params: _ }: { children: React.ReactNode; params: Promise<RouteParams> } // 👈  Promise<...>
) {
  return <div>{children}</div>;
}
