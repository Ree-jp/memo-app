import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createMemo } from '$lib/server/memo';
import { generateId } from '$lib/utils';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

	const { title } = await request.json();
	if (!title) return json({ status: 'error', message: 'タイトルが入力されていません' }, { status: 400 });

	const memoId = generateId(6);
	await createMemo(platform!.env.DB, memoId, locals.user.id, title);

	return json({ status: 'success', memo_id: memoId });
};
