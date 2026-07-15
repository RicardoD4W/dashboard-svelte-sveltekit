<script lang="ts">
	import { onMount } from 'svelte';
	import type { GrowthPoint } from '$lib/types/metrics';

	interface Props {
		data: GrowthPoint[];
		loading?: boolean;
	}

	let { data, loading = false }: Props = $props();

	const HEIGHT = 280;
	const PAD = { top: 16, right: 12, bottom: 28, left: 48 } as const;

	const COLOR_NEW = '#10b981'; // emerald
	const COLOR_CHURN = '#ef4444'; // red

	type Mode = 'split' | 'net';
	let mode = $state<Mode>('split');

	let containerEl: HTMLDivElement | undefined = $state();
	let measuredWidth = $state(0);

	function niceMax(v: number): number {
		if (v <= 0) return 1;
		const exp = Math.floor(Math.log10(v));
		const f = v / Math.pow(10, exp);
		let nice: number;
		if (f <= 1) nice = 1;
		else if (f <= 2) nice = 2;
		else if (f <= 5) nice = 5;
		else nice = 10;
		return nice * Math.pow(10, exp);
	}

	function formatDateShort(iso: string): string {
		const d = new Date(iso + 'T00:00:00Z');
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
	}

	interface Scales {
		yMax: number;
		y: (v: number) => number;
		baselineY: number;
		yTicks: Array<{ value: number; y: number; label: string }>;
		bandW: number;
	}

	const scales = $derived.by<Scales>(() => {
		if (data.length === 0 || measuredWidth === 0) {
			return {
				yMax: 1,
				y: () => 0,
				baselineY: HEIGHT - PAD.bottom,
				yTicks: [],
				bandW: 0
			};
		}

		const innerW = Math.max(1, measuredWidth - PAD.left - PAD.right);
		const innerH = Math.max(1, HEIGHT - PAD.top - PAD.bottom);

		let rawMax = 0;
		for (const p of data) {
			rawMax = Math.max(rawMax, p.new, p.churned);
		}
		const yMax = niceMax(rawMax);

		const yScale = (v: number): number => {
			return PAD.top + innerH - (v / yMax) * innerH;
		};

		const yTicks = Array.from({ length: 5 }, (_, i) => {
			const value = (yMax * i) / 4;
			return { value, y: yScale(value), label: value.toFixed(0) };
		});

		const baselineY = yScale(0);
		const bandW = innerW / data.length;

		return { yMax, y: yScale, baselineY, yTicks, bandW };
	});

	let hoveredIdx = $state<number | null>(null);

	interface HoverState {
		idx: number;
		date: string;
		label: string;
		x: number;
		newCount: number;
		churnedCount: number;
		net: number;
	}

	const hovered = $derived.by<HoverState | null>(() => {
		if (hoveredIdx === null || data[hoveredIdx] === undefined || measuredWidth === 0) return null;
		const p = data[hoveredIdx];
		const x = PAD.left + hoveredIdx * scales.bandW + scales.bandW / 2;
		return {
			idx: hoveredIdx,
			date: p.date,
			label: formatDateShort(p.date),
			x,
			newCount: p.new,
			churnedCount: p.churned,
			net: p.net
		};
	});

	function handleMove(e: MouseEvent) {
		if (data.length === 0 || measuredWidth === 0) return;
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const x = e.clientX - rect.left - PAD.left;
		if (x < 0 || scales.bandW === 0) {
			hoveredIdx = null;
			return;
		}
		const idx = Math.min(data.length - 1, Math.max(0, Math.floor(x / scales.bandW)));
		hoveredIdx = idx;
	}

	function handleLeave() {
		hoveredIdx = null;
	}

	onMount(() => {
		if (!containerEl) return;

		// Measure immediately — synchronous first paint
		measuredWidth = containerEl.getBoundingClientRect().width;

		const ro = new ResizeObserver((entries) => {
			measuredWidth = entries[0]?.contentRect.width ?? containerEl!.getBoundingClientRect().width;
		});
		ro.observe(containerEl);
		return () => ro.disconnect();
	});

	// If data arrives before ResizeObserver fires, re-measure
	$effect(() => {
		if (data.length > 0 && measuredWidth === 0 && containerEl) {
			measuredWidth = containerEl.getBoundingClientRect().width;
		}
	});
</script>

<section
	class="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
	aria-busy={loading}
