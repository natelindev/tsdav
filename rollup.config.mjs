/* eslint-disable import/no-extraneous-dependencies */
import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import ts from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: './src/index.ts',
    output: [
      {
        file: 'dist/tsdav.cjs.js',
        format: 'cjs',
      },
      {
        file: 'dist/tsdav.esm.js',
        format: 'es',
      },
      {
        file: 'dist/tsdav.cjs',
        format: 'cjs',
      },
      {
        file: 'dist/tsdav.mjs',
        format: 'es',
      },
      {
        file: 'dist/tsdav.min.cjs',
        format: 'cjs',
        plugins: [terser()],
      },
      {
        file: 'dist/tsdav.min.mjs',
        format: 'es',
        plugins: [terser()],
      },
    ],
    plugins: [
      ts({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationDir: './ts',
      }),
      cjs(),
      resolve({
        modulesOnly: true,
      }),
    ],
  },
  {
    input: './src/index.ts',
    output: [
      {
        file: 'dist/tsdav.js',
        format: 'es',
      },
      {
        file: 'dist/tsdav.min.js',
        format: 'es',
        plugins: [terser()],
      },
    ],
    plugins: [
      ts({
        tsconfig: './tsconfig.build.json',
        declaration: false,
      }),
      cjs(),
      nodePolyfills(),
      resolve({
        browser: true,
      }),
    ],
  },
  {
    input: './dist/ts/index.d.ts',
    output: [{ file: 'dist/tsdav.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];
