export const toBoolean = (value: unknown, defaultValue = false): boolean => {
  if (value === undefined || value === null || value === '')
    return defaultValue;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value as boolean;
};

export const toInt = (
  value: unknown,
  defaultValue?: number,
): number | undefined => {
  if (value === undefined || value === null || value === '')
    return defaultValue;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }
  return Number.NaN;
};

export const toEnum = <T extends Record<string, string>>(
  value: unknown,
  enumType: T,
  defaultValue: T[keyof T],
): T[keyof T] => {
  if (value === undefined || value === null || value === '')
    return defaultValue;

  const enumValues = Object.values(enumType);

  if (typeof value === 'string' && enumValues.includes(value)) {
    return value as T[keyof T];
  }

  return value as T[keyof T];
};
