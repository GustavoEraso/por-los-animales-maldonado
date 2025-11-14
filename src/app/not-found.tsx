import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
export const metadata: Metadata = {
  title: 'Ups! Página no encontrada - Por los Animales Maldonado',
  description: 'La página que buscás no existe en Por los Animales Maldonado.',
};

export default function NotFound(): React.ReactElement {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-5 p-5 text-center animate-wiggle">
      <Image
        className="animate-bounce"
        src="/hueso-200.webp"
        alt="Página no encontrada"
        width={200}
        height={200}
      />
      <h1 className="text-5xl m-0 animate-wiggle">404</h1>
      <p className="text-lg text-gray-500 text-balance">La página que buscás no existe</p>

      <Link href="/" className="py-2.5 px-5 bg-black text-white rounded-2xl">
        Volver al inicio
      </Link>
    </div>
  );
}
