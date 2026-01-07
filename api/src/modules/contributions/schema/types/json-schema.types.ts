export type JSONSchema7TypeName =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export interface JSONSchema7 {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $defs?: Record<string, JSONSchema7>;

  title?: string;
  description?: string;

  type?: JSONSchema7TypeName | JSONSchema7TypeName[];
  enum?: unknown[];
  const?: unknown;

  properties?: Record<string, JSONSchema7>;
  required?: string[];
  additionalProperties?: boolean | JSONSchema7;

  items?: JSONSchema7 | JSONSchema7[];
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;

  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  default?: unknown;
  examples?: unknown[];
}
