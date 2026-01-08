import { rbacConfig } from './rbac.config';

type Config = typeof rbacConfig;

export type Scope = keyof Config['scopes'];

export type RolesOf<S extends Scope> = keyof Config['scopes'][S]['roles'];

export type RoleKey = {
  [S in Scope]: `${S}:${RolesOf<S> & string}`;
}[Scope];

type PermissionsConfig<S extends Scope> = Config['scopes'][S]['permissions'];

type SimplePermission<S extends Scope> = {
  [R in keyof PermissionsConfig<S>]: PermissionsConfig<S>[R] extends readonly string[]
    ? `${S & string}:${R & string}.${PermissionsConfig<S>[R][number]}`
    : never;
}[keyof PermissionsConfig<S>];

type VariantPermission<S extends Scope> = {
  [R in keyof PermissionsConfig<S>]: PermissionsConfig<S>[R] extends {
    actions: readonly string[];
    variants: readonly string[];
  }
    ?
        | `${S & string}:${R & string}.${PermissionsConfig<S>[R]['actions'][number]}`
        | `${S & string}:${R & string}.${PermissionsConfig<S>[R]['actions'][number]}:${PermissionsConfig<S>[R]['variants'][number]}`
    : never;
}[keyof PermissionsConfig<S>];

export type PermissionsOf<S extends Scope> =
  | SimplePermission<S>
  | VariantPermission<S>;

export type Permission = {
  [S in Scope]: PermissionsOf<S>;
}[Scope];
