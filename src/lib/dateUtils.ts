export function formatDateMMYYYY(timestamp: number): string {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${year}`;
}


export function yearsOrMonthsElapsed(millis: number): string {
  
  const then = new Date(millis);
  const now  = new Date();

  let years  = now.getFullYear() - then.getFullYear();
  let months = now.getMonth()   - then.getMonth();

  // Ajuste si el día del mes aún no llegó
  if (now.getDate() < then.getDate()) months--;

  // Normaliza meses negativos sumando 12 y restando un año
  if (months < 0) {
    years--;
    months += 12;
  }

  // Con ≥ 1 año devolvemos "X años y Y meses" (Y puede ser 0)
  if (years >= 1) {
    const yearPart  = `${years} ${years === 1 ? 'año' : 'años'}`;
    const monthPart = months > 0 ? ` y ${months} ${months === 1 ? 'mes' : 'meses'}` : '';
    return yearPart + monthPart;
  }

  // Con < 1 año devolvemos solo meses o "menos de un mes"
  if (months >= 1) return `${months} ${months === 1 ? 'mes' : 'meses'}`;

  return 'menos de un mes';
}




