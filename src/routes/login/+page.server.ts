import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db';
import { verifyPassword } from '$lib/utils';
import { createSession } from '../../hooks.server';
import {
	getLoginBlockRemainingMs,
	registerLoginFailure,
	clearLoginFailures
} from '$lib/server/login-rate-limit';

export const actions: Actions = {
	default: async ({ request, cookies, platform, getClientAddress }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'ユーザー名とパスワードを入力してください' });
		}

		const ip = getClientAddress();
		const rateLimitKey = `${ip}:${username.toLowerCase()}`;
		const blockedMs = getLoginBlockRemainingMs(rateLimitKey);
		if (blockedMs > 0) {
			const waitMinutes = Math.ceil(blockedMs / 60000);
			return fail(429, {
				error: `ログイン試行回数が多すぎます。${waitMinutes}分後に再試行してください`
			});
		}

		const db = drizzle(platform!.env.DB);
		const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);

		if (!rows[0]) {
			registerLoginFailure(rateLimitKey);
			return fail(400, { error: 'ユーザー名またはパスワードが正しくありません' });
		}

		const valid = await verifyPassword(password, rows[0].passwordHash);
		if (!valid) {
			registerLoginFailure(rateLimitKey);
			return fail(400, { error: 'ユーザー名またはパスワードが正しくありません' });
		}

		const secret = platform?.env.AUTH_SECRET;
		if (!secret) {
			return fail(500, { error: 'サーバー設定エラー: AUTH_SECRET が未設定です' });
		}

		clearLoginFailures(rateLimitKey);
		const token = await createSession(rows[0].id, secret);

		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 7 * 24 * 60 * 60
		});

		throw redirect(303, '/');
	}
};
