import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMemo, updateMemo } from '$lib/server/memo';

export const PATCH: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

	const memo = await getMemo(platform!.env.DB, params.memo_id);
	if (!memo) return json({ status: 'error', message: '指定されたメモが見つかりませんでした' }, { status: 404 });
	if (memo.userId !== locals.user.id)
		return json({ status: 'error', message: '指定されたメモの権限がありません' }, { status: 403 });

	const newStatus = memo.isPublished ? 0 : 1;
	await updateMemo(platform!.env.DB, params.memo_id, { isPublished: newStatus });

	return json({ status: 'success', memo_id: params.memo_id, is_published: newStatus });
};
