<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Something went wrong.');

	let retrying = $state(false);

	async function handleRetry() {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<svelte:head>
	<title>{status} — SaaS Dashboard</title>
</svelte:head>

<section
	class="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-surface p-8 text-center shadow-sm"
	aria-live="polite"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="48"
		height="48"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		class="text-text-muted opacity-60"
	>
		<circle cx="12" cy="12" r="10" />
		<line x1="12" y1="8" x2="12" y2="12" />
		<line x1="12" y1="16" x2="12.01" y2="16" />
	</svg>

	<div class="flex flex-col gap-1">
		<p class="text-3xl font-semibold tabular-nums text-text-primary">{status}</p>
		<h1 class="text-base font-semibold text-text-primary">We hit a snag</h1>
		<p class="text-sm text-text-muted">{message}</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-2">
		<button
			type="button"
			onclick={handleRetry}
			disabled={retrying}
			class="rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-bg transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{retrying ? 'Retrying…' : 'Retry'}
		</button>
		<a
			href={resolve('/')}
			class="rounded-md border border-border bg-bg px-4 py-2 text-sm font-medium text-text-muted transition hover:text-text-primary"
		>
			Go to overview
		</a>
	</div>
</section>
