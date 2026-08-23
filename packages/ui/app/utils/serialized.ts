export type Serialized<T> = T extends Date
  ? Date | string
  : T extends ReadonlyArray<infer U>
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T
