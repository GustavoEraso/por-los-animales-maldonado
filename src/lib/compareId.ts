const isNumericString = (value: string): boolean => {
  return value.trim() !== '' && !isNaN(Number(value));
};

/**
 * Compares two ID strings with numeric-aware logic.
 *
 * When both values are numeric strings (e.g. "1", "10"), they are compared
 * numerically. When either is non-numeric (e.g. "pancho", "pedro"), numeric
 * values are sorted first, followed by lexicographic comparison.
 *
 * @param a - First ID string
 * @param b - Second ID string
 * @returns Negative if a < b, positive if a > b, zero if equal
 *
 * @example
 * compareId('2', '10')       // -8  (numeric: 2 < 10)
 * compareId('pancho', 'pedro') // lexicographic
 * compareId('2', 'pancho')   // -1  (numeric sorts first)
 */
export function compareId(a: string, b: string): number {
  const aIsNum = isNumericString(a);
  const bIsNum = isNumericString(b);

  if (aIsNum && bIsNum) {
    return Number(a) - Number(b);
  }
  if (aIsNum) return -1;
  if (bIsNum) return 1;
  return a.localeCompare(b);
}
