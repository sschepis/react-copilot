import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

// Read package.json manually since we're using ES modules
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
  input: 'src/components/ui-modules/index.ts',
  output: [
    {
      file: 'dist/ui-modules.js',
      format: 'iife', // Changed from 'esm' to 'iife' for browser use
      name: 'ReactLlmUi', // Global name
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      },
      sourcemap: true,
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    commonjs({
      include: /node_modules/,
    }),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      // Skip type checking for faster builds - we're just trying to get it running
      noEmitOnError: false,
      compilerOptions: {
        // More lenient options for development
        skipLibCheck: true,
        noImplicitAny: false,
        strictNullChecks: false
      }
    }),
    postcss({
      extensions: ['.css'],
      minimize: false, // No need to minimize for dev
      inject: true,
    }),
  ],
  external: [
    'react',
    'react-dom',
    // Add other external dependencies as needed
    'lodash',
    'nanoid'
  ],
};