import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? '/tcg-biblico/' : '/',
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
} as any);
