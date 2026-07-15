import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateCustomers } from '$lib/data/mock-generator';
import type {
	ApiEnvelope,
	CustomerFilterStatus,
	CustomerSort,
	Paginated,
	CustomerRow
} from '$lib/types/metrics';
import {
	parseDateRange,
	parseIsoDate,
	parsePage,
	parseSort,
	parseStatus
} from '$lib/server/query-params';

const VALID_SORTS: readonly CustomerSort[] = ['mrr', 'ltv', 'health', 'name'];
const VALID_STATUSES: readonly CustomerFilterStatus[] = [
	'all',
	'active',
	'trial',
	'churned',
	'at-risk'
];

export const GET: RequestHandler = ({ url }) => {
	const { from, to } = parseDateRange(url, 30);
	const page = parsePage(url);
	const sort = parseSort(url, VALID_SORTS, 'mrr');
	const status = parseStatus(url, VALID_STATUSES, 'all');

	try {
		const data = generateCustomers(from, to, page, sort, status) satisfies Paginated<CustomerRow>;
		const envelope: ApiEnvelope<Paginated<CustomerRow>> = {
			data,
			meta: {
				from: parseIsoDate(from),
				to: parseIsoDate(to),
				generatedAt: new Date().toISOString()
			}
		};
		return json(envelope);
	} catch {
		throw error(500, 'Failed to generate customers');
	}
};