>
	<header class="flex flex-wrap items-center justify-between gap-2">
		<h2 class="text-sm font-semibold text-text-primary">Customer growth</h2>
		<div class="flex flex-wrap gap-1" role="group" aria-label="Toggle series mode">
			<button
				type="button"
				aria-pressed={mode === 'split'}
				class="rounded-full px-3 py-1 text-xs font-medium transition {mode === 'split'
					? 'bg-text-primary text-bg'
					: 'bg-bg text-text-muted hover:text-text-primary'}"
				onclick={() => (mode = 'split')}
			>
				Split
			</button>
			<button
				type="button"
				aria-pressed={mode === 'net'}
				class="rounded-full px-3 py-1 text-xs font-medium transition {mode === 'net'
					? 'bg-text-primary text-bg'
					: 'bg-bg text-text-muted hover:text-text-primary'}"
				onclick={() => (mode = 'net')}
			>
				Net
			</button>
		</div>
	</header>

	<div bind:this={containerEl} class="relative">
		{#if loading || measuredWidth === 0}
			<div
				class="w-full animate-pulse rounded bg-border/40"
				style="height: {HEIGHT}px"
				aria-hidden="true"
			></div>
		{:else if data.length === 0}
			<div
				class="flex w-full flex-col items-center justify-center gap-2 text-xs text-text-muted"
				style="height: {HEIGHT}px"
				role="status"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					opacity="0.5"
				>
					<path d="M3 3v18h18" />
					<rect x="7" y="12" width="3" height="6" />
					<rect x="14" y="8" width="3" height="10" />
				</svg>
				<span>No data available</span>
			</div>
		{:else}
			<svg
				width={measuredWidth || 600}
				height={HEIGHT}
				role="img"
				aria-label="Customer growth over time"
				onmousemove={handleMove}
				onmouseleave={handleLeave}
				class="block max-w-full"
			>
				{#each scales.yTicks as t (t.value)}
					<line
						x1={PAD.left}
						x2={measuredWidth - PAD.right}
						y1={t.y}
						y2={t.y}
						stroke="currentColor"
						stroke-opacity="0.08"
						stroke-width="1"
					/>
					<text
						x={PAD.left - 8}
						y={t.y + 3}
						text-anchor="end"
						font-size="10"
						fill="currentColor"
						opacity="0.55"
					>
						{t.label}
					</text>
				{/each}

				<line
					x1={PAD.left}
					x2={measuredWidth - PAD.right}
					y1={scales.baselineY}
					y2={scales.baselineY}
					stroke="currentColor"
					stroke-opacity="0.25"
					stroke-width="1"
				/>

				{#if mode === 'split'}
					{#each data as p, i (p.date)}
						{@const bandX = PAD.left + i * scales.bandW}
						{@const gap = scales.bandW * 0.15}
						{@const barW = Math.max(1, scales.bandW / 2 - gap)}
						{@const leftX = bandX + gap}
						{@const rightX = bandX + scales.bandW / 2 + gap / 2}
						{@const newH = Math.max(0, scales.baselineY - scales.y(p.new))}
						{@const churnH = Math.max(0, scales.baselineY - scales.y(p.churned))}
						<rect
							x={leftX}
							y={scales.y(p.new)}
							width={barW}
							height={newH}
							fill={COLOR_NEW}
							fill-opacity="0.85"
							pointer-events="none"
						/>
						<rect
							x={rightX}
							y={scales.y(p.churned)}
							width={barW}
							height={churnH}
							fill={COLOR_CHURN}
							fill-opacity="0.85"
							pointer-events="none"
						/>
					{/each}
				{:else}
					{#each data as p, i (p.date)}
						{@const bandX = PAD.left + i * scales.bandW}
						{@const barW = Math.max(1, scales.bandW * 0.7)}
						{@const barX = bandX + (scales.bandW - barW) / 2}
						{@const yTop = scales.y(Math.max(0, p.net))}
						{@const yBot = scales.y(Math.min(0, p.net))}
						{@const h = Math.max(0, yBot - yTop)}
						<rect
							x={barX}
							y={yTop}
							width={barW}
							height={h}
							fill={p.net >= 0 ? COLOR_NEW : COLOR_CHURN}
							fill-opacity="0.85"
							pointer-events="none"
						/>
					{/each}
				{/if}

				{#if hovered}
					<line
						x1={hovered.x}
						x2={hovered.x}
						y1={PAD.top}
						y2={scales.baselineY}
						stroke="currentColor"
						stroke-opacity="0.3"
						stroke-width="1"
						stroke-dasharray="2 3"
						pointer-events="none"
					/>
				{/if}
			</svg>

			{#if hovered}
				<div
					class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-bg px-3 py-2 text-xs shadow-lg"
					style:left="{hovered.x}px"
					style:top="{PAD.top}px"
					role="tooltip"
				>
					<div class="mb-1 font-medium text-text-primary">{hovered.label}</div>
					{#if mode === 'split'}
						<div class="flex items-center gap-2 tabular-nums">
							<span class="inline-block h-2 w-2 rounded-full" style:background-color={COLOR_NEW}
							></span>
							<span class="text-text-muted">New:</span>
							<span class="font-medium text-text-primary">{hovered.newCount.toFixed(1)}</span>
						</div>
						<div class="flex items-center gap-2 tabular-nums">
							<span class="inline-block h-2 w-2 rounded-full" style:background-color={COLOR_CHURN}
							></span>
							<span class="text-text-muted">Churned:</span>
							<span class="font-medium text-text-primary">{hovered.churnedCount.toFixed(1)}</span>
						</div>
					{:else}
						<div class="flex items-center gap-2 tabular-nums">
							<span
								class="inline-block h-2 w-2 rounded-full"
								style:background-color={hovered.net >= 0 ? COLOR_NEW : COLOR_CHURN}
							></span>
							<span class="text-text-muted">Net:</span>
							<span
								class="font-medium {hovered.net >= 0
									? 'text-emerald-600 dark:text-emerald-400'
									: 'text-red-600 dark:text-red-400'}"
							>
								{hovered.net >= 0 ? '+' : ''}{hovered.net.toFixed(1)}
							</span>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</section>
