'use client';
import Hero from "@/components/Hero";
import IconCard from "@/components/IconCard";

import { useSearchParams } from 'next/navigation'
import { Suspense } from "react";

export default function Nosotros() {
const searchParams = useSearchParams();
const type = searchParams.get('type') || 'contribute';
const name = searchParams.get('name') || 'amig@';
const amount = searchParams.get('amount') || '0'; 
const currency = searchParams.get('currency') || 'USD';

const contributionType: Record <string, string> = { 
    contribute: 'contribución',   
    suscription: 'suscripción',
    donate: 'donación',
}


  return (
    <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">

      <Hero imgURL="/madre-con-cachorros.webp" imgAlt="cachorros jugando mientras su madre mira desde atras" />
      <section className="flex flex-col  gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
        <section className=" w-full ">
             <Suspense fallback={<div>Cargando...</div>}>

            <h1 className="text-3xl lg:text-5xl font-bold text-center text-balance  text-black">¡Gracias <span className="capitalize">{name}</span>!</h1>
            <p className="text-lg lg:text-xl text-center text-balance text-gray-700">
                Tu {contributionType[type]} de {amount} {currency} {`${type === 'suscription'? ' al mes': ''}`} es muy valiosa para nosotros.
            </p>
            <p className="text-lg lg:text-xl text-center text-balance text-gray-700">
                Con tu ayuda, podemos seguir brindando atención y amor a nuestros animales rescatados.
            </p>
            </Suspense>
            <div className="flex flex-col lg:flex-row gap-4 justify-center items-center mt-4">
                <IconCard
                icon="/logo300.webp"
                title="Compromiso"
                description="Tu apoyo nos permite continuar nuestra labor de rescate y cuidado."
                />
                <IconCard
                icon="/logo300.webp"
                title="Transparencia"
                description="Nos comprometemos a utilizar cada donación de manera responsable."
                />
                <IconCard
                icon="/logo300.webp"
                title="Comunidad"
                description="Juntos hacemos la diferencia en la vida de muchos animales."
                />
            </div>
        </section>
        


      </section>
     


    </div>
  );
}