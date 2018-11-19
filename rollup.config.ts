import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import camelCase from 'lodash.camelCase'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import { terser } from "rollup-plugin-terser";
import copy from 'rollup-plugin-cpy'
import html from 'rollup-plugin-html'
import babel from 'rollup-plugin-babel'

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
      html ({
        include: 'src/**/*.html',
        htmlMinifierOptions: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          conservativeCollapse: true,
          minifyCSS: true
        }
      }),
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
      terser({
        output: {
          comments: function(node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type == "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on/i.test(text);
            }
          }
        }
      }),
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
      terser({
        output: {
          comments: function(node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type === "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on/i.test(text);
            }
          }
        }
      }),
      html ({
        include: 'src/**/*.html',
        htmlMinifierOptions: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          conservativeCollapse: true,
          minifyCSS: true
        }
      }),
      // Copy other non TypeScript (JavaScript) dependencies to `dist`
      copy({
        files: ['src/ui/*'],
        dest: 'dist/lib/ui',
        options: {
          verbose: true
        }
      })
    ],
  },
  {
    input: `src/${camelCase(libraryName)}.UI.ts`,
    output: [
      { file: 'dist/' + camelCase(libraryName) + '.es5.min.js', name: libraryName, format: 'iife', sourcemap: false }
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
      babel({
        exclude: 'node_modules/**', // only transpile our source code
        babelrc: false,
        presets: ["@babel/preset-env"],
        runtimeHelpers: true,
        plugins: [
          ["@babel/plugin-transform-runtime", { helpers: true, corejs: 2 }],
          "transform-custom-element-classes"
        ]
      }),
      // Minify library
      terser({
        output: {
          comments: function(node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type === "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on/i.test(text);
            }
          }
        }
      }),
      html ({
        include: 'src/**/*.html',
        htmlMinifierOptions: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          conservativeCollapse: false,
          minifyCSS: true
        }
      }),
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
