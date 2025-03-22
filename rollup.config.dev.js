import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import { babel } from '@rollup/plugin-babel';

const dev = process.env.ROLLUP_WATCH;

export default {
  input: 'src/dev/dev-app.js',
  output: {
    file: 'dist/dev/bundle.js',
    format: 'iife',
    sourcemap: true,
    globals: {
      'react': 'React',
      'react-dom': 'ReactDOM'
    },
    name: 'DevApp'
  },
  plugins: [
    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    commonjs({
      include: /node_modules/,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      inlineSources: true
    }),
    postcss({
      extensions: ['.css'],
      minimize: false,
      inject: true,
    }),
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-react'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      exclude: 'node_modules/**'
    }),
    // Only enable serve and livereload when in watch mode
    dev && serve({
      open: true,
      contentBase: ['dist/dev', 'src/dev'],
      port: 3030,
      verbose: true,
    }),
    dev && livereload({
      watch: 'dist/dev'
    })
  ].filter(Boolean),
  external: ['react', 'react-dom']
};