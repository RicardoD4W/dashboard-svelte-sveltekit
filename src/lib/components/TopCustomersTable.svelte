<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type {
		Paginated,
		CustomerRow,
		CustomerSort,
		CustomerFilterStatus,
		SortDir
	} from '$lib/types/metrics';

	interface Props {
		customers: Paginated<CustomerRow>;
		loading?: boolean;
		expandable?: boolean;
	}

	let { customers, loading = false, expandable = false }: Props = $props();

	const SORTS: readonly CustomerSort[] = ['mrr', 'ltv', 'health', 'name'];
	const FILTERS: readonly CustomerFilterStatus[] = ['all', 'active', 'churned', 'at-risk'];

	const currentSort = $derived<CustomerSort>(
		(SORTS as readonly string[]).includes(page.url.searchParams.get('sort') ?? '')
			? (page.url.searchParams.get('sort') as CustomerSort)
			: 'mrr'
	);

	const currentStatus = $derived<CustomerFilterStatus>(
		(FILTERS as readonly string[]).includes(page.url.searchParams.get('status') ?? '')
			? (page.url.searchParams.get('status') as CustomerFilterStatus)
			: 'all'
	);

	const currentDir = $derived<SortDir | undefined>(
		(() => {
			const raw = page.url.searchParams.get('dir');
			return raw === 'asc' || raw === 'desc' ? (raw as SortDir) : undefined;
		})()
	);

	const currentPage = $derived(
		Math.max(1, Number.parseInt(page.url.searchParams.get('page') ?? '1', 10) || 1)
	);
	const pageCount = $derived(Math.max(1, Math.ceil(customers.total / customers.pageSize)));

	let sectionEl: HTMLElement | undefined = $state();

	// After navigation to page > 1, scroll this section into view
	$effect(() => {
		const p = currentPage;
		if (p > 1 && sectionEl) {
			setTimeout(() => {
				sectionEl?.scrollIntoView({ behavior: 'instant', block: 'start' });
			}, 0);
		}
	});

	// Clicking a sort header: cycle undefined → asc → desc → undefined.
	// New column starts at asc. Direction is the source of truth — lives in the URL.
	function handleSort(col: CustomerSort) {
		let nextDir: SortDir | undefined;
		// Preserve page when cycling direction on the same column; reset when changing columns or going to default
		let nextPage: string | undefined | null = null;
		if (currentSort === col) {
			// Same column: undefined → asc → desc → undefined
			if (currentDir === undefined) {
				nextDir = 'asc';
				nextPage = page.url.searchParams.get('page') ?? null; // preserve current page
			} else if (currentDir === 'asc') {
				nextDir = 'desc';
				nextPage = page.url.searchParams.get('page') ?? null; // preserve current page
			} else {
				nextDir = undefined; // back to default — page still relevant, preserve it
				nextPage = page.url.searchParams.get('page') ?? null;
			}
		} else {
			// New column: always start ascending, reset page
			nextDir = 'asc';
		}
		// Navigate to update URL — undefined dir means delete both sort and dir (back to default MRR sort)
		const params: Record<string, string | undefined | null> = {
			sort: nextDir === undefined ? undefined : col,
			page: nextPage,
			dir: nextDir
		};
		goto(withParams(params));
	}

	// Arrow indicator — derived from URL only, never from stale local state
	function sortArrow(col: CustomerSort): string {
		if (currentSort !== col) return '';
		if (currentDir === 'asc') return '↑';
		if (currentDir === 'desc') return '↓';
		return '';
	}

	function withParams(overrides: Record<string, string | number | null | undefined>): string {
		const next = new URLSearchParams(page.url.searchParams);
		for (const [k, v] of Object.entries(overrides)) {
			if (v === null || v === undefined || v === '') next.delete(k);
			else next.set(k, String(v));
		}
		const qs = next.toString();
		return qs ? `?${qs}` : page.url.pathname;
	}

	function statusBadgeClass(status: CustomerRow['status']): string {
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

	const FILTERS_LABELS: Record<CustomerFilterStatus, string> = {
		all: 'All',
		active: 'Active',
		trial: 'Trial',
		churned: 'Churned',
		'at-risk': 'At risk'
	};

	let expandedId = $state<string | null>(null);

	function toggleRow(id: string) {
		if (!expandable) return;
		expandedId = expandedId === id ? null : id;
	}

	function handleRowKey(e: KeyboardEvent, id: string) {
		if (!expandable) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleRow(id);
		}
	}

	function formatCurrency(n: number): string {
		return n.toLocaleString('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		});
	}

	function healthLabel(health: number): string {
		if (health >= 70) return 'Healthy';
		if (health >= 40) return 'Watch';
		return 'At risk';
	}
</script>

<section
	bind:this={sectionEl}
	class="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
	aria-busy={loading}
>
	<header
		class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"
	>
		<h2 class="text-sm font-semibold text-text-primary">Top customers</h2>

		<div class="flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
			{#each FILTERS as f (f)}
				{@const isActive = currentStatus === f}
				<a
					href={withParams({ status: f === 'all' ? null : f, page: null })}
					role="tab"
					aria-selected={isActive}
					class="rounded-full px-3 py-1 text-xs font-medium transition {isActive
						? 'bg-text-primary text-bg'
						: 'bg-bg text-text-muted hover:text-text-primary'}"
				>
					{FILTERS_LABELS[f]}
				</a>
			{/each}
		</div>
	</header>

	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			<thead
				class="border-b border-border bg-bg/50 text-xs uppercase tracking-wide text-text-muted"
			>
				<tr>
					<th class="px-4 py-2 font-medium">
						<button
							type="button"
							class="hover:text-text-primary cursor-pointer"
							onclick={() => handleSort('name')}
						>
							Customer {sortArrow('name')}
						</button>
					</th>
					<th class="px-4 py-2 text-right font-medium">
						<button
							type="button"
							class="hover:text-text-primary cursor-pointer"
							onclick={() => handleSort('mrr')}
						>
							MRR {sortArrow('mrr')}
						</button>
					</th>
					<th class="px-4 py-2 text-right font-medium">
						<button
							type="button"
							class="hover:text-text-primary cursor-pointer"
							onclick={() => handleSort('ltv')}
						>
							LTV {sortArrow('ltv')}
						</button>
					</th>
					<th class="px-4 py-2 font-medium">
						<button
							type="button"
							class="hover:text-text-primary cursor-pointer"
							onclick={() => handleSort('health')}
						>
							Health {sortArrow('health')}
						</button>
					</th>
					<th class="px-4 py-2 font-medium">Status</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					{#each Array.from({ length: 5 }) as _, i (i)}
						<tr class="border-b border-border last:border-b-0">
							<td class="px-4 py-3"
								><span class="block h-3 w-32 animate-pulse rounded bg-border"></span></td
							>
							<td class="px-4 py-3"
								><span class="ml-auto block h-3 w-16 animate-pulse rounded bg-border"></span></td
							>
							<td class="px-4 py-3"
								><span class="ml-auto block h-3 w-16 animate-pulse rounded bg-border"></span></td
							>
							<td class="px-4 py-3"
								><span class="block h-2 w-20 animate-pulse rounded-full bg-border"></span></td
							>
							<td class="px-4 py-3"
								><span class="block h-5 w-16 animate-pulse rounded-full bg-border"></span></td
							>
						</tr>
					{/each}
				{:else if customers.rows.length === 0}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-sm text-text-muted">
							<div class="mx-auto flex w-fit flex-col items-center gap-2" role="status">
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
									<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
									<circle cx="9" cy="7" r="4" />
									<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
									<path d="M16 3.13a4 4 0 0 1 0 7.75" />
								</svg>
								<span>No data available</span>
							</div>
						</td>
					</tr>
				{:else}
					{#each customers.rows as row (row.id)}
						{@const isExpanded = expandedId === row.id}
						<tr
							class="border-b border-border transition hover:bg-bg/50 {expandable
								? 'cursor-pointer'
								: ''}"
							role={expandable ? 'button' : undefined}
							tabindex={expandable ? 0 : undefined}
							aria-expanded={expandable ? isExpanded : undefined}
							aria-controls={expandable ? `customer-detail-${row.id}` : undefined}
							onclick={() => toggleRow(row.id)}
							onkeydown={(e) => handleRowKey(e, row.id)}
						>
							<td class="px-4 py-3 font-medium text-text-primary">
								<div class="flex items-center gap-2">
									{#if expandable}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="12"
											height="12"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2.5"
											stroke-linecap="round"
											stroke-linejoin="round"
											aria-hidden="true"
											class="text-text-muted transition {isExpanded ? 'rotate-90' : ''}"
										>
											<polyline points="9 18 15 12 9 6" />
										</svg>
									{/if}
									{row.name}
								</div>
							</td>
							<td class="px-4 py-3 text-right tabular-nums text-text-primary">
								${row.mrr.toLocaleString('en-US')}
							</td>
							<td class="px-4 py-3 text-right tabular-nums text-text-primary">
								${row.ltv.toLocaleString('en-US')}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<div class="h-1.5 w-20 overflow-hidden rounded-full bg-border">
										<div
											class="h-full {healthBarClass(row.health)}"
											style="width: {row.health}%"
										></div>
									</div>
									<span class="text-xs tabular-nums text-text-muted">{row.health}</span>
								</div>
							</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusBadgeClass(
										row.status
									)}"
								>
									{row.status}
								</span>
							</td>
						</tr>
						{#if expandable && isExpanded}
							<tr id={`customer-detail-${row.id}`} class="border-b border-border bg-bg/30">
								<td colspan="5" class="px-4 py-4">
									<dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
										<div>
											<dt class="text-xs font-medium uppercase tracking-wide text-text-muted">
												Customer ID
											</dt>
											<dd class="mt-1 font-mono text-xs text-text-primary">{row.id}</dd>
										</div>
										<div>
											<dt class="text-xs font-medium uppercase tracking-wide text-text-muted">
												MRR
											</dt>
											<dd class="mt-1 tabular-nums text-text-primary">
												{formatCurrency(row.mrr)}
											</dd>
										</div>
										<div>
											<dt class="text-xs font-medium uppercase tracking-wide text-text-muted">
												Lifetime value
											</dt>
											<dd class="mt-1 tabular-nums text-text-primary">
												{formatCurrency(row.ltv)}
											</dd>
										</div>
										<div>
											<dt class="text-xs font-medium uppercase tracking-wide text-text-muted">
												Health
											</dt>
											<dd class="mt-1">
												<div class="flex items-center gap-2">
													<div class="h-1.5 w-20 overflow-hidden rounded-full bg-border">
														<div
															class="h-full {healthBarClass(row.health)}"
															style="width: {row.health}%"
														></div>
													</div>
													<span class="text-xs tabular-nums text-text-muted">
														{row.health} · {healthLabel(row.health)}
													</span>
												</div>
											</dd>
										</div>
									</dl>
									<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
										<span>
											Status:
											<span
												class="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusBadgeClass(
													row.status
												)}"
											>
												{row.status}
											</span>
										</span>
										<a
											href={resolve('/customers/[id]', { id: row.id })}
											class="font-medium text-text-primary transition hover:opacity-80"
										>
											View full details →
										</a>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	<footer
		class="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-text-muted"
	>
		<span>
			{customers.total === 0
				? 'No results'
				: `Page ${currentPage} of ${pageCount} · ${customers.total} customer${customers.total === 1 ? '' : 's'}`}
		</span>
		<div class="flex gap-1">
			<a
				data-sveltekit-noscroll
				class="rounded-md border border-border px-3 py-1 transition {currentPage <= 1
					? 'pointer-events-none opacity-40'
					: 'hover:bg-bg'}"
				href={withParams({ page: currentPage - 1 })}
				aria-disabled={currentPage <= 1}
			>
				Prev
			</a>
			<a
				data-sveltekit-noscroll
				class="rounded-md border border-border px-3 py-1 transition {currentPage >= pageCount
					? 'pointer-events-none opacity-40'
					: 'hover:bg-bg'}"
				href={withParams({ page: currentPage + 1 })}
				aria-disabled={currentPage >= pageCount}
			>
				Next
			</a>
		</div>
	</footer>
</section>
