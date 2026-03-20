<script lang="ts">
	import Editor from '$lib/components/Editor.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.memo.title} - メモアプリ</title>
</svelte:head>

<div class="view-page">
	<div class="content-header">
		<a href="/" class="btn-back" title="ホームに戻る">
			<i class="fa-solid fa-arrow-left"></i>
		</a>
		<span class="content-title">{data.memo.title}</span>
	</div>

	<div class="editor-container">
		<Editor
			initialContent={data.memo.contentJson}
			editable={false}
		/>
	</div>
</div>

<style>
	.view-page {
		padding: 0 10px;
	}
	.content-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 10px;
		margin: 20px auto;
		max-width: 800px;
	}
	.btn-back {
		font-size: 18px;
		color: #373530;
		padding: 6px 10px;
		border-radius: 4px;
		text-decoration: none;
		flex-shrink: 0;
	}
	.btn-back:hover {
		background-color: #eee;
	}
	.content-title {
		font-size: 20px;
		font-weight: bold;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.editor-container {
		position: relative;
		max-width: 800px;
		margin: 0 auto;
		padding: 0 10px;
	}
</style>
