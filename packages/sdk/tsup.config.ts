import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: { resolve: ['@hayasedb/shared'] },
  clean: true,
  sourcemap: true,
  target: 'es2023',
  noExternal: ['@hayasedb/shared'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
});
