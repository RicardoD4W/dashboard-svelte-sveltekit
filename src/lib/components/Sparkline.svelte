<script lang="ts">

	interface Props {
		points: number[];
		color?: string;
		width?: number | string;
		height?: number | string;
	}

	let {
		points,
		color = 'currentColor',
		width = '100%',
		height = 32
	}: Props = $props();

	const path = $derived(buildPath(points));

	function buildPath(values: number[]): string {
		if (values.length < 2) return '';

		let min = Infinity;
		let max = -Infinity;
		for (const v of values) {
			if (v < min) min = v;
			if (v > max) max = v;
		}
		const span = max - min || 1;
		const w = 100;
		const h = 32;
		const pad = 4;
		const drawable = h - pad * 2;

		const step = w / (values.length - 1);
		return values
			.map((v, i) => {
				const x = i * step;
				const y = pad + drawable - ((v - min) / span) * drawable;
				return `${x.toFixed(2)},${y.toFixed(2)}`;
			})
			.join(' ');
	}
</script>

<svg
	role="img"
	aria-label="Trend"
	viewBox="0 0 100 32"
	preserveAspectRatio="none"
	{width}
	{height}
	class="overflow-visible"
>
	<polyline
		fill="none"
		stroke={color}
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		points={path}
	/>
</svg>