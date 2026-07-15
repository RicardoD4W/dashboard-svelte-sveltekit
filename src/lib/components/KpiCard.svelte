<script lang="ts">
	import type { Kpi } from '$lib/types/metrics';
	import Sparkline from './Sparkline.svelte';

	interface Props {
		kpi: Kpi;
		loading?: boolean;
	}

	let { kpi, loading = false }: Props = $props();

	const displayValue = $derived(formatValue(kpi));

	const isPositive = $derived(kpi.inverted ? kpi.delta < 0 : kpi.delta > 0);
	const deltaClass = $derived(
		isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
	);

	const arrow = $derived(kpi.delta > 0 ? '▲' : kpi.delta < 0 ? '▼' : '▬');

	const sparkColor = $derived(isPositive ? '#10b981' : '#ef4444');

	const isEmpty = $derived(
		kpi.value === 0 || kpi.value === undefined || !Number.isFinite(kpi.value)
	);

	function formatValue(k: Kpi): string {
		if (isEmpty) return '—';
		switch (k.id) {
			case 'mrr':
			case 'arr':
			case 'ltv':
			case 'cac':
			case 'arpu':
				return formatCurrency(k.value);
			case 'churn':
				return `${k.value.toFixed(2)}%`;
		}
	}

	function formatCurrency(n: number): string {
		return n.toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		});
	}
</script>

<article
	data-testid="kpi-card"
	class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm transition"
	aria-busy={loading}
>
	<header class="flex items-center justify-between gap-2">
		{#if loading}
			<span class="block h-3 w-20 animate-pulse rounded bg-border"></span>
		{:else}
			<h3 class="text-xs font-medium uppercase tracking-wide text-text-muted">
				{kpi.label}
			</h3>
		{/if}
	</header>

	{#if loading}
		<span class="block h-7 w-32 animate-pulse rounded bg-border"></span>
		<span class="block h-3 w-16 animate-pulse rounded bg-border"></span>
	{:else if isEmpty}
		<div class="flex flex-col gap-1 text-text-muted">
			<p class="text-2xl font-semibold tabular-nums">—</p>
			<p class="text-xs">No data available</p>
		</div>
	{:else}
		<p class="text-2xl font-semibold tabular-nums text-text-primary">
			{displayValue}
		</p>
		<p class="flex items-center gap-1 text-xs font-medium {deltaClass}">
			<span aria-hidden="true">{arrow}</span>
			<span>{Math.abs(kpi.delta).toFixed(1)}%</span>
			<span class="text-text-muted">vs prior</span>
		</p>
	{/if}

	<div class="mt-1 h-8" class:opacity-50={loading}>
		{#if loading}
			<span class="block h-full w-full animate-pulse rounded bg-border" aria-hidden="true"></span>
		{:else}
			<Sparkline points={kpi.sparkline} color={sparkColor} />
		{/if}
	</div>
</article>
