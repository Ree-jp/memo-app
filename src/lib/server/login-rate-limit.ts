type AttemptState = {
	failures: number[];
	blockedUntil: number;
};

const attempts = new Map<string, AttemptState>();

const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function pruneFailures(now: number, state: AttemptState): void {
	state.failures = state.failures.filter((t) => now - t <= WINDOW_MS);
}

export function getLoginBlockRemainingMs(key: string): number {
	const now = Date.now();
	const state = attempts.get(key);
	if (!state) return 0;

	pruneFailures(now, state);

	if (state.blockedUntil <= now) {
		if (state.failures.length === 0) attempts.delete(key);
		return 0;
	}

	return state.blockedUntil - now;
}

export function registerLoginFailure(key: string): void {
	const now = Date.now();
	const state = attempts.get(key) ?? { failures: [], blockedUntil: 0 };
	pruneFailures(now, state);

	state.failures.push(now);
	if (state.failures.length >= MAX_FAILURES) {
		state.blockedUntil = now + BLOCK_MS;
		state.failures = [];
	}

	attempts.set(key, state);
}

export function clearLoginFailures(key: string): void {
	attempts.delete(key);
}
