import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMemo, createFileRecord } from '$lib/server/memo';
import { generateId, getExtension, validateFile } from '$lib/utils';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const memoId = formData.get('memo_id') as string | null;

	if (!file || !memoId) {
		return json({ status: 'error', message: 'ファイルとメモIDが必要です' }, { status: 400 });
	}

	const memo = await getMemo(platform!.env.DB, memoId);
	if (!memo || memo.userId !== locals.user.id) {
		return json({ status: 'error', message: '指定されたメモの権限がありません' }, { status: 403 });
	}

	const error = validateFile(file);
	if (error) {
		return json({ status: 'error', message: error }, { status: 400 });
	}

	const ext = getExtension(file.name);
	const r2Key = `${locals.user.id}/${memoId}/${generateId(12)}${ext ? '.' + ext : ''}`;

	await platform!.env.STORAGE.put(r2Key, await file.arrayBuffer(), {
		httpMetadata: { contentType: file.type }
	});

	await createFileRecord(platform!.env.DB, {
		r2Key,
		memoId,
		userId: locals.user.id,
		filename: file.name,
		contentType: file.type,
		size: file.size
	});

	return json({
		status: 'success',
		url: `/api/file/${r2Key}`,
		key: r2Key,
		filename: file.name,
		contentType: file.type
	});
};
