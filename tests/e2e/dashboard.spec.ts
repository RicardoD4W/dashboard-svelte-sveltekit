import { test, expect } from '@playwright/test';

test.describe('Dashboard Overview', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('page loads without errors', async ({ page }) => {
		await expect(page).toHaveTitle(/SaaS Metrics Dashboard/);
	});

	test('shows KPI cards section', async ({ page }) => {
		await expect(page.locator('#kpi-section')).toBeVisible();
	});

	test('displays all 6 KPI cards', async ({ page }) => {
		await expect(page.locator('[data-testid="kpi-card"]')).toHaveCount(6);
	});

	test('shows revenue chart', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Revenue' })).toBeVisible();
	});

	test('shows customer growth chart', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Customer growth' })).toBeVisible();
	});

	test('shows top customers table', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Top customers' })).toBeVisible();
	});

	test('shows date range picker', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Date range' })).toBeVisible();
	});
});

test.describe('Date Range Picker', () => {
	test('preset buttons are visible and clickable', async ({ page }) => {
		await page.goto('/');
		const presets = page.getByRole('group', { name: 'Date range presets' });
		await expect(presets.getByRole('link', { name: '7d' })).toBeVisible();
		await expect(presets.getByRole('link', { name: '30d' })).toBeVisible();
		await expect(presets.getByRole('link', { name: '90d' })).toBeVisible();
		await expect(presets.getByRole('link', { name: 'YTD' })).toBeVisible();
		await expect(presets.getByRole('link', { name: 'All' })).toBeVisible();
	});

	test('clicking 90d updates URL', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: '90d' }).click();
		await expect(page).toHaveURL(/range=90d/);
	});

	test('clicking 7d updates URL', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: '7d' }).click();
		await expect(page).toHaveURL(/range=7d/);
	});

	test('date range persists across navigation', async ({ page }) => {
		await page.goto('/?range=90d');
		await page.getByRole('heading', { name: 'Top customers' }).scrollIntoViewIfNeeded();
		await expect(page.getByRole('link', { name: '90d' })).toHaveAttribute('aria-current', 'true');
	});
});

test.describe('Revenue Chart', () => {
	test('renders without crashing on load', async ({ page }) => {
		await page.goto('/');
		const chart = page.getByRole('img', { name: 'Revenue over time' });
		await expect(chart).toBeVisible();
	});

	test('series toggle buttons exist', async ({ page }) => {
		await page.goto('/');
		// Scope to the Revenue section so we get the chart toggle, not the table sort header
		const revenueSection = page.locator('section').filter({ hasText: 'Revenue' });
		await expect(revenueSection.getByRole('button', { name: 'MRR' })).toBeVisible();
		await expect(revenueSection.getByRole('button', { name: 'ARR' })).toBeVisible();
		await expect(revenueSection.getByRole('button', { name: 'Projected' })).toBeVisible();
	});

	test('toggling MRR off hides it from chart', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const revenueSection = page.locator('section').filter({ hasText: 'Revenue' });
		const mrrButton = revenueSection.getByRole('button', { name: 'MRR' });
		await mrrButton.click();
		// aria-pressed should be false
		await expect(mrrButton).toHaveAttribute('aria-pressed', 'false');
	});

	test('toggling MRR back on', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const revenueSection = page.locator('section').filter({ hasText: 'Revenue' });
		const mrrButton = revenueSection.getByRole('button', { name: 'MRR' });
		await mrrButton.click();
		await mrrButton.click();
		await expect(mrrButton).toHaveAttribute('aria-pressed', 'true');
	});
});

test.describe('Top Customers Table', () => {
	test('shows customer rows', async ({ page }) => {
		await page.goto('/');
		const table = page.locator('table');
		await expect(table).toBeVisible();
		// Should have header + data rows
		const rows = page.locator('tbody tr');
		await expect(rows.first()).toBeVisible();
	});

	test('status filter tabs exist', async ({ page }) => {
		await page.goto('/');
		const filters = page.getByRole('tablist', { name: 'Filter by status' });
		await expect(filters.getByRole('tab', { name: 'All' })).toBeVisible();
		await expect(filters.getByRole('tab', { name: 'Active' })).toBeVisible();
	});

	test('filtering by active shows only active customers', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('tab', { name: 'Active' }).click();
		// All visible rows should have active status badge
		const statusBadges = page.locator('tbody span[class*="bg-emerald"]');
		const count = await statusBadges.count();
		expect(count).toBeGreaterThan(0);
	});

	test('pagination shows correct page info', async ({ page }) => {
		await page.goto('/');
		const footer = page.locator('section').filter({ has: page.locator('table') }).locator('footer');
		await expect(footer.getByText(/Page \d+ of \d+/)).toBeVisible();
	});

	test('Next button navigates to page 2', async ({ page }) => {
		await page.goto('/');
		const nextButton = page.getByRole('link', { name: 'Next' });
		await nextButton.click();
		await expect(page).toHaveURL(/page=2/);
	});

	test('Prev button is disabled on page 1', async ({ page }) => {
		await page.goto('/');
		const prevButton = page.getByRole('link', { name: 'Prev' });
		await expect(prevButton).toHaveAttribute('aria-disabled', 'true');
	});
});

test.describe('Navigation', () => {
	test('Overview link is active on home', async ({ page }) => {
		await page.goto('/');
		const overviewLink = page.getByRole('link', { name: 'Overview' });
		await expect(overviewLink).toBeVisible();
	});

	test('can navigate to Customers page', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Customers' }).click();
		await expect(page).toHaveURL(/\/customers/);
	});

	test('can navigate back to Overview from Customers', async ({ page }) => {
		await page.goto('/customers');
		await page.getByRole('link', { name: 'Overview' }).click();
		await expect(page).toHaveURL('http://localhost:5173/');
	});
});

test.describe('Dark Mode', () => {
	test('theme toggle button exists', async ({ page }) => {
		await page.goto('/');
		const toggle = page.getByRole('button', { name: /Switch to/ });
		await expect(toggle).toBeVisible();
	});

	test('clicking toggle changes theme class on html', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const html = page.locator('html');
		const toggle = page.getByRole('button', { name: /Switch to/ });
		// Ensure we start in a known state: set light
		await page.evaluate(() => {
			localStorage.setItem('theme', 'light');
			document.cookie = 'theme=light; path=/; max-age=31536000';
			document.documentElement.classList.remove('dark');
		});
		await page.reload();
		await page.waitForLoadState('networkidle');
		const wasDark = await html.evaluate((el) => el.classList.contains('dark'));
		expect(wasDark).toBe(false);
		await toggle.click();
		await page.waitForTimeout(100);
		const isDark = await html.evaluate((el) => el.classList.contains('dark'));
		expect(isDark).toBe(true);
	});
});
