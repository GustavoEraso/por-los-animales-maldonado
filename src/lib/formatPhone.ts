interface Props{
    countryCode: string,
    phone: string
}
export function formatPhone({countryCode, phone}:Props): string {
  switch (countryCode) {
    case "+598": // Uruguay (ej: 94144657 → 94 144 657)
      return `${countryCode} ${phone.slice(0,2)} ${phone.slice(2,5)} ${phone.slice(5)}`;

    case "+54": // Argentina (ej: 911234567 → 9 11 2345 67)
      return `${countryCode} ${phone.slice(0,1)} ${phone.slice(1,3)} ${phone.slice(3,7)} ${phone.slice(7)}`;

    case "+55": // Brasil (ej: 11987654321 → 11 98765 4321)
      return `${countryCode} ${phone.slice(0,2)} ${phone.slice(2,7)} ${phone.slice(7)}`;

    default: // fallback genérico
      return `${countryCode} ${phone}`;
  }
}