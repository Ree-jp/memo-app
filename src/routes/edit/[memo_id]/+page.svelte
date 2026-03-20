<script lang="ts">
	import Editor from '$lib/components/Editor.svelte';
	import { untrack } from 'svelte';

	let { data } = $props();
	let editorRef: Editor | undefined = $state();
	let isLoading = $state(false);
	let isDirty = $state(false);
	let isPublished = $state(0);
	// untrack で初期値のみ取得し、以降はユーザー入力を保持する
	let slug = $state(untrack(() => data.memo.slug ?? ''));
	$effect(() => {
		isPublished = data.memo.isPublished;
	});
	let slugError = $state('');
	let showPublishModal = $state(false);
	let showSlugInput = $state(false);

	function markDirty() {
		isDirty = true;
	}

	function onSlugChange() {
		isDirty = true;
		slugError = '';
	}

	async function saveContent(): Promise<boolean> {
		if (!editorRef) return false;
		slugError = '';

		if (slug && !/^[a-zA-Z0-9_-]+$/.test(slug)) {
			slugError = 'スラッグは英数字、ハイフン、アンダースコアのみ使用できます';
			showSlugInput = true;
			return false;
		}

		const contentJson = editorRef.getJSON();
		const contentHtml = editorRef.getHTML();

		const res = await fetch(`/api/memo/${data.memo.memoId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content_json: contentJson, content_html: contentHtml, slug: slug || null })
		});

		if (res.ok) {
			isDirty = false;
			return true;
		}

		const result = await res.json().catch(() => null);
		if (result?.message?.includes('UNIQUE') || result?.message?.includes('unique')) {
			slugError = 'このスラッグは既に使用されています';
			showSlugInput = true;
		}
		return false;
	}

	async function save() {
		isLoading = true;
		const ok = await saveContent();
		if (ok) {
			window.location.href = '/';
		} else {
			isLoading = false;
		}
	}

	async function togglePublish() {
		isLoading = true;
		// 公開時は先に保存
		const saved = await saveContent();
		if (!saved) {
			isLoading = false;
			return;
		}

		const res = await fetch(`/api/memo/${data.memo.memoId}/publish`, { method: 'PATCH' });
		const result = await res.json();
		isLoading = false;

		if (result.status === 'success') {
			isPublished = result.is_published;
			if (isPublished) {
				showPublishModal = true;
			}
		}
	}

	function goBack() {
		if (isDirty) {
			if (!confirm('保存されていない変更があります。このまま戻りますか？')) {
				return;
			}
		}
		window.location.href = '/';
	}

	let viewUrl = $derived(`${typeof window !== 'undefined' ? window.location.origin : ''}/view/${slug || data.memo.memoId}`);

	// ブラウザの戻る・リロード時にも警告
	$effect(() => {
		function handleBeforeUnload(e: BeforeUnloadEvent) {
			if (isDirty) {
				e.preventDefault();
			}
		}
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});
</script>

<svelte:head>
	<title>{data.memo.title} - メモアプリ</title>
</svelte:head>

<!-- 公開モーダル -->
{#if showPublishModal}
	<div class="modal-overlay">
		<div class="modal-content">
			<button class="modal-close" onclick={() => (showPublishModal = false)}>&times;</button>
			<h2>メモを公開しました</h2>
			<p>以下のリンクから誰でも閲覧できます。</p>
			<a href="/view/{slug || data.memo.memoId}" target="_blank">{viewUrl}</a>
			{#if !slug}
				<p class="slug-suggestion">
					<i class="fa fa-lightbulb" style="color:#c19138"></i>
					スラッグを設定するとわかりやすいURLにできます
				</p>
			{/if}
		</div>
	</div>
{/if}

<div class="editor-page">
	<div class="content-header">
		<button class="btn-back" onclick={goBack} title="戻る">
			<i class="fa-solid fa-arrow-left"></i>
		</button>
		<span class="content-title">{data.memo.title}</span>
		<div class="header-btns">
			<button
				class="btn-accent {isPublished ? 'published' : ''}"
				disabled={isLoading}
				onclick={togglePublish}
			>
				{#if isPublished}
					<i class="fa fa-globe"></i> 公開中
				{:else}
					<i class="fa fa-lock"></i> 公開する
				{/if}
			</button>
			<button
				class="btn-primary"
				disabled={isLoading}
				onclick={save}
			>
				保存する
			</button>
		</div>
	</div>

	<div class="editor-container">
		<!-- スラッグ設定 -->
		<div class="slug-bar">
			<button
				class="slug-toggle"
				onclick={() => (showSlugInput = !showSlugInput)}
				title="スラッグ設定"
			>
				<i class="fa fa-link"></i>
				{#if slug}
					<span class="slug-preview">/view/<strong>{slug}</strong></span>
				{:else}
					<span class="slug-placeholder">スラッグを設定（URL）</span>
				{/if}
				<i class="fa fa-chevron-{showSlugInput ? 'up' : 'down'} chevron"></i>
			</button>

			{#if showSlugInput}
				<div class="slug-input-area">
					<div class="slug-field">
						<span class="slug-prefix">/view/</span>
						<input
							type="text"
							class="slug-input"
							placeholder="my-article"
							bind:value={slug}
							oninput={onSlugChange}
						/>
					</div>
					{#if slugError}
						<p class="slug-error">{slugError}</p>
					{:else}
						<p class="slug-hint">英数字・ハイフン・アンダースコアのみ使用可能</p>
					{/if}
				</div>
			{/if}
		</div>

		<Editor
			bind:this={editorRef}
			initialContent={data.memo.contentJson}
			editable={true}
			memoId={data.memo.memoId}
			onUpdate={markDirty}
		/>
		{#if isLoading}
			<div class="spinner-overlay">
				<div class="spinner"></div>
			</div>
		{/if}
	</div>
</div>

<style>
	.editor-page {
		padding: 0 10px;
	}
	.content-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 10px;
		margin: 20px auto;
		max-width: 800px;
	}
	.btn-back {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 18px;
		color: #373530;
		padding: 6px 10px;
		border-radius: 4px;
		margin-right: 10px;
		flex-shrink: 0;
	}
	.btn-back:hover {
		background-color: #eee;
	}
	.content-title {
		flex: 1;
		font-size: 18px;
		font-weight: bold;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin-right: 10px;
	}
	.header-btns {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}
	.header-btns button {
		white-space: nowrap;
	}
	.btn-accent.published {
		background-color: #5a9a5a;
	}
	.btn-accent.published:hover {
		background-color: #3e6e3e;
	}
	.editor-container {
		position: relative;
		max-width: 800px;
		margin: 0 auto;
	}

	/* スラッグ設定バー */
	.slug-bar {
		border: 1px solid #e8e3dc;
		border-radius: 6px;
		margin-bottom: 16px;
		background: #fdfbf8;
	}
	.slug-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px 12px;
		font-size: 13px;
		color: #9B9B9B;
		text-align: left;
		border-radius: 6px;
	}
	.slug-toggle:hover {
		background-color: #f5f0ea;
	}
	.slug-toggle i:first-child {
		color: #c19138;
	}
	.slug-preview {
		flex: 1;
		color: #555;
	}
	.slug-placeholder {
		flex: 1;
	}
	.chevron {
		font-size: 11px;
		margin-left: auto;
	}
	.slug-input-area {
		padding: 8px 12px 10px;
		border-top: 1px solid #e8e3dc;
	}
	.slug-field {
		display: flex;
		align-items: center;
		background: #fff;
		border: 1px solid #ccc;
		border-radius: 4px;
		overflow: hidden;
	}
	.slug-prefix {
		padding: 8px 8px 8px 10px;
		background: #f5f0ea;
		color: #777;
		font-size: 13px;
		border-right: 1px solid #ccc;
		white-space: nowrap;
	}
	.slug-input {
		flex: 1;
		border: none;
		padding: 8px 10px;
		font-size: 14px;
		background: transparent;
		outline: none;
		margin: 0;
	}
	.slug-hint {
		margin: 4px 0 0;
		font-size: 11px;
		color: #aaa;
	}
	.slug-error {
		margin: 4px 0 0;
		font-size: 12px;
		color: #e05252;
	}
	.modal-content a {
		display: block;
		color: #447ACB;
		word-break: break-all;
		font-size: 14px;
		background: #f5f0ea;
		padding: 8px 12px;
		border-radius: 4px;
		text-decoration: none;
	}
	.modal-content a:hover {
		text-decoration: underline;
	}
	.slug-suggestion {
		margin: 10px 0 0;
		font-size: 13px;
		color: #888;
	}
</style>
