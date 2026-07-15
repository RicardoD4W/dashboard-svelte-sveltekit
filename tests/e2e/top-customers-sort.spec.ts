import { test, expect } from '@playwright/test';

// Scope all locators to the Top customers table to avoid conflicts with Revenue chart toggles
function topCustomersTable(page: import('@playwright/test').Page) {
	return page.getByRole('heading', { name: 'Top customers' }).locator('..').locator('..');
}

test.describe('Top Customers Table — 3-state sort cycle', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('default state: no column shows a direction indicator', async ({ page }) => {
		// MRR is the default sort, no dir param → no arrow shown
		const table = topCustomersTable(page);
		const mrrHeader = table.getByRole('button', { name: /^MRR/ });
		await expect(mrrHeader).toBeVisible();
		await expect(mrrHeader).not.toContainText('↑');
		await expect(mrrHeader).not.toContainText('↓');
	});

	test('first click on MRR sets dir=asc in URL and shows ↑', async ({ page }) => {
		const table = topCustomersTable(page);
		await table.getByRole('button', { name: /^MRR/ }).click();
		await expect(page).toHaveURL(/sort=mrr/);
		await expect(page).toHaveURL(/dir=asc/);

		const mrrHeader = table.getByRole('button', { name: /^MRR/ });
		await expect(mrrHeader).toContainText('↑');
	});

	test('second click on MRR sets dir=desc and shows ↓', async ({ page }) => {
		const table = topCustomersTable(page);
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=asc/);
		await table.getByRole('button', { name: /^MRR/ }).click();
		await expect(page).toHaveURL(/dir=desc/);

		const mrrHeader = table.getByRole('button', { name: /^MRR/ });
		await expect(mrrHeader).toContainText('↓');
	});

	test('third click on MRR removes dir param and clears arrow', async ({ page }) => {
		const table = topCustomersTable(page);
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=asc/);
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=desc/);
		await table.getByRole('button', { name: /^MRR/ }).click();

		// Wait for navigation away from dir=desc to complete
		await page.waitForURL((url) => !url.toString().includes('dir='), { timeout: 5000 });

		// Third click: both sort and dir removed — back to default (no sort params)
		const url = page.url();
		expect(url).not.toMatch(/sort=/);
		expect(url).not.toMatch(/dir=/);

		const mrrHeader = table.getByRole('button', { name: /^MRR/ });
		await expect(mrrHeader).not.toContainText('↑');
		await expect(mrrHeader).not.toContainText('↓');
	});

	test('clicking a different column starts at asc', async ({ page }) => {
		const table = topCustomersTable(page);
		// First click MRR twice to set desc
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=asc/);
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=desc/);

		// Now click LTV — should switch to LTV asc, MRR arrow gone
		await table.getByRole('button', { name: /^LTV/ }).click();
		await expect(page).toHaveURL(/sort=ltv/);
		await expect(page).toHaveURL(/dir=asc/);

		const ltvHeader = table.getByRole('button', { name: /^LTV/ });
		await expect(ltvHeader).toContainText('↑');

		// MRR no longer has indicator (different column is active)
		const mrrHeader = table.getByRole('button', { name: /^MRR/ });
		await expect(mrrHeader).not.toContainText('↑');
		await expect(mrrHeader).not.toContainText('↓');
	});

	test('URL with dir=asc shows ↑ on the matching column', async ({ page }) => {
		await page.goto('/?sort=mrr&dir=asc');
		const table = topCustomersTable(page);
		const mrrHeader = table.getByRole('button', { name: /^MRR/ });
		await expect(mrrHeader).toContainText('↑');
	});

	test('URL with dir=desc shows ↓ on the matching column', async ({ page }) => {
		await page.goto('/?sort=mrr&dir=desc');
		const table = topCustomersTable(page);
		const mrrHeader = table.getByRole('button', { name: /^MRR/ });
		await expect(mrrHeader).toContainText('↓');
	});

	test('arrow follows URL, not local state — direct URL navigation reflects in UI', async ({
		page
	}) => {
		// Set state via clicks
		const table = topCustomersTable(page);
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=asc/);
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=desc/);

		// Go to a fresh URL state and verify UI updates (no stale local state)
		await page.goto('/?sort=mrr&dir=asc');
		const mrrHeader = table.getByRole('button', { name: /^MRR/ });
		await expect(mrrHeader).toContainText('↑');
	});

	test('sorting after pagination preserves page when cycling direction on same column', async ({
		page
	}) => {
		const table = topCustomersTable(page);
		// Navigate to page 2
		await page.goto('/?page=2');
		await page.waitForURL(/page=2/);

		// Sort by MRR asc — page should be preserved (asc is first click, resets page)
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=asc/);
		await page.waitForURL(/page=2/); // page preserved on first click (same column)

		// Cycle to desc — page should STILL be preserved
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL(/dir=desc/);
		await page.waitForURL(/page=2/); // page preserved when cycling direction

		// Cycle back to default — page is still relevant (page 2 of default MRR desc), preserve it
		await table.getByRole('button', { name: /^MRR/ }).click();
		await page.waitForURL((url) => !url.toString().includes('dir='));
		await page.waitForURL(/page=2/); // page preserved when returning to default sort
	});
});
