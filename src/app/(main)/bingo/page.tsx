import { Metadata } from 'next';
import Bingo from '@/components/Bingo';

export const generateMetadata = (): Metadata => {
  return {
    openGraph: {
      title: 'Bingo Solidario 🐾',
      description: 'Vení a nuestro Bingo Solidario y ayudanos a seguir cuidando a los animales.',
      url: 'https://www.porlosanimalesmaldonado.com/bingo',
      images: [
        {
          url: 'https://res.cloudinary.com/dytabfg7v/image/upload/v1760111922/flyer_njhq2f_51f254.jpg',
          width: 1200,
          height: 630,
          alt: 'imagen del bingo solidario',
        },
      ],
      type: 'website',
    },
  };
};
export default function BingoPage() {
  return <Bingo />;
}
