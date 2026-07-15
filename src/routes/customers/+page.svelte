<script lang="ts">
	import { navigating } from '$app/state';
	import TopCustomersTable from '$lib/components/TopCustomersTable.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const isLoading = $derived(!!navigating.to);
</script>

<svelte:head>
	<title>Customers — SaaS Dashboard</title>
	<meta name="description" content="Full customer list with MRR, lifetime value, and health." />
</svelte:head>

<div class="flex flex-col gap-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-xl font-semibold text-text-primary">Customers</h1>
		<p class="text-sm text-text-muted">
			Browse, sort, and filter every customer in the portfolio. Click a row to expand inline
			details.
		</p>
	</header>

	<TopCustomersTable customers={data.customers} loading={isLoading} expandable />
</div>
