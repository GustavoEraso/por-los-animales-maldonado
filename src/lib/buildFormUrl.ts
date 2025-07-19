
interface FormUrlParams {
  dogName: string;
  dogId: string;
}

const FORM_BASE =
  'https://docs.google.com/forms/d/e/1FAIpQLScvzAe9is0FY9Yj3jJuVCfi61Un3WhhnmgkXHPWmkwWQcujIw/viewform';

export function buildFormUrl({ dogName, dogId }: FormUrlParams): string {
  
  const dogUrl = `https://porlosanimalesmaldonado.com/adopta/${dogId}`;
  const combined = `${dogName.trim()} - ${dogUrl}`;

  const params = new URLSearchParams({
    usp: 'pp_url',
    'entry.1842397340': 'sitio web',
    'entry.1406517497': combined,
  });

  return `${FORM_BASE}?${params.toString()}`;
}
