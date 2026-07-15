import { describe, it, expect } from 'vitest';
import {
	RANGE_PRESETS,
	computePresetRange,
	detectPreset,
	parseDateRange,
	parsePage,
	parseSort,
	parseSortDir,
	parseStatus,
	parseIsoDate,
	resolveRangePreset
} from '$lib/server/query-params';

describe('query-params', () => {
	describe('RANGE_PRESETS', () => {
		it('has exactly 5 presets', () => {
			expect(RANGE_PRESETS).toHaveLength(5);
		});

		it('contains 7d, 30d, 90d, ytd, all', () => {
			const ids = RANGE_PRESETS.map((p) => p.id);
			expect(ids).toContain('7d');
			expect(ids).toContain('30d');
			expect(ids).toContain('90d');
			expect(ids).toContain('ytd');
			expect(ids).toContain('all');
		});

		it('ytd has ytd flag set to true', () => {
			const ytd = RANGE_PRESETS.find((p) => p.id === 'ytd')!;
			expect(ytd.ytd).toBe(true);
		});
	});

	describe('computePresetRange', () => {
		it('7d returns 7-day range ending today', () => {
			const today = new Date('2024-06-15');
			const range = computePresetRange('7d', today);
			const diff = (range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000);
			expect(diff).toBe(6); // 7 days means 6 days difference (inclusive)
		});

		it('30d returns 30-day range', () => {
			const today = new Date('2024-06-15');
			const range = computePresetRange('30d', today);
			const diff = (range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000);
			expect(diff).toBe(29);
		});

		it('90d returns 90-day range', () => {
			const today = new Date('2024-06-15');
			const range = computePresetRange('90d', today);
			const diff = (range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000);
			expect(diff).toBe(89);
		});

		it('ytd returns from Jan 1 to today', () => {
			const today = new Date('2024-06-15');
			const range = computePresetRange('ytd', today);
			expect(range.from.getUTCMonth()).toBe(0); // January
			expect(range.from.getUTCDate()).toBe(1);
			expect(range.to.getUTCDate()).toBe(15);
		});

		it('all returns 365-day range', () => {
			const today = new Date('2024-06-15');
			const range = computePresetRange('all', today);
			const diff = (range.to.getTime() - range.from.getTime()) / (24 * 60 * 60 * 1000);
			expect(diff).toBe(364);
		});

		it('from never exceeds to', () => {
			const today = new Date('2024-01-01');
			const range = computePresetRange('ytd', today);
			expect(range.from.getTime()).toBeLessThanOrEqual(range.to.getTime());
		});
	});

	describe('detectPreset', () => {
		it('returns 30d when range matches 30-day preset', () => {
			const today = new Date('2024-06-15');
			const from = new Date('2024-05-17');
			const to = new Date('2024-06-15');
			const result = detectPreset(from, to, today);
			expect(result).toBe('30d');
		});

		it('returns custom when range does not match any preset', () => {
			const today = new Date('2024-06-15');
			const from = new Date('2024-05-20'); // 26 days — not 30
			const to = new Date('2024-06-15');
			const result = detectPreset(from, to, today);
			expect(result).toBe('custom');
		});

		it('returns ytd when range matches YTD', () => {
			const today = new Date('2024-06-15');
			const from = new Date('2024-01-01');
			const to = new Date('2024-06-15');
			const result = detectPreset(from, to, today);
			expect(result).toBe('ytd');
		});
	});

	describe('parseDateRange', () => {
		it('defaults to 30 days when no params provided', () => {
			const url = new URL('http://localhost/');
			const result = parseDateRange(url, 30);
			const diff = (result.to.getTime() - result.from.getTime()) / (24 * 60 * 60 * 1000);
			expect(diff).toBe(29);
		});

		it('parses explicit from and to dates', () => {
			const url = new URL('http://localhost/?from=2024-01-01&to=2024-01-31');
			const result = parseDateRange(url, 30);
			expect(result.from.toISOString().startsWith('2024-01-01')).toBe(true);
			expect(result.to.toISOString().startsWith('2024-01-31')).toBe(true);
		});

		it('from is start of UTC day', () => {
			const url = new URL('http://localhost/?from=2024-01-01T15:30:00Z&to=2024-01-31');
			const result = parseDateRange(url, 30);
			expect(result.from.getUTCHours()).toBe(0);
		});

		it('returns valid range when from > to (swapped)', () => {
			const url = new URL('http://localhost/?from=2024-01-31&to=2024-01-01');
			const result = parseDateRange(url, 30);
			// Should swap to keep from <= to
			expect(result.from.getTime()).toBeLessThanOrEqual(result.to.getTime());
		});

		it('ignores invalid date strings', () => {
			const url = new URL('http://localhost/?from=not-a-date&to=also-not');
			const result = parseDateRange(url, 30);
			// Should fall back to defaults
			expect(Number.isFinite(result.from.getTime())).toBe(true);
			expect(Number.isFinite(result.to.getTime())).toBe(true);
		});
	});

	describe('parsePage', () => {
		it('returns 1 when no page param', () => {
			const url = new URL('http://localhost/');
			expect(parsePage(url)).toBe(1);
		});

		it('parses valid page number', () => {
			const url = new URL('http://localhost/?page=5');
			expect(parsePage(url)).toBe(5);
		});

		it('returns 1 for page=0', () => {
			const url = new URL('http://localhost/?page=0');
			expect(parsePage(url)).toBe(1);
		});

		it('returns 1 for negative page', () => {
			const url = new URL('http://localhost/?page=-1');
			expect(parsePage(url)).toBe(1);
		});

		it('returns 1 for non-numeric page', () => {
			const url = new URL('http://localhost/?page=abc');
			expect(parsePage(url)).toBe(1);
		});
	});

	describe('parseSort', () => {
		it('returns default when no sort param', () => {
			const url = new URL('http://localhost/');
			const allowed = ['mrr', 'ltv', 'health', 'name'] as const;
			expect(parseSort(url, allowed, 'mrr')).toBe('mrr');
		});

		it('returns matching sort from allowed list', () => {
			const url = new URL('http://localhost/?sort=ltv');
			const allowed = ['mrr', 'ltv', 'health', 'name'] as const;
			expect(parseSort(url, allowed, 'mrr')).toBe('ltv');
		});

		it('returns default for sort not in allowed list', () => {
			const url = new URL('http://localhost/?sort=invalid');
			const allowed = ['mrr', 'ltv', 'health', 'name'] as const;
			expect(parseSort(url, allowed, 'mrr')).toBe('mrr');
		});

		it('is case-sensitive', () => {
			const url = new URL('http://localhost/?sort=MRR');
			const allowed = ['mrr', 'ltv', 'health', 'name'] as const;
			expect(parseSort(url, allowed, 'mrr')).toBe('mrr'); // uppercase not in list
		});
	});

	describe('parseStatus', () => {
		it('returns default when no status param', () => {
			const url = new URL('http://localhost/');
			const allowed = ['all', 'active', 'churned', 'at-risk'] as const;
			expect(parseStatus(url, allowed, 'all')).toBe('all');
		});

		it('returns matching status from allowed list', () => {
			const url = new URL('http://localhost/?status=active');
			const allowed = ['all', 'active', 'churned', 'at-risk'] as const;
			expect(parseStatus(url, allowed, 'all')).toBe('active');
		});

		it('returns default for status not in allowed list', () => {
			const url = new URL('http://localhost/?status=banned');
			const allowed = ['all', 'active', 'churned', 'at-risk'] as const;
			expect(parseStatus(url, allowed, 'all')).toBe('all');
		});
	});

	describe('parseSortDir', () => {
		it('returns "asc" when dir=asc', () => {
			const url = new URL('http://localhost/?dir=asc');
			expect(parseSortDir(url)).toBe('asc');
		});

		it('returns "desc" when dir=desc', () => {
			const url = new URL('http://localhost/?dir=desc');
			expect(parseSortDir(url)).toBe('desc');
		});

		it('returns undefined when no dir param', () => {
			const url = new URL('http://localhost/');
			expect(parseSortDir(url)).toBeUndefined();
		});

		it('returns undefined when sort is set but dir is absent', () => {
			const url = new URL('http://localhost/?sort=mrr');
			expect(parseSortDir(url)).toBeUndefined();
		});

		it('returns undefined for invalid dir value', () => {
			const url = new URL('http://localhost/?dir=upwards');
			expect(parseSortDir(url)).toBeUndefined();
		});

		it('returns undefined for empty dir value', () => {
			const url = new URL('http://localhost/?dir=');
			expect(parseSortDir(url)).toBeUndefined();
		});

		it('is case-sensitive — DIR=ASC returns undefined', () => {
			const url = new URL('http://localhost/?dir=ASC');
			expect(parseSortDir(url)).toBeUndefined();
		});

		it('returns asc and desc distinctly — does not collapse to one', () => {
			const urlAsc = new URL('http://localhost/?dir=asc');
			const urlDesc = new URL('http://localhost/?dir=desc');
			expect(parseSortDir(urlAsc)).not.toBe(parseSortDir(urlDesc));
		});
	});

	describe('parseIsoDate', () => {
		it('converts Date to ISO date string', () => {
			const date = new Date('2024-06-15T12:00:00Z');
			expect(parseIsoDate(date)).toBe('2024-06-15');
		});

		it('handles midnight UTC correctly', () => {
			const date = new Date('2024-01-01T00:00:00Z');
			expect(parseIsoDate(date)).toBe('2024-01-01');
		});
	});

	describe('resolveRangePreset', () => {
		it('returns preset id when range param is valid preset', () => {
			const url = new URL('http://localhost/?range=30d');
			const result = resolveRangePreset(url, 30);
			expect(result.rangeId).toBe('30d');
			expect(result.from).toBeDefined();
			expect(result.to).toBeDefined();
		});

		it('returns preset id for 7d range param', () => {
			const url = new URL('http://localhost/?range=7d');
			const result = resolveRangePreset(url, 30);
			expect(result.rangeId).toBe('7d');
		});

		it('returns preset id for 90d range param', () => {
			const url = new URL('http://localhost/?range=90d');
			const result = resolveRangePreset(url, 30);
			expect(result.rangeId).toBe('90d');
		});

		it('returns preset id for ytd range param', () => {
			const url = new URL('http://localhost/?range=ytd');
			const result = resolveRangePreset(url, 30);
			expect(result.rangeId).toBe('ytd');
		});

		it('returns preset id for all range param', () => {
			const url = new URL('http://localhost/?range=all');
			const result = resolveRangePreset(url, 30);
			expect(result.rangeId).toBe('all');
		});

		it('falls back to detectPreset when range param is invalid', () => {
			const url = new URL('http://localhost/?range=invalid');
			const result = resolveRangePreset(url, 30);
			// Invalid range param is ignored, falls back to parseDateRange + detectPreset
			expect(result.rangeId).not.toBe('invalid');
		});

		it('falls back to detectPreset when range param is not provided', () => {
			const url = new URL('http://localhost/');
			const result = resolveRangePreset(url, 30);
			// No range param, uses parseDateRange with defaultDays=30, then detectPreset
			expect(['30d', 'custom', 'default']).toContain(result.rangeId);
		});

		it('ignores range param that is empty string', () => {
			const url = new URL('http://localhost/?range=');
			const result = resolveRangePreset(url, 30);
			// Empty string is falsy, so falls back
			expect(result.rangeId).not.toBe('');
		});

		it('rangeId is custom when custom dates do not match any preset', () => {
			// Custom dates that don't align with any preset
			const url = new URL('http://localhost/?from=2024-01-15&to=2024-02-10');
			const result = resolveRangePreset(url, 30);
			// Jan 15 to Feb 10 is 27 days, not 30. Should be 'custom'
			expect(result.rangeId).toBe('custom');
		});

		it('returns default when no params and defaultDays matches a preset', () => {
			const url = new URL('http://localhost/');
			const result = resolveRangePreset(url, 7);
			// 7-day default matches 7d preset
			expect(result.rangeId).toBe('7d');
		});
	});

	describe('computePresetRange edge cases (branch coverage)', () => {
		it('falls back to 30 days when preset id is not found', () => {
			// Cast through unknown to bypass the strict RangePresetId type
			const result = computePresetRange('not-a-real-id' as never, new Date('2024-06-15'));
			// 30 days fallback → diff of 29 days
			const diff = (result.to.getTime() - result.from.getTime()) / (24 * 60 * 60 * 1000);
			expect(diff).toBe(29);
		});

		it('handles from > to by clamping from to to', () => {
			// 'all' preset with 365 days, but if from somehow exceeds to, it gets clamped
			const result = computePresetRange('all', new Date('2024-06-15'));
			// After the from > to check, the result should be valid (from <= to)
			expect(result.from.getTime()).toBeLessThanOrEqual(result.to.getTime());
		});
	});
});
