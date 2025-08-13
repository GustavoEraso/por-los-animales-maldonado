'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import NextImage from 'next/image';
import QRCode from 'react-qr-code';

import { fetchAnimals } from "@/lib/fetchAnimal";
import { yearsOrMonthsElapsed } from '@/lib/dateUtils';

import { Animal } from '@/types';
import AdjustableImage from '@/elements/AdjustableImage';


export default function Compartir() {
    const { id } = useParams<{ id: string }>();

    const [animal, setAnimal] = useState<Animal>({} as Animal);

    const [nameSize, setNameSize] = useState(30);

    useEffect(() => {

        const fetchAnimal = async () => {
            const [fetchedAnimal] = await fetchAnimals({ id });
            setAnimal(fetchedAnimal);
        };

        fetchAnimal();
    }, [id])

    const currentImages  = useMemo<string[]>(() => {
        return animal.images?.map(img => img.imgUrl) || [];
    }, [animal?.images]);



    const areaRef = useRef<HTMLDivElement>(null);

    // ---- Captura con html2canvas ----------------------------
    const capturar = async () => {
        if (!areaRef.current) return;
        const html2canvas = (await import('html2canvas-pro')).default;

        const canvas = await html2canvas(areaRef.current, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpg');
        link.download = 'captura.jpg';
        link.click();
    };

   

    const someCompatibility = useMemo(() => {
        if (!animal?.id) return false;
        return (Object.values(animal.compatibility))
            .includes('si');
    }, [animal]);



    if (!animal?.id) {
        return (
            <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
                <h1 className="text-2xl font-bold">ups parece que no encontramos el animal...</h1>
            </div>
        );
    }


    return (
        <div className="font-sans flex flex-col items-center justify-center min-h-screen p-8 sm:p-20 gap-16 bg-gray-400">
            <main className="flex flex-col gap-8 items-center w-full bg-green-400 rounded p-16">
                {/* Área que se captura */}
                <div
                    ref={areaRef}
                    className="flex flex-col items-center  bg-cream-light w-80 aspect-[3/4] select-none "
                >
                    <section className='flex felx-col items-center justify-centerbg-white w-full py-1'>
                        <h3 className=' text-green-dark text-center text-balance font-extrabold text-2xl leading-6'>EN ADOPCIÓN RESPONSABLE</h3>
                    </section>
                    <section className='flex bg-green-forest text-cream-light w-full h-full'>
                        {/* Seccion izquierda */}
                        <div className="w-3/7 flex flex-col items-stretch justify-between  p-1">

                            <h3 className={`break-words font-bold uppercase  text-center`} style={{ fontSize: `${nameSize}px` }}>
                                {animal.name || 'Nombre no disponible.'}
                            </h3>

                            <ul className='flex flex-col gap-1 p-1 font-bold'>
                                <li className="text-lg  capitalize"> {animal.gender}</li>
                                <li className="text-lg  capitalize"> {yearsOrMonthsElapsed(animal.aproxBirthDate)}</li>
                                <li className="text-lg  capitalize"> {animal.size}</li>
                                {animal.isSterilized === 'si' && <li className="text-lg font-semibold capitalize"> castrado </li>}
                            </ul>
                            <div className='py-2'>
                                <p className='border-b-2 font-semibold'>+info</p>
                                {someCompatibility && (<div className=' flex flex-col'>
                                    <p className='font-semibold'>se lleva bien con:</p>
                                    <div className='flex gap-1 text-2xl justify-center'>
                                        {animal.compatibility.dogs === 'si' && <span>🐶 </span>}
                                        {animal.compatibility.cats === 'si' && <span>🐱 </span>}
                                        {animal.compatibility.kids === 'si' && <span>👶 </span>}
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                        
                        <AdjustableImage imageUrls={currentImages} className='text-green-dark'   />
                    </section>
                    <footer className=' relative flex flex-col bg-green-dark w-full h-2/6 '>


                        <div className='relative  w-full flex  align-bottom justify-between px-1 pt-1 '>
                            <NextImage
                                src="/logo300.webp"
                                alt="Logo de Adopta"
                                width={60}
                                height={60}
                                className=" mt-2 object-contain"
                            />
                            <span className='text-green-dark text-sm text-center font-bold bg-cream-light rounded px-1 absolute  left-1/2 -translate-x-1/2 -top-2 w-max '>
                                CONTACTO: 98-686-375
                            </span>

                            <div className='  flex felx-col items-end'>
                                <p className='text-lg text center   text-cream-light'>
                                    MAS INFO EN:
                                </p>
                            </div>
                            <QRCode className='' value={`www.porlosanimalesmaldonado.com/adopta/${animal.id}`} size={60} level="H" />

                        </div>

                        <p className='text-xs text-cream-light text-center'>
                            {`porlosanimalesmaldonado.com/adopta/${animal.id}`}

                        </p>
                    </footer>
                </div>

                {/* Botón descarga */}
                <button
                    onClick={capturar}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Descargar JPG
                </button>

                
                
            </main>
        </div>
    );
}

