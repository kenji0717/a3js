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
      // three をバンドルしない
      external: ['three'],
      output: {
        globals: {
          three: 'THREE',
        },
      },
    },
  },
});
