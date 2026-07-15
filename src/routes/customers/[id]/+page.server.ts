import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCustomerById } from '$lib/data/mock-generator';

export const load: PageServerLoad = ({ params }) => {
	const customer = getCustomerById(params.id);
	if (!customer) {
		error(404, `Customer "${params.id}" not found`);
	}
	return { customer };
};
