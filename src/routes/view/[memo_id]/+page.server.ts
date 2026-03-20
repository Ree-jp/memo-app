import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getMemoBySlugOrId } from '$lib/server/memo';

export const load: PageServerLoad = async ({ params, platform }) => {
	const memo = await getMemoBySlugOrId(platform!.env.DB, params.memo_id);

	if (!memo) {
		throw error(404, '指定されたメモが見つかりませんでした');
	}

	if (!memo.isPublished) {
		throw error(404, 'このメモは公開されていません');
	}

	// memo_idでアクセスされたが、slugが設定されている場合はslugにリダイレクト
	if (memo.slug && params.memo_id !== memo.slug) {
		throw redirect(301, `/view/${memo.slug}`);
	}

	return {
		memo: {
			memoId: memo.memoId,
			title: memo.title,
			contentJson: memo.contentJson
		}
	};
};
