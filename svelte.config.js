import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    vitePreprocess(),
    mdsvex({ extensions: ['.svx'], smartypants: false, layout: { runbook: join(dirname(fileURLToPath(import.meta.url)), 'src/lib/layouts/runbook.svelte') } }),
  ],
  kit: {
    adapter: adapter({ pages: process.env.OUT ?? 'build', assets: process.env.OUT ?? 'build', strict: true }),
    paths: { base: process.env.BASE ?? '' },
    alias: { '#lib': 'src/lib' },
    prerender: { handleHttpError: 'warn' },
  },
};
