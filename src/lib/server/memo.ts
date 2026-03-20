import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, or } from 'drizzle-orm';
import { memo, file } from './db';
import { sql } from 'drizzle-orm';

export function getDb(d1: D1Database) {
	return drizzle(d1);
}

export async function getUserMemos(d1: D1Database, userId: number) {
	const db = getDb(d1);
	return db
		.select({
			memoId: memo.memoId,
			title: memo.title,
			slug: memo.slug,
			isPublished: memo.isPublished,
			createdAt: memo.createdAt,
			updatedAt: memo.updatedAt
		})
		.from(memo)
		.where(eq(memo.userId, userId))
		.orderBy(desc(memo.updatedAt));
}

export async function getMemo(d1: D1Database, memoId: string) {
	const db = getDb(d1);
	const rows = await db.select().from(memo).where(eq(memo.memoId, memoId)).limit(1);
	return rows[0] ?? null;
}

export async function getMemoBySlugOrId(d1: D1Database, slugOrId: string) {
	const db = getDb(d1);
	const rows = await db
		.select()
		.from(memo)
		.where(or(eq(memo.slug, slugOrId), eq(memo.memoId, slugOrId)))
		.limit(1);
	return rows[0] ?? null;
}

export async function createMemo(d1: D1Database, memoId: string, userId: number, title: string) {
	const db = getDb(d1);
	await db.insert(memo).values({ memoId, userId, title, isPublished: 0 });
}

export async function updateMemo(
	d1: D1Database,
	memoId: string,
	data: {
		title?: string;
		contentJson?: string;
		contentHtml?: string;
		slug?: string | null;
		isPublished?: number;
	}
) {
	const db = getDb(d1);
	await db
		.update(memo)
		.set({ ...data, updatedAt: sql`datetime('now')` })
		.where(eq(memo.memoId, memoId));
}

export async function deleteMemo(d1: D1Database, memoId: string) {
	const db = getDb(d1);
	await db.delete(memo).where(eq(memo.memoId, memoId));
}

export async function getFilesByMemo(d1: D1Database, memoId: string) {
	const db = getDb(d1);
	return db.select().from(file).where(eq(file.memoId, memoId));
}

export async function createFileRecord(
	d1: D1Database,
	data: {
		r2Key: string;
		memoId: string;
		userId: number;
		filename: string;
		contentType: string;
		size: number;
	}
) {
	const db = getDb(d1);
	await db.insert(file).values(data);
}

export async function getFileByKey(d1: D1Database, r2Key: string) {
	const db = getDb(d1);
	const rows = await db.select().from(file).where(eq(file.r2Key, r2Key)).limit(1);
	return rows[0] ?? null;
}

export async function deleteFileRecord(d1: D1Database, r2Key: string) {
	const db = getDb(d1);
	await db.delete(file).where(eq(file.r2Key, r2Key));
}

export async function deleteFilesByMemo(d1: D1Database, memoId: string) {
	const db = getDb(d1);
	await db.delete(file).where(eq(file.memoId, memoId));
}

/**
 * contentHtml内の /api/file/ URLからr2Keyを抽出する
 */
export function extractFileKeysFromContent(contentHtml: string | null | undefined): Set<string> {
	const keys = new Set<string>();
	if (!contentHtml) return keys;
	const regex = /\/api\/file\/([^\s"'<>]+)/g;
	let match;
	while ((match = regex.exec(contentHtml)) !== null) {
		keys.add(match[1]);
	}
	return keys;
}
