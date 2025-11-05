/**
 * Compares two objects of type T and returns an object with only the fields that changed.
 *
 * @param {Object} params - Parameters for comparison.
 * @param {T} params.oldObj - The original object.
 * @param {T} params.newObj - The updated object.
 * @returns {Partial<T>} An object containing only the fields that have changed (with new values).
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

/**
 * Compares two objects and returns the changes with both before and after values.
 * Perfect for audit logs that need to track what changed from what to what.
 *
 * @param {Object} params - Parameters for comparison.
 * @param {T} params.oldObj - The original object (before changes).
 * @param {T} params.newObj - The updated object (after changes).
 * @returns {Object} Object with `before` and `after` containing only changed fields.
 * @returns {Partial<T>} returns.before - Fields that changed with their old values.
 * @returns {Partial<T>} returns.after - Fields that changed with their new values.
 *
 * @example
 * const original = { name: 'John', role: 'user', age: 25 };
 * const updated = { name: 'John', role: 'admin', age: 26 };
 * const changes = getChangedFieldsWithValues({ oldObj: original, newObj: updated });
 * // Result: { before: { role: 'user', age: 25 }, after: { role: 'admin', age: 26 } }
 */
export function getChangedFieldsWithValues<T>({ oldObj, newObj }: { oldObj: T; newObj: T }): {
  before: Partial<T>;
  after: Partial<T>;
} {
  const before: Partial<T> = {};
  const after: Partial<T> = {};

  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      const oldValue = oldObj[key as keyof T];
      const newValue = newObj[key as keyof T];

      let hasChanged = false;

      if (
        typeof oldValue === 'object' &&
        oldValue !== null &&
        typeof newValue === 'object' &&
        newValue !== null
      ) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          hasChanged = true;
        }
      } else if (oldValue !== newValue) {
        hasChanged = true;
      }

      if (hasChanged) {
        before[key as keyof T] = oldValue;
        after[key as keyof T] = newValue;
      }
    }
  }

  return { before, after };
}
