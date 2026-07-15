 
<script lang="ts">
	import { navigating } from '$app/state';
	import KpiCard from '$lib/components/KpiCard.svelte';
	import RevenueChart from '$lib/components/RevenueChart.svelte';
	import CustomerGrowthChart from '$lib/components/CustomerGrowthChart.svelte';
	import TopCustomersTable from '$lib/components/TopCustomersTable.svelte';
	import DateRangePicker from '$lib/components/DateRangePicker.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const isLoading = $derived(!!navigating.to);
</script>

<svelte:head>
	<title>SaaS Metrics Dashboard</title>
	<meta
		name="description"
		content="Overview of MRR, ARR, customer growth and top accounts for your SaaS portfolio."
	/>
</svelte:head>

<div class="flex flex-col gap-6">
 	<DateRangePicker
		presets={data.presets}
		current={{
			from: data.range.from,
			to: data.range.to,
			rangeId: data.range.rangeId
		}}
		loading={isLoading}
	/>

 	<section
		id="kpi-section"
		class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
		aria-label="Key performance indicators"
		aria-busy={isLoading}
	>
		{#each data.kpis as kpi (kpi.id)}
			<KpiCard {kpi} loading={isLoading} />
		{/each}
	</section>

 	<section class="grid grid-cols-1 gap-4 lg:grid-cols-5" aria-label="Charts">
		<div class="lg:col-span-3">
			<RevenueChart data={data.revenue} loading={isLoading} />
		</div>
		<div class="lg:col-span-2">
			<CustomerGrowthChart data={data.growth} loading={isLoading} />
		</div>
	</section>

 	<TopCustomersTable customers={data.customers} loading={isLoading} />
</div>