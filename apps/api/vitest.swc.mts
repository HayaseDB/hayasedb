import swc from 'unplugin-swc'

export const swcPlugin = () =>
  swc.vite({
    tsconfigFile: false,
    jsc: {
      target: 'es2023',
      parser: { syntax: 'typescript', decorators: true },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
        useDefineForClassFields: false,
      },
      keepClassNames: true,
    },
    module: { type: 'es6' },
  })
