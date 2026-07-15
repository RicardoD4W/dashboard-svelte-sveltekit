
<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';

	interface Preset {
		id: string;
		label: string;
		from: string;
		to: string;
	}

	interface RangeState {
		from: string;
		to: string;
		rangeId: string;
	}

	interface Props {
		presets: Preset[];
		current: RangeState;
		loading?: boolean;
	}

	let { presets, current, loading = false }: Props = $props();

	const PRESERVED_KEYS = ['sort', 'status', 'page'] as const;

	function presetHref(p: Preset): string {
		const next = new URLSearchParams();
		for (const k of PRESERVED_KEYS) {
			const v = page.url.searchParams.get(k);
			if (v) next.set(k, v);
		}
		next.set('from', p.from);
		next.set('to', p.to);
		next.set('range', p.id);
		const qs = next.toString();
		return qs ? `?${qs}` : page.url.pathname;
	}

	const resetHref = $derived.by(() => {
		const next = new URLSearchParams();
		for (const k of PRESERVED_KEYS) {
			const v = page.url.searchParams.get(k);
			if (v) next.set(k, v);
		}
		const qs = next.toString();
		return qs ? `?${qs}` : page.url.pathname;
	});


	let customFrom = $state(untrack(() => current.from));
	let customTo = $state(untrack(() => current.to));


	$effect(() => {
		customFrom = current.from;
		customTo = current.to;
	});

	const isCustom = $derived(current.rangeId === 'custom');
	const isDirty = $derived(customFrom !== current.from || customTo !== current.to);
</script>

<section
	class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
	aria-busy={loading}
>
	<header class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-sm font-semibold text-text-primary">Date range</h2>
		<span class="text-xs text-text-muted tabular-nums" aria-live="polite">
			{current.from} → {current.to}
		</span>
	</header>

	<div class="flex flex-wrap gap-1" role="group" aria-label="Date range presets">
		{#each presets as p (p.id)}
			{@const isActive = current.rangeId === p.id}
			<a
				href={presetHref(p)}
				aria-current={isActive ? 'true' : undefined}
				class="rounded-full px-3 py-1 text-xs font-medium transition {isActive
					? 'bg-text-primary text-bg'
					: 'bg-bg text-text-muted hover:text-text-primary'}"
			>
				{p.label}
			</a>
		{/each}
	</div>

	<form
		method="GET"
		class="flex flex-wrap items-end gap-2"
	>
		{#each PRESERVED_KEYS as k (k)}
			{@const v = page.url.searchParams.get(k)}
			{#if v}
				<input type="hidden" name={k} value={v} />
			{/if}
		{/each}

		<label class="flex flex-col gap-1 text-xs text-text-muted">
			<span>From</span>
			<input
				type="date"
				name="from"
				bind:value={customFrom}
				required
				class="rounded-md border border-border bg-bg px-2 py-1 text-sm text-text-primary outline-none focus:border-text-primary"
			/>
		</label>

		<label class="flex flex-col gap-1 text-xs text-text-muted">
			<span>To</span>
			<input
				type="date"
				name="to"
				bind:value={customTo}
				required
				class="rounded-md border border-border bg-bg px-2 py-1 text-sm text-text-primary outline-none focus:border-text-primary"
			/>
		</label>

		<button
			type="submit"
			disabled={!isDirty}
			class="rounded-md bg-text-primary px-3 py-1.5 text-xs font-medium text-bg transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:opacity-90"
		>
			Apply
		</button>

		{#if isCustom}
			<a
				href={resetHref}
				class="rounded-md border border-border bg-bg px-3 py-1.5 text-xs font-medium text-text-muted transition hover:text-text-primary"
			>
				Reset
			</a>
		{/if}
	</form>
</section>