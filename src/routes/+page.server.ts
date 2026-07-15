import type { PageServerLoad } from './$types';
import {
	generateKpis,
	generateRevenueSeries,
	generateCustomerGrowthSeries,
	generateCustomers
} from '$lib/data/mock-generator';
import type {
	Kpi,
	RevenuePoint,
	GrowthPoint,
	Paginated,
	CustomerRow,
	CustomerSort,
	CustomerFilterStatus
} from '$lib/types/metrics';
import {
	parseIsoDate,
	parsePage,
	parseSort,
	parseStatus,
	resolveRangePreset,
	RANGE_PRESETS,
	computePresetRange,
	type RangePresetId
} from '$lib/server/query-params';

const VALID_SORTS: readonly CustomerSort[] = ['mrr', 'ltv', 'health', 'name'];
const VALID_STATUSES: readonly CustomerFilterStatus[] = [
	'all',
	'active',
	'trial',
	'churned',
	'at-risk'
];

const DEFAULT_RANGE_DAYS = 30;

export const load: PageServerLoad = ({ url }) => {
	const today = new Date();
	const { from, to, rangeId } = resolveRangePreset(url, DEFAULT_RANGE_DAYS);

	const page = parsePage(url);
	const sort = parseSort(url, VALID_SORTS, 'mrr');
	const status = parseStatus(url, VALID_STATUSES, 'all');

	const kpis: Kpi[] = generateKpis(from, to);
	const revenue: RevenuePoint[] = generateRevenueSeries(from, to);
	const growth: GrowthPoint[] = generateCustomerGrowthSeries(from, to);
	const customers: Paginated<CustomerRow> = generateCustomers(from, to, page, sort, status);

	const presets = RANGE_PRESETS.map((p) => {
		const range = computePresetRange(p.id, today);
		return {
			id: p.id,
			label: p.label,
			from: parseIsoDate(range.from),
			to: parseIsoDate(range.to)
		};
	});

	return {
		range: {
			from: parseIsoDate(from),
			to: parseIsoDate(to),
			rangeId: rangeId satisfies RangePresetId | 'custom' | 'default',
			page,
			sort,
			status
		},
		presets,
		kpis,
		revenue,
		growth,
		customers
	};
};
