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
  viewBox?: string;
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
    <SvgBase {...props} size={size} title={title} viewBox="0 0 24 24">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgBase>
  );
}

function InstagramIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 24 24">
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
    </SvgBase>
  );
}

function FacebookIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 24 24">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </SvgBase>
  );
}

function CheckIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </SvgBase>
  );
}

function ChevronLeftIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 6 10">
      <path
        d="M5 1 1 5l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgBase>
  );
}

function ChevronRightIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 6 10">
      <path
        d="m1 9 4-4-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgBase>
  );
}

function XCircleIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        fill="none"
        stroke="currentColor"
      />
    </SvgBase>
  );
}

function ChevronDownIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 24 24">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </SvgBase>
  );
}

function MenuIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
    </SvgBase>
  );
}

function XIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M6 18L18 6M6 6l12 12"
        fill="none"
        stroke="currentColor"
      />
    </SvgBase>
  );
}

function EditIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        fill="none"
        stroke="currentColor"
      />
    </SvgBase>
  );
}

function MessageCircleIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 24 24">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgBase>
  );
}
function SvgBase({ title, size, color, viewBox, children, ...props }: IconProps) {
  const iconSize = typeof size === 'string' ? sizeMap[size] || DEFAULT_SIZE : size || DEFAULT_SIZE;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      viewBox={viewBox || '0 -960 960 960'}
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
  InstagramIcon,
  FacebookIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XCircleIcon,
  ChevronDownIcon,
  MenuIcon,
  XIcon,
  EditIcon,
  MessageCircleIcon,
};
