import type { RequestHandler } from './$types';
import { getFileByKey, getMemo } from '$lib/server/memo';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	const r2Key = params.key;

	const fileRecord = await getFileByKey(platform!.env.DB, r2Key);
	if (!fileRecord) {
		return new Response('Not found', { status: 404 });
	}

	const memo = await getMemo(platform!.env.DB, fileRecord.memoId);
	if (!memo) {
		return new Response('Not found', { status: 404 });
	}

	// 公開メモのファイルは誰でもアクセス可能、非公開は認証+オーナーシップ検証
	if (!memo.isPublished) {
		if (!locals.user || locals.user.id !== memo.userId) {
			return new Response('Forbidden', { status: 403 });
		}
	}

	const object = await platform!.env.STORAGE.get(r2Key);
	if (!object) {
		return new Response('Not found', { status: 404 });
	}

	const cacheControl = memo.isPublished
		? 'public, max-age=31536000, immutable'
		: 'private, no-store';

	return new Response(object.body, {
		headers: {
			'Content-Type': fileRecord.contentType,
			'Cache-Control': cacheControl,
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
