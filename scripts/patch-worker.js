/**
 * Post-build script: adds a `scheduled` handler to the SvelteKit-generated worker
 * for Cloudflare Cron Triggers (demo account weekly reset).
 *
 * Uses D1 raw SQL to avoid drizzle import complexity in the bundled worker.
 */
import { readFileSync, writeFileSync } from 'fs';

const WORKER_PATH = '.svelte-kit/cloudflare/_worker.js';

const worker = readFileSync(WORKER_PATH, 'utf-8');

const SCHEDULED_HANDLER = `
// --- Demo account scheduled reset (injected by scripts/patch-worker.js) ---
async function __hashPassword(password) {
  var encoder = new TextEncoder();
  var salt = crypto.getRandomValues(new Uint8Array(16));
  var keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  var hash = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  var saltHex = Array.from(salt).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
  var hashHex = Array.from(new Uint8Array(hash)).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
  return saltHex + ":" + hashHex;
}

var __seedMemos = [
  {
    id: "demo01",
    title: "メモアプリへようこそ",
    is_published: 1,
    slug: "welcome",
    content_json: JSON.stringify({"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"メモアプリへようこそ！"}]},{"type":"paragraph","content":[{"type":"text","text":"このアプリでは、リッチテキストエディタを使ってメモを作成・管理できます。"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"主な機能"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"リッチテキスト編集"},{"type":"text","text":" — 見出し、リスト、コードブロックなど"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"画像・ファイル添付"},{"type":"text","text":" — ドラッグ＆ドロップやペーストで簡単アップロード"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"メモの公開"},{"type":"text","text":" — URLを共有して誰でも閲覧可能に"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","marks":[{"type":"bold"}],"text":"カスタムスラッグ"},{"type":"text","text":" — わかりやすいURLを設定可能"}]}]}]},{"type":"paragraph","content":[{"type":"text","text":"まずは新しいメモを作成してみましょう！エディタで "},{"type":"text","marks":[{"type":"code"}],"text":"/"},{"type":"text","text":" を入力するとスラッシュコマンドが使えます。"}]}]}),
    content_html: '<h2>メモアプリへようこそ！</h2><p>このアプリでは、リッチテキストエディタを使ってメモを作成・管理できます。</p><h3>主な機能</h3><ul><li><p><strong>リッチテキスト編集</strong> — 見出し、リスト、コードブロックなど</p></li><li><p><strong>画像・ファイル添付</strong> — ドラッグ＆ドロップやペーストで簡単アップロード</p></li><li><p><strong>メモの公開</strong> — URLを共有して誰でも閲覧可能に</p></li><li><p><strong>カスタムスラッグ</strong> — わかりやすいURLを設定可能</p></li></ul><p>まずは新しいメモを作成してみましょう！エディタで <code>/</code> を入力するとスラッシュコマンドが使えます。</p>'
  },
  {
    id: "demo02",
    title: "書き方ガイド",
    is_published: 1,
    slug: null,
    content_json: JSON.stringify({"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"書き方ガイド"}]},{"type":"paragraph","content":[{"type":"text","text":"エディタではさまざまな書式を使うことができます。"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"見出し"}]},{"type":"paragraph","content":[{"type":"text","text":"スラッシュコマンドから H1 / H2 / H3 の見出しを挿入できます。"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"リスト"}]},{"type":"orderedList","attrs":{"start":1},"content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"番号付きリスト"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"順序を示すのに便利"}]}]}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"箇条書きリスト"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"要点をまとめるのに便利"}]}]}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"コードブロック"}]},{"type":"codeBlock","attrs":{"language":null},"content":[{"type":"text","text":"const greeting = \\"Hello, World!\\";\\nconsole.log(greeting);"}]},{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"引用"}]},{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"テキストを選択してバブルメニューから書式を変更することもできます。"}]}]}]}),
    content_html: '<h2>書き方ガイド</h2><p>エディタではさまざまな書式を使うことができます。</p><h3>見出し</h3><p>スラッシュコマンドから H1 / H2 / H3 の見出しを挿入できます。</p><h3>リスト</h3><ol><li><p>番号付きリスト</p></li><li><p>順序を示すのに便利</p></li></ol><ul><li><p>箇条書きリスト</p></li><li><p>要点をまとめるのに便利</p></li></ul><h3>コードブロック</h3><pre><code>const greeting = "Hello, World!";\\nconsole.log(greeting);</code></pre><h3>引用</h3><blockquote><p>テキストを選択してバブルメニューから書式を変更することもできます。</p></blockquote>'
  },
  {
    id: "demo03",
    title: "下書きサンプル",
    is_published: 0,
    slug: null,
    content_json: JSON.stringify({"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"これは非公開の下書きメモです。公開ボタンを押すとURLで共有できるようになります。"}]}]}),
    content_html: '<p>これは非公開の下書きメモです。公開ボタンを押すとURLで共有できるようになります。</p>'
  }
];

async function __resetDemoAccount(env) {
  var DB = env.DB;
  var STORAGE = env.STORAGE;
  var username = env.DEMO_USERNAME;
  var password = env.DEMO_PASSWORD;

  // 1. Find or create demo user
  var row = await DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  var userId;

  if (row) {
    userId = row.id;
    var passwordHash = await __hashPassword(password);
    await DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, userId).run();
  } else {
    var passwordHash = await __hashPassword(password);
    var result = await DB.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id").bind(username, passwordHash).first();
    userId = result.id;
  }

  // 2. Clean up R2 files
  var files = await DB.prepare("SELECT r2_key FROM file WHERE user_id = ?").bind(userId).all();
  for (var f of files.results) {
    await STORAGE.delete(f.r2_key);
  }

  // 3. Delete all memos (CASCADE deletes file records)
  await DB.prepare("DELETE FROM memo WHERE user_id = ?").bind(userId).run();

  // 4. Insert seed memos
  for (var seed of __seedMemos) {
    await DB.prepare(
      "INSERT INTO memo (memo_id, user_id, title, content_json, content_html, slug, is_published) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(seed.id, userId, seed.title, seed.content_json, seed.content_html, seed.slug, seed.is_published).run();
  }
}

var __original = worker_default;
export default {
  fetch: __original.fetch,
  async scheduled(event, env, ctx) {
    ctx.waitUntil(__resetDemoAccount(env));
  }
};
`;

if (!worker.includes('export {')) {
	console.error('Could not find export statement in _worker.js');
	process.exit(1);
}

const patched = worker.replace(
	/export\s*\{\s*worker_default\s+as\s+default\s*\}\s*;?\s*$/,
	SCHEDULED_HANDLER
);

if (patched === worker) {
	console.error('Failed to patch _worker.js - export pattern not matched');
	process.exit(1);
}

writeFileSync(WORKER_PATH, patched);
console.log('Patched _worker.js with scheduled handler for demo reset');
