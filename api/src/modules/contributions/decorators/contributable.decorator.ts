import 'reflect-metadata';

const CONTRIBUTABLE_FIELDS_KEY = 'contributable:fields';

type Constructor = new (...args: unknown[]) => unknown;

export function Contributable(
  target: object,
  propertyKey: string | symbol,
): void {
  const constructor = target.constructor;
  const existingFields =
    (Reflect.getMetadata(CONTRIBUTABLE_FIELDS_KEY, constructor) as
      | Set<string>
      | undefined) ?? new Set<string>();

  existingFields.add(String(propertyKey));
  Reflect.defineMetadata(CONTRIBUTABLE_FIELDS_KEY, existingFields, constructor);
}

export function getContributableFields(target: Constructor): Set<string> {
  return (
    (Reflect.getMetadata(CONTRIBUTABLE_FIELDS_KEY, target) as
      | Set<string>
      | undefined) ?? new Set<string>()
  );
}

export function isContributableField(
  target: Constructor,
  fieldName: string,
): boolean {
  return getContributableFields(target).has(fieldName);
}
