const SEED = 42;

function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return function rand(): number {
		a = (a + 0x6d2b79f5) | 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	};
}

import type {
	Kpi,
	RevenuePoint,
	GrowthPoint,
	CustomerRow,
	CustomerStatus,
	CustomerSort,
	CustomerFilterStatus,
	Paginated
} from '$lib/types/metrics';
import { AT_RISK_HEALTH_THRESHOLD } from '$lib/types/metrics';

export type {
	Kpi,
	RevenuePoint,
	GrowthPoint,
	CustomerRow,
	CustomerStatus,
	CustomerSort,
	CustomerFilterStatus,
	Paginated
};
export { AT_RISK_HEALTH_THRESHOLD };

type DateInput = Date | string;

function toDate(value: DateInput): Date {
	return value instanceof Date ? value : new Date(value);
}

function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function eachDay(from: Date, to: Date): Date[] {
	const days: Date[] = [];
	const cursor = new Date(from);
	cursor.setUTCHours(0, 0, 0, 0);
	const end = new Date(to);
	end.setUTCHours(0, 0, 0, 0);
	while (cursor.getTime() <= end.getTime()) {
		days.push(new Date(cursor));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	return days;
}

interface MrrPoint {
	date: Date;
	mrr: number;
}

interface CustomerPoint {
	date: Date;
	customers: number;
	weeklyNew: number;
	weeklyChurned: number;
}

function buildMrrSeries(from: Date, to: Date): MrrPoint[] {
	const rng = mulberry32(SEED);
	const days = eachDay(from, to);

	const monthlyGrowth = 0.05 + rng() * 0.05;
	const dailyGrowth = Math.pow(1 + monthlyGrowth, 1 / 30) - 1;

	let mrr = 45_000;
	return days.map((date) => {
		const noise = (rng() - 0.5) * 0.015;
		mrr = mrr * (1 + dailyGrowth + noise);
		return { date, mrr: Math.max(0, mrr) };
	});
}

function buildCustomerSeries(from: Date, to: Date): CustomerPoint[] {
	const rng = mulberry32(SEED + 1);
	const days = eachDay(from, to);

	let customers = 120;
	let weeklyNew = 8;
	let weeklyChurned = 3;

	return days.map((date, i) => {
		if (i > 0 && i % 7 === 0) {
			weeklyNew = Math.max(1, Math.round(8 + (rng() - 0.5) * 4)); // 6..10
			weeklyChurned = Math.max(1, Math.round(3 + (rng() - 0.5) * 2)); // 2..4
		}
		const dailyNew = weeklyNew / 7;
		const dailyChurned = weeklyChurned / 7;
		customers = Math.max(0, customers + dailyNew - dailyChurned);
		return { date, customers, weeklyNew, weeklyChurned };
	});
}

function pctDelta(current: number, prior: number): number {
	if (prior === 0) return 0;
	return ((current - prior) / prior) * 100;
}

function lastN<T>(arr: T[], n: number): T[] {
	return arr.length <= n ? arr.slice() : arr.slice(arr.length - n);
}

export function generateKpis(from: DateInput, to: DateInput): Kpi[] {
	const fromDate = toDate(from);
	const toDate_ = toDate(to);
	const mrrSeries = buildMrrSeries(fromDate, toDate_);
	const custSeries = buildCustomerSeries(fromDate, toDate_);

	const lastIdx = mrrSeries.length - 1;
	if (lastIdx < 0) return [];

	const mrrCurrent = mrrSeries[lastIdx].mrr;
	const customersCurrent = custSeries[lastIdx].customers;

	const midIdx = Math.max(0, Math.floor(lastIdx / 2));
	const mrrPrior = mrrSeries[midIdx].mrr;
	const customersPrior = custSeries[midIdx].customers;

	const churnRate = 0.032;
	const cac = 300 * (0.9 + mulberry32(SEED + 2)() * 0.2);
	const arr = mrrCurrent * 12;
	const arpu = customersCurrent > 0 ? mrrCurrent / customersCurrent : 0;
	const ltv = churnRate > 0 ? arpu / churnRate : 0;

	const mrrSparkline = lastN(mrrSeries, 12).map((p) => p.mrr);
	const arrSparkline = mrrSparkline.map((v) => v * 12);

	const churnRng = mulberry32(SEED + 3);
	const churnSparkline = Array.from({ length: 12 }, () => 0.028 + churnRng() * 0.01);

	const cacRng = mulberry32(SEED + 4);
	const cacSparkline = Array.from({ length: 12 }, () => 300 * (0.9 + cacRng() * 0.2));

	const arpuSparkline = lastN(custSeries, 12).map((p, i) => {
		const mrrPoint = mrrSeries[mrrSeries.length - 12 + i];
		if (!mrrPoint || p.customers === 0) return 0;
		return mrrPoint.mrr / p.customers;
	});

	const ltvSparkline = churnSparkline.map((c, i) => (c > 0 ? (arpuSparkline[i] ?? arpu) / c : 0));

	return [
		{
			id: 'mrr',
			label: 'MRR',
			value: mrrCurrent,
			delta: pctDelta(mrrCurrent, mrrPrior),
			sparkline: mrrSparkline
		},
		{
			id: 'arr',
			label: 'ARR',
			value: arr,
			delta: pctDelta(arr, mrrPrior * 12),
			sparkline: arrSparkline
		},
		{
			id: 'churn',
			label: 'Churn Rate',
			value: churnRate * 100,
			delta: pctDelta(churnRate, churnRate * 0.95),
			sparkline: churnSparkline,
			inverted: true
		},
		{
			id: 'ltv',
			label: 'LTV',
			value: ltv,
			delta: pctDelta(ltv, ltv * 0.92),
			sparkline: ltvSparkline
		},
		{
			id: 'cac',
			label: 'CAC',
			value: cac,
			delta: pctDelta(cac, cac * 0.97),
			sparkline: cacSparkline
		},
		{
			id: 'arpu',
			label: 'ARPU',
			value: arpu,
			delta: pctDelta(arpu, arpu * 0.94),
			sparkline: arpuSparkline
		}
	];
}

export function generateRevenueSeries(from: DateInput, to: DateInput): RevenuePoint[] {
	const mrrSeries = buildMrrSeries(toDate(from), toDate(to));
	return mrrSeries.map((p, i) => {
		const trailingGrowth = i === 0 ? 0 : (p.mrr - mrrSeries[i - 1].mrr) / mrrSeries[i - 1].mrr;
		const projected = p.mrr * (1 + trailingGrowth);
		return {
			date: isoDate(p.date),
			mrr: p.mrr,
			arr: p.mrr * 12,
			projected
		};
	});
}

export function generateCustomerGrowthSeries(from: DateInput, to: DateInput): GrowthPoint[] {
	const custSeries = buildCustomerSeries(toDate(from), toDate(to));
	return custSeries.map((p) => {
		const newCustomers = p.weeklyNew / 7;
		const churned = p.weeklyChurned / 7;
		return {
			date: isoDate(p.date),
			new: newCustomers,
			churned,
			net: newCustomers - churned
		};
	});
}

const COMPANY_NAMES = [
	'Acme Corp',
	'Globex',
	'Initech',
	'Umbrella',
	'Stark Industries',
	'Wayne Enterprises',
	'Wonka Industries',
	'Cyberdyne',
	'Tyrell Corp',
	'Soylent',
	'Pied Piper',
	'Hooli',
	'Massive Dynamic',
	'Vandelay',
	'Dunder Mifflin',
	'Sterling Cooper',
	'Vehement Capital',
	'Sirius Cybernetics',
	'Buy n Large',
	'Spacely Sprockets',
	'Cogswell Cogs',
	'Bluth Company',
	'Pearson Hardman',
	'Pendant Publishing',
	'Kruger Industrial',
	'Oscorp',
	'Roxxon',
	'Aperture Science',
	'Black Mesa',
	'Weyland-Yutani',
	'InGen',
	'Genco',
	'Strickland Propane',
	'Krusty Krab',
	'Los Pollos',
	'Vought International',
	'LexCorp',
	'Daily Planet',
	'Gekko & Co',
	'Yoyodyne',
	'Lumon',
	'Rekall',
	'Nakatomi Trading',
	'OCP',
	'Pendant Energy'
];

export function generateCustomers(
	from: DateInput,
	to: DateInput,
	page = 1,
	sort: CustomerSort = 'mrr',
	status: CustomerFilterStatus = 'all'
): Paginated<CustomerRow> {
	const pageSize = 10;
	void from;
	void to;

	const sorted = sortCustomers(generateAllCustomers(), sort, status);
	const total = sorted.length;
	const safePage = Math.max(1, page);
	const start = (safePage - 1) * pageSize;
	return {
		rows: sorted.slice(start, start + pageSize),
		total,
		page: safePage,
		pageSize
	};
}

export function getCustomerById(id: string): CustomerRow | null {
	return generateAllCustomers().find((r) => r.id === id) ?? null;
}

function generateAllCustomers(): CustomerRow[] {
	const rng = mulberry32(SEED + 5);
	return COMPANY_NAMES.map((name, i) => {
		const mrr = Math.round(150 + rng() * 5_000); // $150..$5,150
		const churnRate = 0.032;
		const ltv = churnRate > 0 ? Math.round((mrr / churnRate) * (1 / 12)) : 0; // monthly MRR / churn
		const health = Math.round(20 + rng() * 80); // 20..100
		const statusRoll = rng();
		const rowStatus: CustomerStatus =
			statusRoll > 0.85 ? 'churned' : statusRoll > 0.7 ? 'trial' : 'active';
		return {
			id: `cust-${String(i + 1).padStart(3, '0')}`,
			name,
			mrr,
			ltv,
			health,
			status: rowStatus
		};
	});
}

function sortCustomers(
	rows: CustomerRow[],
	sort: CustomerSort,
	status: CustomerFilterStatus
): CustomerRow[] {
	const filtered =
		status === 'all'
			? rows
			: rows.filter((r) =>
					status === 'at-risk' ? r.health < AT_RISK_HEALTH_THRESHOLD : r.status === status
				);

	return filtered.slice().sort((a, b) => {
		if (sort === 'name') return a.name.localeCompare(b.name);
		return (b[sort] as number) - (a[sort] as number);
	});
}
