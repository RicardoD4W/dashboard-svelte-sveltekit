import type { SortDir } from '$lib/types/metrics';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): Date {
	const d = new Date(date);
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

function isoDateString(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export type RangePresetId = '7d' | '30d' | '90d' | 'ytd' | 'all';

export interface RangePreset {
	id: RangePresetId;
	label: string;
	days: number;
	ytd?: boolean;
}

export const RANGE_PRESETS: ReadonlyArray<RangePreset> = [
	{ id: '7d', label: '7d', days: 7 },
	{ id: '30d', label: '30d', days: 30 },
	{ id: '90d', label: '90d', days: 90 },
	{ id: 'ytd', label: 'YTD', days: 0, ytd: true },
	{ id: 'all', label: 'All', days: 365 }
];

export function computePresetRange(id: RangePresetId, today: Date): { from: Date; to: Date } {
	const to = startOfUtcDay(today);
	let from: Date;
	if (id === 'ytd') {
		from = new Date(Date.UTC(to.getUTCFullYear(), 0, 1));
	} else {
		const days = RANGE_PRESETS.find((p) => p.id === id)?.days ?? 30;
		from = new Date(to.getTime() - (days - 1) * MS_PER_DAY);
	}
	if (from.getTime() > to.getTime()) from = to;
	return { from, to };
}

export function detectPreset(
	from: Date,
	to: Date,
	today: Date
): RangePresetId | 'custom' | 'default' {
	for (const p of RANGE_PRESETS) {
		const range = computePresetRange(p.id, today);
		if (range.from.getTime() === from.getTime() && range.to.getTime() === to.getTime()) {
			return p.id;
		}
	}
	return 'custom';
}

export function parseDateRange(url: URL, defaultDays: number): { from: Date; to: Date } {
	const today = startOfUtcDay(new Date());

	const rawFrom = url.searchParams.get('from');
	const rawTo = url.searchParams.get('to');

	const to = rawTo ? new Date(rawTo) : today;
	const from = rawFrom
		? new Date(rawFrom)
		: new Date(today.getTime() - (defaultDays - 1) * MS_PER_DAY);

	const validFrom = Number.isFinite(from.getTime())
		? startOfUtcDay(from)
		: new Date(today.getTime() - (defaultDays - 1) * MS_PER_DAY);
	const validTo = Number.isFinite(to.getTime()) ? startOfUtcDay(to) : today;

	return {
		from: validFrom.getTime() <= validTo.getTime() ? validFrom : validTo,
		to: validTo
	};
}

export function resolveRangePreset(
	url: URL,
	defaultDays: number
): { from: Date; to: Date; rangeId: RangePresetId | 'custom' | 'default' } {
	const today = startOfUtcDay(new Date());

	const presetRaw = url.searchParams.get('range') as RangePresetId | null;
	if (presetRaw && RANGE_PRESETS.some((p) => p.id === presetRaw)) {
		const range = computePresetRange(presetRaw, today);
		return { from: range.from, to: range.to, rangeId: presetRaw };
	}

	const { from, to } = parseDateRange(url, defaultDays);
	const rangeId = detectPreset(from, to, today);
	return { from, to, rangeId };
}

export function parseIsoDate(date: Date): string {
	return isoDateString(date);
}

export function parsePage(url: URL): number {
	const raw = url.searchParams.get('page');
	const n = raw ? Number.parseInt(raw, 10) : 1;
	if (!Number.isFinite(n) || n < 1) return 1;
	return n;
}

export function parseSort<T extends string>(url: URL, allowed: readonly T[], defaultSort: T): T {
	const raw = url.searchParams.get('sort');
	if (raw && (allowed as readonly string[]).includes(raw)) {
		return raw as T;
	}
	return defaultSort;
}

export function parseSortDir(url: URL): SortDir | undefined {
	const raw = url.searchParams.get('dir');
	if (raw === 'asc' || raw === 'desc') {
		return raw;
	}
	return undefined;
}

export function parseStatus<T extends string>(
	url: URL,
	allowed: readonly T[],
	defaultStatus: T
): T {
	const raw = url.searchParams.get('status');
	if (raw && (allowed as readonly string[]).includes(raw)) {
		return raw as T;
	}
	return defaultStatus;
}
