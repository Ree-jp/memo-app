import type { PageServerLoad } from './$types';
import { getUserMemos } from '$lib/server/memo';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const memos = await getUserMemos(platform!.env.DB, locals.user!.id);
	return { memos };
};
