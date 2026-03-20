import type { Handle } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db';

const PROTECTED_ROUTES = ['/', '/edit'];

export const handle: Handle = async ({ event, resolve }) => {
	const sessionCookie = event.cookies.get('session');
	event.locals.user = null;

	if (sessionCookie && event.platform?.env?.DB) {
		try {
			const payload = await verifySession(sessionCookie, getSecret(event));
			if (payload) {
				const db = drizzle(event.platform.env.DB);
				const rows = await db
					.select({ id: users.id, username: users.username })
					.from(users)
					.where(eq(users.id, payload.userId))
					.limit(1);
				if (rows[0]) {
					event.locals.user = rows[0];
				}
			}
		} catch {
			event.cookies.delete('session', { path: '/' });
		}
	}

	const path = event.url.pathname;
	const isProtected = PROTECTED_ROUTES.some((r) => (r === '/' ? path === '/' : path.startsWith(r)));

	if (isProtected && !event.locals.user) {
		return new Response(null, { status: 303, headers: { location: '/login' } });
	}

	if ((path === '/login' || path === '/register') && event.locals.user) {
		return new Response(null, { status: 303, headers: { location: '/' } });
	}

	return resolve(event);
};

function getSecret(event: { platform?: App.Platform }): string {
	const secret = event.platform?.env?.AUTH_SECRET;
	if (!secret) {
		throw new Error('AUTH_SECRET is not set');
	}
	return secret;
}

export async function createSession(
	userId: number,
	secret: string
): Promise<string> {
	const payload = { userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
	const data = JSON.stringify(payload);
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
	const sigHex = Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return btoa(data) + '.' + sigHex;
}

async function verifySession(
	token: string,
	secret: string
): Promise<{ userId: number; exp: number } | null> {
	const parts = token.split('.');
	if (parts.length !== 2) return null;

	const data = atob(parts[0]);
	const sigHex = parts[1];
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['verify']
	);
	const sig = new Uint8Array(sigHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
	const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(data));
	if (!valid) return null;

	const payload = JSON.parse(data);
	if (payload.exp < Date.now()) return null;

	return payload;
}
