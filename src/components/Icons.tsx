// Configuration constants
const DEFAULT_SIZE = 24;

// Type definitions
type IconSize = 'sm' | 'md' | 'lg' | 'xl' | number;
type IconTheme = 'filled' | 'outlined';

const sizeMap: Record<string, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
  title?: string;
  theme?: IconTheme;
  color?: string;
}

function HomeIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" />
    </SvgBase>
  );
}

function PlusIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
    </SvgBase>
  );
}

function MinusIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M240-440v-80h480v80H240Z" />
    </SvgBase>
  );
}

function UserIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
    </SvgBase>
  );
}

function DollarIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M441-120v-86q-53-12-91.5-46T293-348l74-30q15 48 44.5 73t77.5 25q41 0 69.5-18.5T587-356q0-35-22-55.5T463-458q-86-27-118-64.5T313-614q0-65 42-101t86-41v-84h80v84q50 8 82.5 36.5T651-650l-74 32q-12-32-34-48t-60-16q-44 0-67 19.5T393-614q0 33 30 52t104 40q69 20 104.5 63.5T667-358q0 71-42 108t-104 46v84h-80Z" />
    </SvgBase>
  );
}

function CalendarIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
    </SvgBase>
  );
}

function ArrowLeftIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" />
    </SvgBase>
  );
}

function ArrowUpRightIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="m216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z" />
    </SvgBase>
  );
}

function ArrowDownLeftIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M200-200v-400h80v264l464-464 56 56-464 464h264v80H200Z" />
    </SvgBase>
  );
}

function MailIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" />
    </SvgBase>
  );
}

function PhoneIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M80-120q-33 0-56.5-23.5T0-200v-560q0-33 23.5-56.5T80-840h800q33 0 56.5 23.5T960-760v560q0 33-23.5 56.5T880-120H80Zm556-80h244v-560H80v560h4q42-75 116-117.5T360-360q86 0 160 42.5T636-200ZM360-400q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm400 160 80-80-60-80h-66q-6-18-10-38.5t-4-41.5q0-21 4-40.5t10-39.5h66l60-80-80-80q-54 42-87 106.5T640-480q0 69 33 133.5T760-240Zm-578 40h356q-34-38-80.5-59T360-280q-51 0-97 21t-81 59Zm178-280q-17 0-28.5-11.5T320-520q0-17 11.5-28.5T360-560q17 0 28.5 11.5T400-520q0 17-11.5 28.5T360-480Zm120 0Z" />
    </SvgBase>
  );
}

function SvgBase({ title, size, color, children, ...props }: IconProps) {
  const iconSize = typeof size === 'string' ? sizeMap[size] || DEFAULT_SIZE : size || DEFAULT_SIZE;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      viewBox="0 -960 960 960"
      fill={color || 'currentColor'}
      style={{
        width: iconSize,
        height: iconSize,
        minWidth: iconSize,
        minHeight: iconSize,
      }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

// Export all icons
export {
  HomeIcon,
  PlusIcon,
  MinusIcon,
  UserIcon,
  DollarIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  MailIcon,
  PhoneIcon,
};
