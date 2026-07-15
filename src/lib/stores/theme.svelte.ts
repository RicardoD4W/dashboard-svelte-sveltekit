import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const COOKIE_KEY = 'theme';

function readCookie(name: string): string | null {
	if (!browser) return null;
	const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
	return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
	if (!browser) return;
	const oneYear = 60 * 60 * 24 * 365;
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

function readInitial(): Theme {
	if (!browser) return 'light';

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark') return stored;
	} catch {
		/* localStorage unavailable — fall through to cookie */
	}

	const cookieValue = readCookie(COOKIE_KEY);
	if (cookieValue === 'light' || cookieValue === 'dark') return cookieValue;

	if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
	return 'light';
}

function applyClass(theme: Theme): void {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

class ThemeStore {
	#current = $state<Theme>(readInitial());

	get value(): Theme {
		return this.#current;
	}

	set(theme: Theme): void {
		this.#current = theme;
		if (!browser) return;

		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			/* localStorage unavailable — cookie still persists */
		}
		writeCookie(COOKIE_KEY, theme);
		applyClass(theme);
	}

	toggle(): void {
		this.set(this.#current === 'dark' ? 'light' : 'dark');
	}
}

export const theme = new ThemeStore();

export function getTheme(): Theme {
	return theme.value;
}

export function setTheme(t: Theme): void {
	theme.set(t);
}

export function toggle(): void {
	theme.toggle();
}
