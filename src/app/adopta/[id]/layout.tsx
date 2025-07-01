import type { Metadata, ResolvingMetadata } from 'next';
import { fetchAnimals } from '@/lib/fetchAnimal';

type RouteParams = { id: string };

export async function generateMetadata(
  { params }: { params: RouteParams },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = params;

  const [animal] = await fetchAnimals({ id });
  const { name, description, images } = animal;

  const img =
    images.length > 0
      ? images
      : [{ imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible' }];

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${name} - Por los Animales Maldonado`,
    openGraph: {
      title: name,
      description,
      type: 'article',
      images: [img[0].imgUrl, ...previousImages],
      url: `https://porlosanimalesmaldonado.com/adopta/${animal.id}`,
      section:'adoptcón'
    },
  };
}

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
