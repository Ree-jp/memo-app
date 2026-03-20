import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getMemo } from '$lib/server/memo';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const memo = await getMemo(platform!.env.DB, params.memo_id);

	if (!memo) {
		throw error(404, '指定されたメモが見つかりませんでした');
	}

	if (memo.userId !== locals.user!.id) {
		throw error(403, '指定されたメモの権限がありません');
	}

	return {
		memo: {
			memoId: memo.memoId,
			title: memo.title,
			slug: memo.slug,
			contentJson: memo.contentJson,
			isPublished: memo.isPublished
		}
	};
};
