import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateCustomerGrowthSeries } from '$lib/data/mock-generator';
import type { ApiEnvelope, GrowthPoint } from '$lib/types/metrics';
import { parseDateRange, parseIsoDate } from '$lib/server/query-params';

export const GET: RequestHandler = ({ url }) => {
	const { from, to } = parseDateRange(url, 30);

	try {
		const data = generateCustomerGrowthSeries(from, to) satisfies GrowthPoint[];
		const envelope: ApiEnvelope<GrowthPoint[]> = {
			data,
			meta: {
				from: parseIsoDate(from),
				to: parseIsoDate(to),
				generatedAt: new Date().toISOString()
			}
		};
		return json(envelope);
	} catch {
		throw error(500, 'Failed to generate customer-growth series');
	}
};
