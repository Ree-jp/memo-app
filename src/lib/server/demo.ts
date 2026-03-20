import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { users, memo, file } from './db';
import { hashPassword } from '../utils';

interface Env {
	DB: D1Database;
	STORAGE: R2Bucket;
	DEMO_USERNAME: string;
	DEMO_PASSWORD: string;
}

const SEED_MEMOS = [
	{
		memoId: 'demo01',
		title: 'メモアプリへようこそ',
		isPublished: 1,
		slug: 'welcome',
		contentJson: JSON.stringify({
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 2 },
					content: [{ type: 'text', text: 'メモアプリへようこそ！' }]
				},
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'このアプリでは、リッチテキストエディタを使ってメモを作成・管理できます。'
						}
					]
				},
				{
					type: 'heading',
					attrs: { level: 3 },
					content: [{ type: 'text', text: '主な機能' }]
				},
				{
					type: 'bulletList',
					content: [
						{
							type: 'listItem',
							content: [
								{
									type: 'paragraph',
									content: [
										{
											type: 'text',
											marks: [{ type: 'bold' }],
											text: 'リッチテキスト編集'
										},
										{ type: 'text', text: ' — 見出し、リスト、コードブロックなど' }
									]
								}
							]
						},
						{
							type: 'listItem',
							content: [
								{
									type: 'paragraph',
									content: [
										{
											type: 'text',
											marks: [{ type: 'bold' }],
											text: '画像・ファイル添付'
										},
										{
											type: 'text',
											text: ' — ドラッグ＆ドロップやペーストで簡単アップロード'
										}
									]
								}
							]
						},
						{
							type: 'listItem',
							content: [
								{
									type: 'paragraph',
									content: [
										{
											type: 'text',
											marks: [{ type: 'bold' }],
											text: 'メモの公開'
										},
										{
											type: 'text',
											text: ' — URLを共有して誰でも閲覧可能に'
										}
									]
								}
							]
						},
						{
							type: 'listItem',
							content: [
								{
									type: 'paragraph',
									content: [
										{
											type: 'text',
											marks: [{ type: 'bold' }],
											text: 'カスタムスラッグ'
										},
										{
											type: 'text',
											text: ' — わかりやすいURLを設定可能'
										}
									]
								}
							]
						}
					]
				},
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'まずは新しいメモを作成してみましょう！エディタで '
						},
						{ type: 'text', marks: [{ type: 'code' }], text: '/' },
						{
							type: 'text',
							text: ' を入力するとスラッシュコマンドが使えます。'
						}
					]
				}
			]
		}),
		contentHtml:
			'<h2>メモアプリへようこそ！</h2><p>このアプリでは、リッチテキストエディタを使ってメモを作成・管理できます。</p><h3>主な機能</h3><ul><li><p><strong>リッチテキスト編集</strong> — 見出し、リスト、コードブロックなど</p></li><li><p><strong>画像・ファイル添付</strong> — ドラッグ＆ドロップやペーストで簡単アップロード</p></li><li><p><strong>メモの公開</strong> — URLを共有して誰でも閲覧可能に</p></li><li><p><strong>カスタムスラッグ</strong> — わかりやすいURLを設定可能</p></li></ul><p>まずは新しいメモを作成してみましょう！エディタで <code>/</code> を入力するとスラッシュコマンドが使えます。</p>'
	},
	{
		memoId: 'demo02',
		title: '書き方ガイド',
		isPublished: 1,
		slug: null,
		contentJson: JSON.stringify({
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 2 },
					content: [{ type: 'text', text: '書き方ガイド' }]
				},
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'エディタではさまざまな書式を使うことができます。'
						}
					]
				},
				{
					type: 'heading',
					attrs: { level: 3 },
					content: [{ type: 'text', text: '見出し' }]
				},
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'スラッシュコマンドから H1 / H2 / H3 の見出しを挿入できます。'
						}
					]
				},
				{
					type: 'heading',
					attrs: { level: 3 },
					content: [{ type: 'text', text: 'リスト' }]
				},
				{
					type: 'orderedList',
					attrs: { start: 1 },
					content: [
						{
							type: 'listItem',
							content: [
								{
									type: 'paragraph',
									content: [{ type: 'text', text: '番号付きリスト' }]
								}
							]
						},
						{
							type: 'listItem',
							content: [
								{
									type: 'paragraph',
									content: [{ type: 'text', text: '順序を示すのに便利' }]
								}
							]
						}
					]
				},
				{
					type: 'bulletList',
					content: [
						{
							type: 'listItem',
							content: [
								{
									type: 'paragraph',
									content: [{ type: 'text', text: '箇条書きリスト' }]
								}
							]
						},
						{
							type: 'listItem',
							content: [
								{
									type: 'paragraph',
									content: [{ type: 'text', text: '要点をまとめるのに便利' }]
								}
							]
						}
					]
				},
				{
					type: 'heading',
					attrs: { level: 3 },
					content: [{ type: 'text', text: 'コードブロック' }]
				},
				{
					type: 'codeBlock',
					attrs: { language: null },
					content: [
						{
							type: 'text',
							text: 'const greeting = "Hello, World!";\nconsole.log(greeting);'
						}
					]
				},
				{
					type: 'heading',
					attrs: { level: 3 },
					content: [{ type: 'text', text: '引用' }]
				},
				{
					type: 'blockquote',
					content: [
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'テキストを選択してバブルメニューから書式を変更することもできます。'
								}
							]
						}
					]
				}
			]
		}),
		contentHtml:
			'<h2>書き方ガイド</h2><p>エディタではさまざまな書式を使うことができます。</p><h3>見出し</h3><p>スラッシュコマンドから H1 / H2 / H3 の見出しを挿入できます。</p><h3>リスト</h3><ol><li><p>番号付きリスト</p></li><li><p>順序を示すのに便利</p></li></ol><ul><li><p>箇条書きリスト</p></li><li><p>要点をまとめるのに便利</p></li></ul><h3>コードブロック</h3><pre><code>const greeting = "Hello, World!";\nconsole.log(greeting);</code></pre><h3>引用</h3><blockquote><p>テキストを選択してバブルメニューから書式を変更することもできます。</p></blockquote>'
	},
	{
		memoId: 'demo03',
		title: '下書きサンプル',
		isPublished: 0,
		slug: null,
		contentJson: JSON.stringify({
			type: 'doc',
			content: [
				{
					type: 'paragraph',
					content: [
						{
							type: 'text',
							text: 'これは非公開の下書きメモです。公開ボタンを押すとURLで共有できるようになります。'
						}
					]
				}
			]
		}),
		contentHtml:
			'<p>これは非公開の下書きメモです。公開ボタンを押すとURLで共有できるようになります。</p>'
	}
];

export async function resetDemoAccount(env: Env): Promise<void> {
	const db = drizzle(env.DB);
	const username = env.DEMO_USERNAME;
	const password = env.DEMO_PASSWORD;

	// 1. Find or create demo user
	const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
	let userId: number;

	if (existing[0]) {
		userId = existing[0].id;
		// Reset password in case it was changed
		const passwordHash = await hashPassword(password);
		await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
	} else {
		const passwordHash = await hashPassword(password);
		const result = await db
			.insert(users)
			.values({ username, passwordHash })
			.returning({ id: users.id });
		userId = result[0].id;
	}

	// 2. Clean up R2 files
	const fileRecords = await db.select().from(file).where(eq(file.userId, userId));
	for (const f of fileRecords) {
		await env.STORAGE.delete(f.r2Key);
	}

	// 3. Delete all memos (CASCADE deletes file records too)
	await db.delete(memo).where(eq(memo.userId, userId));

	// 4. Insert seed memos
	for (const seed of SEED_MEMOS) {
		await db.insert(memo).values({
			memoId: seed.memoId,
			userId,
			title: seed.title,
			contentJson: seed.contentJson,
			contentHtml: seed.contentHtml,
			slug: seed.slug,
			isPublished: seed.isPublished
		});
	}
}
