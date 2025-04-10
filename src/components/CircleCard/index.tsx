import Link from "next/link";
interface CircleCardProps {
    imgUrl: string;
    imgAlt: string;
    linkUrl: string;
    linkText: string;
    invert?: boolean;
}

export default function CircleCard({ imgUrl, imgAlt, linkUrl, linkText, invert }: CircleCardProps) {
    return (
        <div className=" relative flex flex-col items-center w-full h-full max-w-lg rounded-lg pb-10   ">
            <div className="w-full h-full rounded-full aspect-square ">

                <img
                    src={imgUrl}
                    alt={imgAlt}
                    className="w-full h-full rounded-full shadow-md object-cover"
                />
            </div>
            <Link href={linkUrl} 
            className={`absolute bottom-0 uppercase text-2xl rounded-full px-4 py-2 transition duration-300 ease-in-out text-white
            ${!invert ?'  hover:text-dark-text bg-red-heart hover:bg-green-olive':'text-white  hover:bg-red-heart bg-brown-chocolate'} `}>
                {linkText}
            </Link>

        </div>
    );
}