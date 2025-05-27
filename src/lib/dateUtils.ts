export function formatDateMMYYYY(timestamp: number): string {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${year}`;
}

export function tiempoTranscurrido(fromMs: number, toMs: number = Date.now()): string {
    const fromDate = new Date(fromMs);
    const toDate = new Date(toMs);

    let years = toDate.getFullYear() - fromDate.getFullYear();
    let months = toDate.getMonth() - fromDate.getMonth();

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const añoTxt = years === 1 ? '1 año' : `${years} años`;
    const mesTxt = months === 1 ? '1 mes' : `${months} meses`;

    if (years > 0 && months > 0) {
        return `${añoTxt} y ${mesTxt}`;
    } else if (years > 0) {
        return añoTxt;
    } else {
        return mesTxt;
    }
}

