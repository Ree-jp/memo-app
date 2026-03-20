import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users } from '$lib/server/db';
import { hashPassword } from '$lib/utils';
import { createSession } from '../../hooks.server';

export const actions: Actions = {
	default: async ({ request, cookies, platform }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'ユーザー名とパスワードを入力してください' });
		}

		if (username.length < 3) {
			return fail(400, { error: 'ユーザー名は3文字以上で入力してください' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'パスワードは6文字以上で入力してください' });
		}

		const db = drizzle(platform!.env.DB);

		const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
		if (existing[0]) {
			return fail(400, { error: 'このユーザー名は既に使用されています' });
		}

		const passwordHash = await hashPassword(password);
		const result = await db
			.insert(users)
			.values({ username, passwordHash })
			.returning({ id: users.id });

		const userId = result[0].id;
		const secret = platform?.env.AUTH_SECRET;
		if (!secret) {
			return fail(500, { error: 'サーバー設定エラー: AUTH_SECRET が未設定です' });
		}
		const token = await createSession(userId, secret);

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
