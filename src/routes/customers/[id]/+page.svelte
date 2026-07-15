<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const customer = $derived(data.customer);

	function statusBadgeClass(status: typeof customer.status): string {
		switch (status) {
			case 'active':
				return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
			case 'trial':
				return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';
			case 'churned':
				return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
		}
	}

	function healthBarClass(health: number): string {
		if (health >= 70) return 'bg-emerald-500';
		if (health >= 40) return 'bg-amber-500';
		return 'bg-red-500';
	}

	function healthLabel(health: number): string {
		if (health >= 70) return 'Healthy';
		if (health >= 40) return 'Watch';
		return 'At risk';
	}

	function formatCurrency(n: number): string {
		return n.toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		});
	}
</script>

<svelte:head>
	<title>{customer.name} — Customers · SaaS Dashboard</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<nav class="text-xs text-text-muted">
		<a href={resolve('/customers')} class="transition hover:text-text-primary">← All customers</a>
	</nav>

	<header class="flex flex-wrap items-start justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h1 class="text-xl font-semibold text-text-primary">{customer.name}</h1>
			<p class="font-mono text-xs text-text-muted">{customer.id}</p>
		</div>
		<span
			class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statusBadgeClass(
				customer.status
			)}"
		>
			{customer.status}
		</span>
	</header>

	<section
		class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
		aria-label="Customer metrics"
	>
		<article class="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm">
			<h2 class="text-xs font-medium uppercase tracking-wide text-text-muted">MRR</h2>
			<p class="text-2xl font-semibold tabular-nums text-text-primary">
				{formatCurrency(customer.mrr)}
			</p>
			<p class="text-xs text-text-muted">Monthly recurring revenue</p>
		</article>

		<article class="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm">
			<h2 class="text-xs font-medium uppercase tracking-wide text-text-muted">Lifetime value</h2>
			<p class="text-2xl font-semibold tabular-nums text-text-primary">
				{formatCurrency(customer.ltv)}
			</p>
			<p class="text-xs text-text-muted">Projected total revenue</p>
		</article>

		<article class="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm">
			<h2 class="text-xs font-medium uppercase tracking-wide text-text-muted">Health</h2>
			<div class="flex items-center gap-3">
				<p class="text-2xl font-semibold tabular-nums text-text-primary">
					{customer.health}
				</p>
				<span class="text-xs font-medium text-text-muted">
					{healthLabel(customer.health)}
				</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-border">
				<div
					class="h-full {healthBarClass(customer.health)}"
					style="width: {customer.health}%"
				></div>
			</div>
		</article>
	</section>
</div>
