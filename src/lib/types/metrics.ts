export type KpiId = 'mrr' | 'arr' | 'churn' | 'ltv' | 'cac' | 'arpu';

export interface Kpi {
	id: KpiId;
	label: string;
	value: number;
	delta: number;
	sparkline: number[];
	inverted?: boolean;
}

export interface RevenuePoint {
	date: string;
	mrr: number;
	arr: number;
	projected: number;
}

export interface GrowthPoint {
	date: string;
	new: number;
	churned: number;
	net: number;
}

export type CustomerStatus = 'active' | 'trial' | 'churned';

export type CustomerFilterStatus = CustomerStatus | 'at-risk' | 'all';

export type CustomerSort = 'mrr' | 'ltv' | 'health' | 'name';

export type SortDir = 'asc' | 'desc';

export const AT_RISK_HEALTH_THRESHOLD = 50;

export interface CustomerRow {
	id: string;
	name: string;
	mrr: number;
	ltv: number;
	health: number;
	status: CustomerStatus;
}

export interface Paginated<T> {
	rows: T[];
	total: number;
	page: number;
	pageSize: number;
}

export interface ApiMeta {
	from: string;
	to: string;
	generatedAt: string;
}

export interface ApiEnvelope<T> {
	data: T;
	meta: ApiMeta;
}
