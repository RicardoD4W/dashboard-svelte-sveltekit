<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-dvh flex-col bg-bg text-text-primary">
	<header
		class="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60"
	>
		<nav
			class="mx-auto flex h-14 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 sm:px-6"
		>
			<a
				href="/"
				class="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-text-primary"
			>
				<span
					class="inline-flex h-7 w-7 items-center justify-center rounded-md bg-text-primary text-bg"
					aria-hidden="true"
				>
					S
				</span>
				<span class="truncate">SaaS Dashboard</span>
			</a>

			<div class="flex flex-wrap items-center gap-1 sm:gap-2">
				<a
					href="/"
					class="rounded-md px-2 py-1 text-sm text-text-muted transition hover:text-text-primary"
				>
					Overview
				</a>
				<a
					href="/customers"
					class="rounded-md px-2 py-1 text-sm text-text-muted transition hover:text-text-primary"
				>
					Customers
				</a>
				<ThemeToggle />
			</div>
		</nav>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
		{@render children()}
	</main>

	<footer class="border-t border-border">
		<div
			class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-text-muted sm:px-6"
		>
			<span>SaaS Dashboard · Portfolio demo</span>
			<span class="hidden sm:inline">All data is mocked</span>
		</div>
	</footer>
</div>
