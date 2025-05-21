'use client'
import Hero from "@/components/Hero";
import { useParams } from "next/navigation";
import { provisoria } from '@/lib/dataPovisoria';
import Image from "next/image";
import PhotoCarrousel from "@/components/PhotoCarrousel";

import { Modal } from "@/components/Modal";

function formatDateMMYYYY(timestamp: number): string {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${year}`;
}

function tiempoTranscurrido(fromMs: number, toMs: number = Date.now()): string {
    const fromDate = new Date(fromMs);
    const toDate = new Date(toMs);

    let years = toDate.getFullYear() - fromDate.getFullYear();
    let months = toDate.getMonth() - fromDate.getMonth();

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const añoTxt = years === 1 ? '1 año' : `${years} años`;
    const mesTxt = months === 1 ? '1 mes' : `${months} meses`;

    if (years > 0 && months > 0) {
        return `${añoTxt} y ${mesTxt}`;
    } else if (years > 0) {
        return añoTxt;
    } else {
        return mesTxt;
    }
}




export default function AnimalId() {
    const { id } = useParams()

    const animal = provisoria.find((animal) => animal.id === id)

    if (animal) {


        const { name, description, status, images, gender, lifeSatge, location, size, species, waitingSince } = animal


        return (
            <div className="flex flex-col items-center pb-6 gap-8 w-full min-h-screen bg-white">

                <Hero imgURL={images[0].imgUrl} title={name} imgAlt="cachorros jugando mientras su madre mira desde atras" />


                <section className="flex flex-col lg:flex-row gap-4  py-4 w-full   justify-center items-center">
                    <section className="flex flex-col md:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
                        <div className="flex flex-col gap-4   text-start text-black px-2">
                            {/* <h3 className="font-extrabold text-4xl  text-green-dark">{name}</h3> */}
                            <p className=" text-green-dark text-lg font-bold text-balance">{description}</p>
                            <ul className="list-disc pl-4  text-green-dark">
                                <li className="text-xl font-semibold">Estado: <span className="font-normal">{status}</span></li>
                                <li className="text-xl font-semibold">Genero: <span className="font-normal">{gender}</span></li>
                                <li className="text-xl font-semibold">Especie: <span className="font-normal">{species}</span></li>
                                <li className="text-xl font-semibold">Tamaño: <span className="font-normal">{size}</span></li>
                                <li className="text-xl font-semibold">Lugar: <span className="font-normal">{location}</span></li>
                                <li className="text-xl font-semibold">Edad: <span className="font-normal">{lifeSatge}</span></li>
                                <li className="text-xl font-semibold">Esperandote desde: <span className="font-normal">{`${formatDateMMYYYY(waitingSince)} (hace ${tiempoTranscurrido(waitingSince)})`} </span></li>
                            </ul>
                        </div>
                        <Image src={images[0].imgUrl} alt={images[0].imgAlt} width={300} height={400} className="w-full md:w-1/3 h-auto aspect-video md:aspect-square object-cover rounded-lg " />
                    </section>
                    
                </section>
                <section className="flex flex-col  gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center" >

                     <h3 className="font-extrabold text-4xl  text-green-dark">Más imagenes</h3>
                     <PhotoCarrousel images={images} />
                </section>

                <Modal buttonText="Postularme para adopción" >
                    <section className="flex flex-col items-center justify-around bg-cream-light w-full h-full p-4 gap-1 text-center ">
                        <h4 className="font-extrabold text-2xl  text-green-dark">Antes de continuar, por favor lee con atención:</h4>
                        <p className=" text-green-dark text-md font-bold ">
                            Adoptar una mascota es un compromiso para toda la vida. No se trata de una decisión impulsiva, sino de una responsabilidad que requiere tiempo, dedicación, amor y recursos.

                        </p>

                        <p className=" text-green-dark text-md font-bold ">
                            Si estás completamente seguro de que puedes ofrecerle un hogar responsable y amoroso, entonces te invitamos a continuar con el formulario.
                        </p>
                        <p className=" text-green-dark text-md font-bold ">
                            Gracias por querer cambiar una vida. 🐾❤️
                        </p>
                        <a href="https://docs.google.com/forms/d/1csJabjokYazcnd5CB4inEXJF27_m_9UjK854l1p_G3o/edit?ts=62f54023#" target="_blank"
                            rel="noopener noreferrer"
                            className="w-fit text-lg rounded-full px-4 py-3 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset uppercase text-center text-balance">Llenar formulario</a>

                    </section>
                </Modal>

            </div>
        );
    } else {
        return (
            <div className="flex flex-col items-center gap-8 w-full min-h-screen bg-white">
                <Hero title="ups" />
                <section className="flex flex-col lg:flex-row gap-4 px-9 py-4 w-full  max-w-7xl justify-center items-center">
                    <h1>Mascota no encontrada</h1>
                </section>
            </div>
        )
    }
}