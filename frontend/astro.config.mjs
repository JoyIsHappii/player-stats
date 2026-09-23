// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	// 'server' = render every page per-request (SSR). Required so
	// Astro.url.searchParams (?page=2&search=...) and form POSTs work.
	// The default 'static' mode pre-renders fixed HTML and ignores
	// query strings entirely.
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	server: {
		host: true,
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
