
import React from 'react';

/**
 * Props for the IconCard component.
 */
interface IconCardProps {
    /** URL or path to the icon image */
    icon: string;
    /** Title text for the card */
    title: string;
    /** Description text for the card */
    description: string;
}

/**
 * Icon card component for displaying information with an icon, title, and description.
 *
 * Renders a centered card with an icon image, title, and description text.
 * Features a clean white background with rounded corners and responsive design.
 *
 * @param {IconCardProps} props - Component props
 * @param {string} props.icon - URL or path to the icon image
 * @param {string} props.title - Title text for the card (displayed in uppercase)
 * @param {string} props.description - Description text for the card
 * @returns {React.ReactElement} The rendered icon card component
 *
 * @example
 * // Basic usage
 * <IconCard
 *   icon="/path/to/icon.svg"
 *   title="Card Title"
 *   description="This is a description of the card content."
 * />
 *
 * @example
 * // With service information
 * <IconCard
 *   icon="/services/veterinary.svg"
 *   title="Veterinary Care"
 *   description="Professional medical care for all our rescued animals."
 * />
 */
export default function IconCard({ icon, title, description }: IconCardProps): React.ReactElement {
    return (
        <div className="flex flex-col items-center  w-full p-4 gap-4 bg-white rounded-lg text-center font-barlo text-black">
            <img src={icon} alt={title} className="w-36 h-36 mb-4 object-contain" />
            <h3 className="text-2xl font-bold text-gray-800 uppercase">{title}</h3>
            <p className="mt-2 text-gray-600">{description}</p>
        </div>
    );
}