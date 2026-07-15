<script lang="ts">
	import { onMount } from 'svelte';
	import type { RevenuePoint } from '$lib/types/metrics';

	type SeriesId = 'mrr' | 'arr' | 'projected';

	interface Props {
		data: RevenuePoint[];
		loading?: boolean;
	}

	let { data, loading = false }: Props = $props();

	const HEIGHT = 280;
	const PAD = { top: 16, right: 16, bottom: 28, left: 56 } as const;

	const SERIES: ReadonlyArray<{
		id: SeriesId;
		label: string;
		color: string;
		dashed?: boolean;
	}> = [
		{ id: 'mrr', label: 'MRR', color: '#10b981' },
		{ id: 'arr', label: 'ARR', color: '#3b82f6' },
		{ id: 'projected', label: 'Projected', color: '#a78bfa', dashed: true }
	];

	let enabled = $state<Record<SeriesId, boolean>>({ mrr: true, arr: false, projected: true });

	const visibleSeries = $derived(SERIES.filter((s) => enabled[s.id]));

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

	function formatK(n: number): string {
		if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
		return `$${n.toFixed(0)}`;
	}

	interface Scales {
		x: (date: string) => number;
		y: (v: number) => number;
		yTicks: Array<{ value: number; y: number; label: string }>;
		xTicks: Array<{ x: number; label: string }>;
		baselineY: number;
	}

	const scales = $derived.by<Scales>(() => {
		if (data.length === 0 || measuredWidth === 0) {
			return {
				x: () => 0,
				y: () => 0,
				yTicks: [],
				xTicks: [],
				baselineY: HEIGHT - PAD.bottom
			};
		}

		const innerW = Math.max(1, measuredWidth - PAD.left - PAD.right);
		const innerH = Math.max(1, HEIGHT - PAD.top - PAD.bottom);

		const tsMin = new Date(data[0].date + 'T00:00:00Z').getTime();
		const tsMax = new Date(data[data.length - 1].date + 'T00:00:00Z').getTime();
		const tsSpan = Math.max(1, tsMax - tsMin);

		let maxY = 0;
		for (const p of data) {
			for (const s of visibleSeries) {
				const v = p[s.id];
				if (v > maxY) maxY = v;
			}
		}
		maxY = niceMax(maxY);

		const xScale = (date: string): number => {
			const t = new Date(date + 'T00:00:00Z').getTime();
			return PAD.left + ((t - tsMin) / tsSpan) * innerW;
		};
		const yScale = (v: number): number => {
			return PAD.top + innerH - (v / maxY) * innerH;
		};

		const yTicks = Array.from({ length: 5 }, (_, i) => {
			const value = (maxY * i) / 4;
			return { value, y: yScale(value), label: formatK(value) };
		});

		const tickCount = Math.min(5, data.length);
		const xTickIndices = Array.from({ length: tickCount }, (_, i) =>
			Math.round((i * (data.length - 1)) / Math.max(1, tickCount - 1))
		);
		const xTicks = xTickIndices.map((i) => ({
			x: xScale(data[i].date),
			label: formatDateShort(data[i].date)
		}));

		return { x: xScale, y: yScale, yTicks, xTicks, baselineY: yScale(0) };
	});

	function linePath(seriesId: SeriesId): string {
		if (data.length < 2) return '';
		return data
			.map(
				(p, i) =>
					`${i === 0 ? 'M' : 'L'} ${scales.x(p.date).toFixed(2)} ${scales.y(p[seriesId]).toFixed(2)}`
			)
			.join(' ');
	}

	function areaPath(seriesId: SeriesId): string {
		if (data.length < 2) return '';
		const top = data
			.map(
				(p, i) =>
					`${i === 0 ? 'M' : 'L'} ${scales.x(p.date).toFixed(2)} ${scales.y(p[seriesId]).toFixed(2)}`
			)
			.join(' ');
		const firstX = scales.x(data[0].date);
		const lastX = scales.x(data[data.length - 1].date);
		return `${top} L ${lastX.toFixed(2)} ${scales.baselineY} L ${firstX.toFixed(2)} ${scales.baselineY} Z`;
	}

	let hoveredIdx = $state<number | null>(null);

	interface HoverState {
		x: number;
		date: string;
		label: string;
		values: Array<{ id: SeriesId; label: string; color: string; value: number; y: number }>;
	}

	const hovered = $derived.by<HoverState | null>(() => {
		if (hoveredIdx === null || data[hoveredIdx] === undefined || measuredWidth === 0) return null;
		const p = data[hoveredIdx];
		const x = scales.x(p.date);
		return {
			x,
			date: p.date,
			label: formatDateShort(p.date),
			values: visibleSeries.map((s) => ({
				id: s.id,
				label: s.label,
				color: s.color,
				value: p[s.id],
				y: scales.y(p[s.id])
			}))
		};
	});

	function handleMove(e: MouseEvent) {
		if (data.length === 0 || measuredWidth === 0) return;
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const x = e.clientX - rect.left;
		let closest = 0;
		let minDist = Infinity;
		for (let i = 0; i < data.length; i++) {
			const px = scales.x(data[i].date);
			const d = Math.abs(px - x);
			if (d < minDist) {
				minDist = d;
				closest = i;
			}
		}
		hoveredIdx = closest;
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
		<h2 class="text-sm font-semibold text-text-primary">Revenue</h2>
		<div class="flex flex-wrap gap-1" role="group" aria-label="Toggle series">
			{#each SERIES as s (s.id)}
				{@const isActive = enabled[s.id]}
				<button
					type="button"
					aria-pressed={isActive}
					class="rounded-full px-3 py-1 text-xs font-medium transition {isActive
						? 'text-bg'
						: 'bg-bg text-text-muted hover:text-text-primary'}"
					style:background-color={isActive ? s.color : ''}
					onclick={() => (enabled[s.id] = !enabled[s.id])}
				>
					{s.label}
				</button>
			{/each}
		</div>
	</header>

	<div bind:this={containerEl} class="relative">
		{#if loading}
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
					<path d="m7 14 4-4 4 4 5-5" />
				</svg>
				<span>No data available</span>
			</div>
		{:else}
			<svg
				width={measuredWidth || 600}
				height={HEIGHT}
				role="img"
				aria-label="Revenue over time"
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

				{#each scales.xTicks as t (t.label)}
					<text
						x={t.x}
						y={HEIGHT - PAD.bottom + 16}
						text-anchor="middle"
						font-size="10"
						fill="currentColor"
						opacity="0.6"
					>
						{t.label}
					</text>
				{/each}

				{#each visibleSeries as s (s.id)}
					<path d={areaPath(s.id)} fill={s.color} fill-opacity="0.12" pointer-events="none" />
					<path
						d={linePath(s.id)}
						fill="none"
						stroke={s.color}
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-dasharray={s.dashed ? '5 4' : '0'}
						pointer-events="none"
					/>
				{/each}

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
					{#each hovered.values as v (v.id)}
						<circle cx={hovered.x} cy={v.y} r="3.5" fill={v.color} pointer-events="none" />
					{/each}
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
					{#each hovered.values as v (v.id)}
						<div class="flex items-center gap-2 tabular-nums">
							<span class="inline-block h-2 w-2 rounded-full" style:background-color={v.color}
							></span>
							<span class="text-text-muted">{v.label}:</span>
							<span class="font-medium text-text-primary">{formatK(v.value)}</span>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</section>
