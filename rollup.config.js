import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'iife',
    name: 'ExpoUtils',
    banner: `// ==UserScript==
// @name         expo utils
// @namespace    https://ootr.jp/
// @version      ${pkg.version}
// @description  Expo utility userscript
// @author       ootr
// @match        https://ticket.expo2025.or.jp/event_search/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ticket.expo2025.or.jp
// @grant        none
// ==/UserScript==`
  },
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext'
      }
    })
  ]
};