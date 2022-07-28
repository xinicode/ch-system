const path = require('path');
import typescript from 'rollup-plugin-typescript2';
// import nodeResolve from '@rollup/plugin-node-resolve';
// import babel from '@rollup/plugin-babel';
// import commonjs from '@rollup/plugin-commonjs';
// import json from '@rollup/plugin-json';

const resolve = (p) => {
  return path.resolve(__dirname, p);
};

export default {
  input: 'module/index.ts',
  output: {
    file: resolve(`dist/${process.env.TARGET}/es/index.js`),
    format: 'es'
  },
  plugins: [
    typescript(/*{ plugin options }*/)
    //json(),
    //commonjs(),
    //nodeResolve(),
    //babel({ babelHelpers: 'bundled' })
  ]
};
