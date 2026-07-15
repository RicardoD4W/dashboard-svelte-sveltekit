import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateKpis } from '$lib/data/mock-generator';
import type { ApiEnvelope, Kpi } from '$lib/types/metrics';
import { parseDateRange, parseIsoDate } from '$lib/server/query-params';

export const GET: RequestHandler = ({ url }) => {
	const { from, to } = parseDateRange(url, 30);

	try {
		const data = generateKpis(from, to) satisfies Kpi[];
		const envelope: ApiEnvelope<Kpi[]> = {
			data,
			meta: {
				from: parseIsoDate(from),
				to: parseIsoDate(to),
				generatedAt: new Date().toISOString()
			}
		};
		return json(envelope);
	} catch {
		throw error(500, 'Failed to generate KPIs');
	}
};
