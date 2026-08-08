import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@': `${__dirname}/` },
  },
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/.worktrees/**', '**/.next/**'],
  },
});
