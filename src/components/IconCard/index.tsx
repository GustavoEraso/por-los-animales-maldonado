
interface IconCardProps {
    icon: string;
    title: string;
    description: string
}
export default function IconCard({ icon, title, description }: IconCardProps) {
    return (
        <div className="flex flex-col items-center  w-full p-4 gap-4 bg-white rounded-lg text-center font-barlo text-dark-text">
            <img src={icon} alt={title} className="w-36 h-36 mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 uppercase">{title}</h3>
            <p className="mt-2 text-gray-600">{description}</p>
        </div>
    );
}