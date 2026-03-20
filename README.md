https://memo.reesuke.com/view/introduction

# メモアプリ

メモアプリは、**思いついたことをすぐに記録し、あとで見返しやすく整理できる Web アプリ**です。  
テキストだけでなく画像やファイルも扱え、必要に応じてメモを公開 URL で共有できます。

## このアプリの特徴

- **ユーザーごとのメモ管理**  
  アカウント登録・ログイン後、メモはユーザー単位で分離して管理されます。
- **リッチテキストエディタ**  
  見出し、箇条書き、コードブロック、引用、リンクなどを使ってメモを構造化できます。
- **スラッシュコマンド**  
  エディタで `/` を入力するとコマンドメニューが開き、書式変更や画像/ファイル挿入を素早く実行できます。
- **画像・ファイル添付**  
  アップロード、ドラッグ&ドロップ、画像のペーストに対応。添付ファイルは Cloudflare R2 に保存されます。
- **公開/非公開の切り替え**  
  メモごとに公開状態を切り替え可能。公開時は `/view/...` の URL で閲覧できます。
- **スラッグ対応の共有 URL**  
  `memo_id` だけでなく任意のスラッグを設定して、分かりやすい公開 URL を作成できます。
- **基本的なセキュリティ対策**  
  セッション Cookie 認証、保護ルート制御、ログイン試行の簡易レート制限を実装しています。

## 技術スタック

- **Frontend**: SvelteKit, Svelte 5, TipTap
- **Backend**: SvelteKit Server Routes (Cloudflare Workers)
- **Database**: Cloudflare D1 + Drizzle ORM
- **Storage**: Cloudflare R2
- **Deploy**: Wrangler

## セットアップ

### 前提

- Node.js
- npm
- Cloudflare アカウント
- Wrangler CLI（`npm` スクリプト経由で実行）

### 1. 依存関係インストールとローカル DB マイグレーション

```sh
npm run setup
```

### 2. 環境変数（AUTH_SECRET）の設定

セッション署名に使用する `AUTH_SECRET` を設定してください。

- ローカル開発: `.dev.vars` に `AUTH_SECRET=your-secret`
- リモート環境: `wrangler secret put AUTH_SECRET`

## 開発

```sh
npm run dev
```

## ビルド

```sh
npm run build
```

## デプロイ

```sh
npm run deploy
```

## DB 操作コマンド

```sh
# ローカル D1 にマイグレーション適用
npm run db:migrate:local

# リモート D1 にマイグレーション適用
npm run db:migrate:remote

# D1 Studio（ローカル）
npm run db:studio:local

# D1 Studio（リモート）
npm run db:studio:remote
```
