import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'a3js',
      formats: ['es', 'cjs'],
      fileName: (format) => `a3js.${format}.js`,
    },
    rollupOptions: {
      // three rapier fflateをバンドルしない
      external: [
        'three',
        '@dimforge/rapier3d-compat',
        'fflate'
      ],
      output: {
        globals: {
          three: 'THREE',
        },
      },
    },
  },
});
