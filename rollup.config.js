import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import replace from 'rollup-plugin-replace';
import { dependencies } from './package.json';

import { copyPackageJson } from './rollup/copy-package-json.js';
import { copyNextConfig } from './rollup/copy-next-config.js';

const config = {
  input: 'src/server/index.ts',
  output: {
    file: 'dist/server.js',
    format: 'cjs',
    sourcemap: true
  },
  external: Array.from(Object.keys(dependencies)),
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    nodeResolve({
      preferBuiltins: true,
      extensions: ['.ts', '.js', '.json']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        module: 'ESNext',
        target: 'ES2020',
        sourceMap: true,
        outDir: 'dist'
      },
      include: ['src/**/*.ts'],
      exclude: ['node_modules/**'],
      outputToFilesystem: true
    }),
    json(),
    // terser(),
    copyPackageJson(),
    copyNextConfig(),
    copy({
      targets: [
        { src: '.next', dest: 'dist' }
      ],
      hook: 'writeBundle'
    })
  ]
};

export default config;
