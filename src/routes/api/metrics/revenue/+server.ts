import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateRevenueSeries } from '$lib/data/mock-generator';
import type { ApiEnvelope, RevenuePoint } from '$lib/types/metrics';
import { parseDateRange, parseIsoDate } from '$lib/server/query-params';

export const GET: RequestHandler = ({ url }) => {
	const { from, to } = parseDateRange(url, 30);

	try {
		const data = generateRevenueSeries(from, to) satisfies RevenuePoint[];
		const envelope: ApiEnvelope<RevenuePoint[]> = {
			data,
			meta: {
				from: parseIsoDate(from),
				to: parseIsoDate(to),
				generatedAt: new Date().toISOString()
			}
		};
		return json(envelope);
	} catch {
		throw error(500, 'Failed to generate revenue series');
	}
};
