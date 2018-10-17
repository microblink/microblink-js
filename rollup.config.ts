import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelCase'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import { terser } from "rollup-plugin-terser";
import copy from 'rollup-plugin-cpy'

const pkg = require('./package.json')

const libraryName = 'Microblink'

export default [
  {
    input: `src/${camelCase(libraryName)}.SDK.ts`,
    output: [
      { file: 'dist/' + camelCase(libraryName) + '.sdk.umd.js', name: libraryName, format: 'umd', sourcemap: true },
      { file: 'dist/' + camelCase(libraryName) + '.sdk.es5.js', format: 'es', sourcemap: true },
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
      include: 'src/**',
    },
    plugins: [
      // Allow json resolution
      json(),
      // Compile TypeScript files
      typescript({ useTsconfigDeclarationDir: true }),
      // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
      commonjs(),
      // Allow node_modules resolution, so you can use 'external' to control
      // which external modules to include in the bundle
      // https://github.com/rollup/rollup-plugin-node-resolve#usage
      resolve(),
      // Resolve source maps to the original source
      sourceMaps(),
    ],
  },
  {
    input: `src/${camelCase(libraryName)}.UI.ts`,
    output: [
      { file: 'dist/' + camelCase(libraryName) + '.ui.umd.js', name: libraryName, format: 'umd', sourcemap: true },
      { file: 'dist/' + camelCase(libraryName) + '.ui.es5.js', format: 'es', sourcemap: true },
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
      include: 'src/**',
    },
    plugins: [
      // Allow json resolution
      json(),
      // Compile TypeScript files
      typescript({ useTsconfigDeclarationDir: true }),
      // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
      commonjs(),
      // Allow node_modules resolution, so you can use 'external' to control
      // which external modules to include in the bundle
      // https://github.com/rollup/rollup-plugin-node-resolve#usage
      resolve(),
      // Resolve source maps to the original source
      sourceMaps(),
    ],
  },
  {
    input: `src/${camelCase(libraryName)}.SDK.ts`,
    output: [
      { file: 'dist/' + camelCase(libraryName) + '.sdk.min.js', name: libraryName, format: 'iife', sourcemap: false }
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
      include: 'src/**',
    },
    plugins: [
      // Allow json resolution
      json(),
      // Compile TypeScript files
      typescript({ useTsconfigDeclarationDir: true }),
      // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
      commonjs(),
      // Allow node_modules resolution, so you can use 'external' to control
      // which external modules to include in the bundle
      // https://github.com/rollup/rollup-plugin-node-resolve#usage
      resolve(),
      // Resolve source maps to the original source
      sourceMaps(),
      // Minify library
      terser(),
    ],
  },
  {
    input: `src/${camelCase(libraryName)}.UI.ts`,
    output: [
      { file: 'dist/' + camelCase(libraryName) + '.ui.min.js', name: libraryName, format: 'iife', sourcemap: false }
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
      include: 'src/**',
    },
    plugins: [
      // Allow json resolution
      json(),
      // Compile TypeScript files
      typescript({ useTsconfigDeclarationDir: true }),
      // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
      commonjs(),
      // Allow node_modules resolution, so you can use 'external' to control
      // which external modules to include in the bundle
      // https://github.com/rollup/rollup-plugin-node-resolve#usage
      resolve(),
      // Resolve source maps to the original source
      sourceMaps(),
      // Minify library
      terser(),
      // Copy other non TypeScript (JavaScript) dependencies to `dist`
      copy({
        files: ['src/ui/*'],
        dest: 'dist/lib/ui',
        options: {
          verbose: true
        }
      })
    ],
  }
]
