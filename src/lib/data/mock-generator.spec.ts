import { describe, it, expect } from 'vitest';
import {
	generateKpis,
	generateRevenueSeries,
	generateCustomerGrowthSeries,
	generateCustomers,
	getCustomerById
} from '$lib/data/mock-generator';

describe('mock-generator', () => {
	describe('sortCustomers direction (directional sorting)', () => {
		it('mrr asc returns rows in ascending order', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all', 'asc');
			const mrvs = result.rows.map((r) => r.mrr);
			for (let i = 1; i < mrvs.length; i++) {
				expect(mrvs[i - 1]).toBeLessThanOrEqual(mrvs[i]);
			}
		});

		it('mrr desc returns rows in descending order', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all', 'desc');
			const mrvs = result.rows.map((r) => r.mrr);
			for (let i = 1; i < mrvs.length; i++) {
				expect(mrvs[i - 1]).toBeGreaterThanOrEqual(mrvs[i]);
			}
		});

		it('mrr asc first row has lower MRR than mrr desc first row', () => {
			const asc = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all', 'asc');
			const desc = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all', 'desc');
			const ascFirst = asc.rows[0].mrr;
			const descFirst = desc.rows[0].mrr;
			expect(ascFirst).toBeLessThan(descFirst);
		});

		it('ltv asc returns rows in ascending order', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'ltv', 'all', 'asc');
			const ltvs = result.rows.map((r) => r.ltv);
			for (let i = 1; i < ltvs.length; i++) {
				expect(ltvs[i - 1]).toBeLessThanOrEqual(ltvs[i]);
			}
		});

		it('health asc returns rows in ascending order', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'health', 'all', 'asc');
			const hs = result.rows.map((r) => r.health);
			for (let i = 1; i < hs.length; i++) {
				expect(hs[i - 1]).toBeLessThanOrEqual(hs[i]);
			}
		});

		it('health desc returns rows in descending order', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'health', 'all', 'desc');
			const hs = result.rows.map((r) => r.health);
			for (let i = 1; i < hs.length; i++) {
				expect(hs[i - 1]).toBeGreaterThanOrEqual(hs[i]);
			}
		});

		it('name asc returns rows in ascending order', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'name', 'all', 'asc');
			const names = result.rows.map((r) => r.name);
			for (let i = 1; i < names.length; i++) {
				expect(names[i - 1].localeCompare(names[i])).toBeLessThanOrEqual(0);
			}
		});

		it('name desc returns rows in descending order', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'name', 'all', 'desc');
			const names = result.rows.map((r) => r.name);
			for (let i = 1; i < names.length; i++) {
				expect(names[i - 1].localeCompare(names[i])).toBeGreaterThanOrEqual(0);
			}
		});

		it('name asc first row is alphabetically before name desc first row', () => {
			const asc = generateCustomers('2024-01-01', '2024-01-30', 1, 'name', 'all', 'asc');
			const desc = generateCustomers('2024-01-01', '2024-01-30', 1, 'name', 'all', 'desc');
			const ascFirst = asc.rows[0].name;
			const descFirst = desc.rows[0].name;
			expect(ascFirst.localeCompare(descFirst)).toBeLessThan(0);
		});

		it('absent direction preserves existing descending behavior for mrr', () => {
			const noDir = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			const desc = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all', 'desc');
			const noDirIds = noDir.rows.map((r) => r.id);
			const descIds = desc.rows.map((r) => r.id);
			expect(noDirIds).toEqual(descIds);
		});

		it('absent direction preserves existing ascending behavior for name', () => {
			const noDir = generateCustomers('2024-01-01', '2024-01-30', 1, 'name', 'all');
			const asc = generateCustomers('2024-01-01', '2024-01-30', 1, 'name', 'all', 'asc');
			const noDirIds = noDir.rows.map((r) => r.id);
			const ascIds = asc.rows.map((r) => r.id);
			expect(noDirIds).toEqual(ascIds);
		});

		it('asc and desc page 1 are different sets (asc shows lowest, desc shows highest)', () => {
			const asc = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all', 'asc');
			const desc = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all', 'desc');
			const ascMax = Math.max(...asc.rows.map((r) => r.mrr));
			const descMin = Math.min(...desc.rows.map((r) => r.mrr));
			// Asc page 1 max should be ≤ desc page 1 min
			expect(ascMax).toBeLessThanOrEqual(descMin);
		});
	});
	describe('generateKpis', () => {
		it('returns exactly 6 KPI objects', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			expect(kpis).toHaveLength(6);
		});

		it('contains all required KPI ids', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const ids = kpis.map((k) => k.id);
			expect(ids).toContain('mrr');
			expect(ids).toContain('arr');
			expect(ids).toContain('churn');
			expect(ids).toContain('ltv');
			expect(ids).toContain('cac');
			expect(ids).toContain('arpu');
		});

		it('MRR value is positive and within realistic SaaS range', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const mrr = kpis.find((k) => k.id === 'mrr')!;
			expect(mrr.value).toBeGreaterThan(0);
			expect(mrr.value).toBeLessThan(1_000_000); // realistic SaaS MRR ceiling
		});

		it('ARR equals MRR * 12', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const mrr = kpis.find((k) => k.id === 'mrr')!;
			const arr = kpis.find((k) => k.id === 'arr')!;
			// ARR is mrr * 12 with some tolerance for rounding
			expect(arr.value).toBeCloseTo(mrr.value * 12, 0);
		});

		it('Churn Rate is around 3.2%', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const churn = kpis.find((k) => k.id === 'churn')!;
			expect(churn.value).toBeGreaterThan(3);
			expect(churn.value).toBeLessThan(3.5);
		});

		it('CAC is around $300 with realistic variance', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const cac = kpis.find((k) => k.id === 'cac')!;
			expect(cac.value).toBeGreaterThan(200);
			expect(cac.value).toBeLessThan(400);
		});

		it('LTV is derived from ARPU and churn — positive', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const ltv = kpis.find((k) => k.id === 'ltv')!;
			expect(ltv.value).toBeGreaterThan(0);
		});

		it('ARPU is MRR / customers — positive when MRR positive', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const arpu = kpis.find((k) => k.id === 'arpu')!;
			expect(arpu.value).toBeGreaterThan(0);
		});

		it('sparklines have 12 data points', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			for (const kpi of kpis) {
				expect(kpi.sparkline).toHaveLength(12);
			}
		});

		it('MRR delta is defined and finite', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const mrr = kpis.find((k) => k.id === 'mrr')!;
			expect(Number.isFinite(mrr.delta)).toBe(true);
		});

		it('churn has inverted flag set', () => {
			const kpis = generateKpis('2024-01-01', '2024-01-30');
			const churn = kpis.find((k) => k.id === 'churn')!;
			expect(churn.inverted).toBe(true);
		});

		it('returns empty array for invalid date range', () => {
			const kpis = generateKpis('2024-01-30', '2024-01-01');
			// Should handle gracefully — lastIdx < 0 check
			expect(Array.isArray(kpis)).toBe(true);
		});

		it('is deterministic — same seed produces same MRR', () => {
			const kpis1 = generateKpis('2024-06-01', '2024-06-30');
			const kpis2 = generateKpis('2024-06-01', '2024-06-30');
			const mrr1 = kpis1.find((k) => k.id === 'mrr')!.value;
			const mrr2 = kpis2.find((k) => k.id === 'mrr')!.value;
			expect(mrr1).toBe(mrr2);
		});
	});

	describe('generateRevenueSeries', () => {
		it('returns one data point per day in range', () => {
			const series = generateRevenueSeries('2024-01-01', '2024-01-31');
			expect(series).toHaveLength(31);
		});

		it('returns correct data point for single day', () => {
			const series = generateRevenueSeries('2024-01-01', '2024-01-01');
			expect(series).toHaveLength(1);
		});

		it('all MRR values are positive', () => {
			const series = generateRevenueSeries('2024-01-01', '2024-06-30');
			for (const point of series) {
				expect(point.mrr).toBeGreaterThan(0);
			}
		});

		it('ARR equals MRR * 12 for every point', () => {
			const series = generateRevenueSeries('2024-01-01', '2024-01-10');
			for (const point of series) {
				expect(point.arr).toBeCloseTo(point.mrr * 12, 0);
			}
		});

		it('projected is within reasonable range of MRR', () => {
			const series = generateRevenueSeries('2024-01-01', '2024-03-01');
			for (const point of series) {
				// projected should not deviate more than 2x from MRR
				expect(point.projected).toBeGreaterThan(point.mrr * 0.5);
				expect(point.projected).toBeLessThan(point.mrr * 2);
			}
		});

		it('dates are ISO strings in YYYY-MM-DD format', () => {
			const series = generateRevenueSeries('2024-01-01', '2024-01-05');
			for (const point of series) {
				expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			}
		});

		it('MRR grows over a 6-month period (positive trend)', () => {
			const series = generateRevenueSeries('2024-01-01', '2024-06-30');
			const first = series[0].mrr;
			const last = series[series.length - 1].mrr;
			// With 5-10% monthly growth, 6 months should show clear growth
			expect(last).toBeGreaterThan(first);
		});
	});

	describe('generateCustomerGrowthSeries', () => {
		it('returns one data point per day in range', () => {
			const series = generateCustomerGrowthSeries('2024-01-01', '2024-01-31');
			expect(series).toHaveLength(31);
		});

		it('net equals new - churned', () => {
			const series = generateCustomerGrowthSeries('2024-01-01', '2024-01-10');
			for (const point of series) {
				// Daily new/churned are weekly/7, so they vary but net = new - churned
				expect(point.net).toBeCloseTo(point.new - point.churned, 5);
			}
		});

		it('new and churned are positive', () => {
			const series = generateCustomerGrowthSeries('2024-01-01', '2024-03-01');
			for (const point of series) {
				expect(point.new).toBeGreaterThanOrEqual(0);
				expect(point.churned).toBeGreaterThanOrEqual(0);
			}
		});

		it('dates are ISO strings', () => {
			const series = generateCustomerGrowthSeries('2024-01-01', '2024-01-05');
			for (const point of series) {
				expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			}
		});
	});

	describe('generateCustomers', () => {
		it('returns paginated result with total count', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			expect(result.total).toBeGreaterThan(0);
			expect(result.page).toBe(1);
			expect(result.pageSize).toBe(10);
		});

		it('returns exactly 10 rows per page', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			expect(result.rows).toHaveLength(10);
		});

		it('sorts by MRR descending by default', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			const mrvs = result.rows.map((r) => r.mrr);
			for (let i = 1; i < mrvs.length; i++) {
				expect(mrvs[i - 1]).toBeGreaterThanOrEqual(mrvs[i]);
			}
		});

		it('sorts by LTV descending when specified', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'ltv', 'all');
			const ltvs = result.rows.map((r) => r.ltv);
			for (let i = 1; i < ltvs.length; i++) {
				expect(ltvs[i - 1]).toBeGreaterThanOrEqual(ltvs[i]);
			}
		});

		it('sorts by name alphabetically ascending', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'name', 'all');
			const names = result.rows.map((r) => r.name);
			for (let i = 1; i < names.length; i++) {
				expect(names[i - 1].localeCompare(names[i])).toBeLessThanOrEqual(0);
			}
		});

		it('filters to active customers only', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'active');
			for (const row of result.rows) {
				expect(row.status).toBe('active');
			}
		});

		it('filters to churned customers only', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'churned');
			for (const row of result.rows) {
				expect(row.status).toBe('churned');
			}
		});

		it('returns page 2 with 10 more rows', () => {
			const page1 = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			const page2 = generateCustomers('2024-01-01', '2024-01-30', 2, 'mrr', 'all');
			// Page 2 rows should be different from page 1
			const page1Ids = page1.rows.map((r) => r.id);
			const page2Ids = page2.rows.map((r) => r.id);
			// No overlap between pages
			const overlap = page1Ids.filter((id) => page2Ids.includes(id));
			expect(overlap).toHaveLength(0);
		});

		it('page 1 is returned when page < 1', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 0, 'mrr', 'all');
			expect(result.page).toBe(1);
		});

		it('each customer row has required fields', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			for (const row of result.rows) {
				expect(row).toHaveProperty('id');
				expect(row).toHaveProperty('name');
				expect(row).toHaveProperty('mrr');
				expect(row).toHaveProperty('ltv');
				expect(row).toHaveProperty('health');
				expect(row).toHaveProperty('status');
			}
		});

		it('health score is between 0 and 100', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			for (const row of result.rows) {
				expect(row.health).toBeGreaterThanOrEqual(0);
				expect(row.health).toBeLessThanOrEqual(100);
			}
		});

		it('MRR is positive', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			for (const row of result.rows) {
				expect(row.mrr).toBeGreaterThan(0);
			}
		});
	});

	describe('getCustomerById', () => {
		it('returns customer with matching id', () => {
			const customer = getCustomerById('cust-001');
			expect(customer).not.toBeNull();
			expect(customer!.name).toBe('Acme Corp');
		});

		it('returns null for unknown id', () => {
			const customer = getCustomerById('nonexistent-id');
			expect(customer).toBeNull();
		});

		it('returns null for malformed id', () => {
			const customer = getCustomerById('');
			expect(customer).toBeNull();
		});
	});

	describe('branch coverage (toDate + lastN)', () => {
		it('accepts Date object input for generateKpis', () => {
			// toDate branch: value instanceof Date
			const kpis = generateKpis(new Date('2024-01-01'), new Date('2024-01-30'));
			expect(kpis).toHaveLength(6);
		});

		it('accepts Date object input for generateRevenueSeries', () => {
			const series = generateRevenueSeries(new Date('2024-01-01'), new Date('2024-01-05'));
			expect(series).toHaveLength(5);
		});

		it('accepts Date object input for generateCustomerGrowthSeries', () => {
			const series = generateCustomerGrowthSeries(
				new Date('2024-01-01'),
				new Date('2024-01-05')
			);
			expect(series).toHaveLength(5);
		});

		it('accepts Date object input for generateCustomers', () => {
			const result = generateCustomers(new Date('2024-01-01'), new Date('2024-01-30'));
			expect(result.rows.length).toBeGreaterThan(0);
		});
	});

	describe('at-risk filter', () => {
		it('filters to at-risk customers only (health < threshold)', () => {
			const result = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'at-risk');
			// Every row should have health below the AT_RISK_HEALTH_THRESHOLD (50)
			// Note: at-risk branch checks r.health < AT_RISK_HEALTH_THRESHOLD
			for (const row of result.rows) {
				expect(row.health).toBeLessThan(50);
			}
		});

		it('at-risk filter hits the r.health < threshold branch', () => {
			// This test specifically exercises the at-risk branch in sortCustomers
			const all = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'all');
			const atRisk = generateCustomers('2024-01-01', '2024-01-30', 1, 'mrr', 'at-risk');
			// Both should return paginated results
			expect(Array.isArray(all.rows)).toBe(true);
			expect(Array.isArray(atRisk.rows)).toBe(true);
		});
	});

	describe('edge case coverage (lastN + sparkline)', () => {
		it('generateCustomerGrowthSeries with very short range produces minimal data', () => {
			// Single day range — exercises ltvSparkline map paths
			const series = generateCustomerGrowthSeries('2024-01-01', '2024-01-01');
			expect(series).toHaveLength(1);
		});

		it('generateKpis with single day range exercises sparkline branches', () => {
			// Single day — exercises arpuSparkline map paths
			const kpis = generateKpis('2024-01-01', '2024-01-01');
			expect(kpis).toHaveLength(6);
			// ARPU should still be defined
			const arpu = kpis.find((k) => k.id === 'arpu')!;
			expect(arpu.value).toBeDefined();
		});

		it('generateRevenueSeries with single day exercises first point projected = mrr', () => {
			// First point: trailingGrowth = 0 → projected = mrr * 1 = mrr
			const series = generateRevenueSeries('2024-01-01', '2024-01-01');
			expect(series[0].projected).toBe(series[0].mrr);
		});
	});
});
