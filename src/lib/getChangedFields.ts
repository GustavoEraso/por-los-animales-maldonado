/**
 * Compares two objects of type T and returns an object with only the fields that changed.
 *
 * @param {Object} params - Parameters for comparison.
 * @param {T} params.oldObj - The original object.
 * @param {T} params.newObj - The updated object.
 * @returns {Partial<T>} An object containing only the fields that have changed.
 */
export function getChangedFields<T>({ oldObj, newObj }: { oldObj: T; newObj: T }): Partial<T> {
  const changed: Partial<T> = {};

  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      const oldValue = oldObj[key as keyof T];
      const newValue = newObj[key as keyof T];

      if (
        typeof oldValue === 'object' &&
        oldValue !== null &&
        typeof newValue === 'object' &&
        newValue !== null
      ) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changed[key as keyof T] = newValue;
        }
      } else if (oldValue !== newValue) {
        changed[key as keyof T] = newValue;
      }
    }
  }

  return changed;
}
