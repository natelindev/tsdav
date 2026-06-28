import { defineConfig } from 'rolldown';

const input = './src/index.ts';
const tsconfig = './tsconfig.build.json';
// Keep package entries dependency-based. Partially bundling `xml-js` leaves its
// nested `sax` dependency as a runtime require in native ESM.
const packageExternals = ['debug', 'xml-js'];

const packageOutput = [
  {
    file: 'dist/tsdav.cjs.js',
    format: 'cjs',
    exports: 'named',
  },
  {
    file: 'dist/tsdav.esm.js',
    format: 'esm',
  },
  {
    file: 'dist/tsdav.cjs',
    format: 'cjs',
    exports: 'named',
  },
  {
    file: 'dist/tsdav.mjs',
    format: 'esm',
  },
  {
    file: 'dist/tsdav.min.cjs',
    format: 'cjs',
    exports: 'named',
    minify: true,
  },
  {
    file: 'dist/tsdav.min.mjs',
    format: 'esm',
    minify: true,
  },
];

const browserOutput = [
  {
    file: 'dist/tsdav.js',
    format: 'esm',
  },
  {
    file: 'dist/tsdav.min.js',
    format: 'esm',
    minify: true,
  },
];

export default defineConfig([
  {
    input,
    external: packageExternals,
    platform: 'neutral',
    tsconfig,
    output: packageOutput,
  },
  {
    input,
    platform: 'browser',
    tsconfig,
    output: browserOutput,
  },
]);
