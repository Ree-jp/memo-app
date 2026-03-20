import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getMemo,
	updateMemo,
	deleteMemo,
	getFilesByMemo,
	deleteFileRecord,
	extractFileKeysFromContent
} from '$lib/server/memo';

type MemoUpdateBody = {
	title?: string;
	content_json?: string;
	content_html?: string;
	slug?: string | null;
};

export const PUT: RequestHandler = async ({ params, request, locals, platform }) => {
	if (!locals.user) return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

	const memo = await getMemo(platform!.env.DB, params.memo_id);
	if (!memo) return json({ status: 'error', message: '指定されたメモが見つかりませんでした' }, { status: 404 });
	if (memo.userId !== locals.user.id)
		return json({ status: 'error', message: '指定されたメモの権限がありません' }, { status: 403 });

	const body = (await request.json()) as MemoUpdateBody;
	const data: { title?: string; contentJson?: string; contentHtml?: string; slug?: string | null } = {};
	if (body.title !== undefined) data.title = body.title;
	if (body.content_json !== undefined) data.contentJson = body.content_json;
	if (body.content_html !== undefined) data.contentHtml = body.content_html;
	if (body.slug !== undefined) data.slug = body.slug || null;

	await updateMemo(platform!.env.DB, params.memo_id, data);

	// content_html が更新された場合、コンテンツから消えたファイルをR2+DBから削除
	if (data.contentHtml !== undefined) {
		const referencedKeys = extractFileKeysFromContent(data.contentHtml);
		const allFiles = await getFilesByMemo(platform!.env.DB, params.memo_id);
		const orphanedFiles = allFiles.filter((f) => !referencedKeys.has(f.r2Key));
		await Promise.all(
			orphanedFiles.map(async (f) => {
				await platform!.env.STORAGE.delete(f.r2Key);
				await deleteFileRecord(platform!.env.DB, f.r2Key);
			})
		);
	}

	return json({ status: 'success', memo_id: params.memo_id });
};

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

	const memo = await getMemo(platform!.env.DB, params.memo_id);
	if (!memo) return json({ status: 'error', message: '指定されたメモが見つかりませんでした' }, { status: 404 });
	if (memo.userId !== locals.user.id)
		return json({ status: 'error', message: '指定されたメモの権限がありません' }, { status: 403 });

	// メモ削除前にR2からファイルを削除（DBレコードはカスケード削除される）
	const files = await getFilesByMemo(platform!.env.DB, params.memo_id);
	await Promise.all(files.map((f) => platform!.env.STORAGE.delete(f.r2Key)));

	await deleteMemo(platform!.env.DB, params.memo_id);
	return json({ status: 'success', memo_id: params.memo_id });
};
