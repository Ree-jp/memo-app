<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showNewModal = $state(false);
	let showEditModal = $state(false);
	let newTitle = $state('');
	let editTitle = $state('');
	let editMemoId = $state('');
	let isLoading = $state(false);

	async function createMemo(e: SubmitEvent) {
		e.preventDefault();
		if (!newTitle.trim()) return;
		isLoading = true;
		const res = await fetch('/api/memo', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: newTitle })
		});
		const result = await res.json();
		isLoading = false;
		if (result.status === 'success') {
			showNewModal = false;
			newTitle = '';
			window.location.href = `/edit/${result.memo_id}`;
		}
	}

	function openEditModal(memoId: string, title: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		editMemoId = memoId;
		editTitle = title;
		showEditModal = true;
	}

	async function updateTitle(e: SubmitEvent) {
		e.preventDefault();
		if (!editTitle.trim()) return;
		isLoading = true;
		await fetch(`/api/memo/${editMemoId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: editTitle })
		});
		isLoading = false;
		showEditModal = false;
		await invalidateAll();
	}

	async function deleteMemo(memoId: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm('このメモを削除しますか？')) return;
		isLoading = true;
		await fetch(`/api/memo/${memoId}`, { method: 'DELETE' });
		isLoading = false;
		await invalidateAll();
	}

	function viewMemo(memoId: string, slug: string | null, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		window.open(`/view/${slug || memoId}`, '_blank');
	}
</script>

<svelte:head>
	<title>ホーム - メモアプリ</title>
</svelte:head>

<!-- 新規作成モーダル -->
{#if showNewModal}
	<div class="modal-overlay">
		<div class="modal-content">
			<button class="modal-close" onclick={() => (showNewModal = false)}>&times;</button>
			<h2>新規メモ作成</h2>
			{#if isLoading}
				<div class="spinner-overlay"><div class="spinner"></div></div>
			{/if}
			<form onsubmit={createMemo}>
				<input class="w-full" type="text" placeholder="メモのタイトルを入力" bind:value={newTitle} required />
				<button class="btn-accent w-full" type="submit">作成する</button>
			</form>
		</div>
	</div>
{/if}

<!-- 編集モーダル -->
{#if showEditModal}
	<div class="modal-overlay">
		<div class="modal-content">
			<button class="modal-close" onclick={() => (showEditModal = false)}>&times;</button>
			<h2>メモ編集</h2>
			{#if isLoading}
				<div class="spinner-overlay"><div class="spinner"></div></div>
			{/if}
			<form onsubmit={updateTitle}>
				<input class="w-full" type="text" placeholder="メモのタイトルを入力" bind:value={editTitle} required />
				<button class="btn-accent w-full" type="submit">更新する</button>
			</form>
		</div>
	</div>
{/if}

<div class="home-page">
	{#if isLoading && !showNewModal && !showEditModal}
		<div class="spinner-overlay"><div class="spinner"></div></div>
	{/if}

	<h1 class="welcome">{data.user?.username}さん、ようこそ</h1>

	<div class="content-header">
		<span class="content-title">メモ一覧</span>
		<button class="btn-primary" onclick={() => (showNewModal = true)}>新規メモ作成</button>
	</div>

	<div class="memos">
		{#each data.memos as m}
			<a class="memo" href="/edit/{m.memoId}">
				<div class="memo-info">
					<h3>{m.title}</h3>
					<p>最終更新: {m.updatedAt}</p>
				</div>
				<div class="memo-actions">
					{#if m.isPublished}
						<button class="icon-btn published" onclick={(e) => viewMemo(m.memoId, m.slug, e)} title="公開ビュー">
							<i class="fa fa-globe"></i>
						</button>
					{/if}
					<button class="icon-btn" onclick={(e) => openEditModal(m.memoId, m.title, e)} title="タイトル編集">
						<i class="fa fa-edit"></i>
					</button>
					<button class="icon-btn" onclick={(e) => deleteMemo(m.memoId, e)} title="削除">
						<i class="fa fa-trash"></i>
					</button>
				</div>
			</a>
		{/each}
		{#if data.memos.length === 0}
			<p style="text-align: center; color: #9B9B9B;">メモがありません。新しいメモを作成しましょう！</p>
		{/if}
	</div>
</div>

<style>
	.home-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 10px;
	}
	.welcome {
		margin: 20px 0 0;
		text-align: center;
	}
	.content-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 10px;
		margin-top: 20px;
	}
	.content-title {
		font-size: 20px;
		font-weight: bold;
	}
	.memos {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 20px 10px;
	}
	.memo {
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #fff;
		padding: 10px 20px;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: background-color 0.2s ease;
	}
	.memo:hover {
		background-color: #F1F1EF;
	}
	.memo h3 {
		color: #373530;
		margin: 0;
		font-size: 18px;
		flex: 1;
	}
	.memo p {
		margin: 0;
		font-size: 14px;
		color: #9B9B9B;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.memo-actions {
		display: flex;
		gap: 10px;
		margin-left: 10px;
	}
	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 16px;
		color: #9B9B9B;
		padding: 5px;
	}
	.icon-btn:hover {
		color: #555;
	}
	.icon-btn.published {
		color: #5a9a5a;
	}
	.icon-btn.published:hover {
		color: #3e6e3e;
	}
</style>
