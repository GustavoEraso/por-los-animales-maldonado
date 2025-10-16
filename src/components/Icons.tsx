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

function WhatsAppIcon({ size = DEFAULT_SIZE, title, color, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title} viewBox="0 0 360 362" color={color}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M307.546 52.5655C273.709 18.685 228.706 0.0171895 180.756 0C81.951 0 1.53846 80.404 1.50408 179.235C1.48689 210.829 9.74646 241.667 25.4319 268.844L0 361.736L95.0236 336.811C121.203 351.096 150.683 358.616 180.679 358.625H180.756C279.544 358.625 359.966 278.212 360 179.381C360.017 131.483 341.392 86.4547 307.546 52.5741V52.5655ZM180.756 328.354H180.696C153.966 328.346 127.744 321.16 104.865 307.589L99.4242 304.358L43.034 319.149L58.0834 264.168L54.5423 258.53C39.6304 234.809 31.749 207.391 31.7662 179.244C31.8006 97.1036 98.6334 30.2707 180.817 30.2707C220.61 30.2879 258.015 45.8015 286.145 73.9665C314.276 102.123 329.755 139.562 329.738 179.364C329.703 261.513 262.871 328.346 180.756 328.346V328.354ZM262.475 216.777C257.997 214.534 235.978 203.704 231.869 202.209C227.761 200.713 224.779 199.966 221.796 204.452C218.814 208.939 210.228 219.029 207.615 222.011C205.002 225.002 202.389 225.372 197.911 223.128C193.434 220.885 179.003 216.158 161.891 200.902C148.578 189.024 139.587 174.362 136.975 169.875C134.362 165.389 136.7 162.965 138.934 160.739C140.945 158.728 143.412 155.505 145.655 152.892C147.899 150.279 148.638 148.406 150.133 145.423C151.629 142.432 150.881 139.82 149.764 137.576C148.646 135.333 139.691 113.287 135.952 104.323C132.316 95.5909 128.621 96.777 125.879 96.6309C123.266 96.5019 120.284 96.4762 117.293 96.4762C114.302 96.4762 109.454 97.5935 105.346 102.08C101.238 106.566 89.6691 117.404 89.6691 139.441C89.6691 161.478 105.716 182.785 107.959 185.776C110.202 188.767 139.544 234.001 184.469 253.408C195.153 258.023 203.498 260.782 210.004 262.845C220.731 266.257 230.494 265.776 238.212 264.624C246.816 263.335 264.71 253.786 268.44 243.326C272.17 232.866 272.17 223.893 271.053 222.028C269.936 220.163 266.945 219.037 262.467 216.794L262.475 216.777Z"
        fill="currentColor"
      />
    </SvgBase>
  );
}

function PetsIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M180-475q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Zm180-160q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Zm240 0q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Zm180 160q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM266-75q-45 0-75.5-34.5T160-191q0-52 35.5-91t70.5-77q29-31 50-67.5t50-68.5q22-26 51-43t63-17q34 0 63 16t51 42q28 32 49.5 69t50.5 69q35 38 70.5 77t35.5 91q0 47-30.5 81.5T694-75q-54 0-107-9t-107-9q-54 0-107 9t-107 9Z" />
    </SvgBase>
  );
}

function SearchIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
    </SvgBase>
  );
}

function FilterIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z" />
    </SvgBase>
  );
}

function TrashIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
    </SvgBase>
  );
}

function EyeIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
    </SvgBase>
  );
}

function UploadIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M440-200v-326L336-422l-56-58 200-200 200 200-56 58-104-104v326h-80ZM240-80q-33 0-56.5-23.5T160-160v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-80H240Z" />
    </SvgBase>
  );
}

function HeartIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Zm0-108q96-86 158-147.5t98-107q36-45.5 50-81t14-70.5q0-60-40-100t-100-40q-47 0-87 26.5T518-680h-76q-15-41-55-67.5T300-774q-60 0-100 40t-40 100q0 35 14 70.5t50 81q36 45.5 98 107T480-228Zm0-273Z" />
    </SvgBase>
  );
}

function LanguageIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M838-65 720-183v89h-80v-226h226v80h-90l118 118-56 57ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 20-2 40t-6 40h-82q5-20 7.5-40t2.5-40q0-20-2.5-40t-7.5-40H654q3 20 4.5 40t1.5 40q0 20-1.5 40t-4.5 40h-80q3-20 4.5-40t1.5-40q0-20-1.5-40t-4.5-40H386q-3 20-4.5 40t-1.5 40q0 20 1.5 40t4.5 40h134v80H404q12 43 31 82.5t45 75.5q20 0 40-2.5t40-4.5v82q-20 2-40 4.5T480-80ZM170-400h136q-3-20-4.5-40t-1.5-40q0-20 1.5-40t4.5-40H170q-5 20-7.5 40t-2.5 40q0 20 2.5 40t7.5 40Zm34-240h118q9-37 22.5-72.5T376-782q-55 18-99 54.5T204-640Zm172 462q-18-34-31.5-69.5T322-320H204q29 51 73 87.5t99 54.5Zm28-462h152q-12-43-31-82.5T480-798q-26 36-45 75.5T404-640Zm234 0h118q-29-51-73-87.5T584-782q18 34 31.5 69.5T638-640Z" />
    </SvgBase>
  );
}

function GridViewIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M120-520v-320h320v320H120Zm0 400v-320h320v320H120Zm400-400v-320h320v320H520Zm0 400v-320h320v320H520ZM200-600h160v-160H200v160Zm400 0h160v-160H600v160Zm0 400h160v-160H600v160Zm-400 0h160v-160H200v160Zm400-400Zm0 240Zm-240 0Zm0-240Z" />
    </SvgBase>
  );
}

function TableViewIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M320-80q-33 0-56.5-23.5T240-160v-480q0-33 23.5-56.5T320-720h480q33 0 56.5 23.5T880-640v480q0 33-23.5 56.5T800-80H320Zm0-80h200v-120H320v120Zm280 0h200v-120H600v120ZM80-240v-560q0-33 23.5-56.5T160-880h560v80H160v560H80Zm240-120h200v-120H320v120Zm280 0h200v-120H600v120ZM320-560h480v-80H320v80Z" />
    </SvgBase>
  );
}

function ImageIcon({ size = DEFAULT_SIZE, title, ...props }: IconProps) {
  return (
    <SvgBase {...props} size={size} title={title}>
      <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm80-80h480L570-520 450-360l-90-120-120 160Zm-80 80v-480 480Z" />
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
  WhatsAppIcon,
  PetsIcon,
  SearchIcon,
  FilterIcon,
  TrashIcon,
  EyeIcon,
  UploadIcon,
  HeartIcon,
  LanguageIcon,
  GridViewIcon,
  TableViewIcon,
  ImageIcon,
};
