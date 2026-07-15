import type { PageServerLoad } from './$types';
import { generateCustomers } from '$lib/data/mock-generator';
import type { Paginated, CustomerRow } from '$lib/types/metrics';
import { parseIsoDate, parsePage, parseSort, parseStatus } from '$lib/server/query-params';
import type { CustomerSort, CustomerFilterStatus } from '$lib/types/metrics';

const VALID_SORTS: readonly CustomerSort[] = ['mrr', 'ltv', 'health', 'name'];
const VALID_STATUSES: readonly CustomerFilterStatus[] = [
	'all',
	'active',
	'trial',
	'churned',
	'at-risk'
];

export const load: PageServerLoad = ({ url }) => {
	const today = new Date();
	const to = today;
	const from = new Date(today);
	from.setDate(from.getDate() - 90);

	const page = parsePage(url);
	const sort = parseSort(url, VALID_SORTS, 'mrr');
	const status = parseStatus(url, VALID_STATUSES, 'all');

	const customers: Paginated<CustomerRow> = generateCustomers(from, to, page, sort, status);

	return {
		range: {
			from: parseIsoDate(from),
			to: parseIsoDate(to)
		},
		customers
	};
};
