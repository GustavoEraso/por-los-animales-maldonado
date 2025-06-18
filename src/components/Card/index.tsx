import Link from "next/link";
import { Animal } from "@/types"
import Image from "next/image";

export default function Card({ props }: { props: Animal }) {

    const { name, gender, lifeStage, isAvalible, images, id } = props;
    const img = images[0] || { imgUrl: '/logo300.webp', imgAlt: 'Imagen no disponible' };
    const { imgUrl, imgAlt } = img;
    return (
        <article className="grid grid-rows-[1.8fr_1fr] rounded-xl overflow-hidden hover:scale-105 shadow bg-cream-light ">
            <div className="aspect-square">
                <Link className="w-full h-full" href={`/adopta/${id}`}>
                    <Image className="w-full h-full object-cover bg-white" src={imgUrl} alt={imgAlt} width={300} height={300} />
                </Link>
            </div>
            <div className="flex flex-col items-center justify-between gap-1 p-2">
                <h3 className="uppercase text-2xl text-center font-extrabold">{name}</h3>
                <p className="text-center">{`${gender} | ${lifeStage} | ${isAvalible ? 'disponible':'no disponible'}`}</p>
                <Link className="w-fit text-xl rounded-full px-2 py-1 transition duration-300 ease-in-out text-white bg-caramel-deep hover:bg-amber-sunset" href={`/adopta/${id}`}>Ver más info</Link>
            </div>

        </article>
    )
}