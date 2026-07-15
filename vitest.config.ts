import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [svelte({ hot: false })],
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib')
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			provider: 'v8',
			include: ['src/lib/data/**', 'src/lib/server/**'],
			exclude: [
				'src/lib/vitest-examples/**',
				'**/*.d.ts',
				'**/*.types.ts'
			],
			thresholds: {
				lines: 95,
				functions: 95,
				branches: 85,
				statements: 95
			},
			reportOnFailure: true
		},
		globals: true
	}
});
