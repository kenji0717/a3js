import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // ライブラリの src を直接参照
      'a3js': path.resolve(__dirname, '../src'),
    },
  },
});
