<script lang="ts">
	let { username = null, onLogout = () => {} }: { username: string | null; onLogout?: () => void } = $props();
</script>

<header>
	<h2>メモアプリ📝</h2>
	{#if username}
		<div class="header-right">
			<span class="username">{username}</span>
			<button class="btn-logout" onclick={onLogout}>ログアウト</button>
		</div>
	{/if}
</header>

<style>
	header {
		text-align: center;
		padding: 8px 20px;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
	}
	h2 {
		margin: 8px 0;
	}
	.header-right {
		position: absolute;
		right: 20px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.username {
		font-size: 14px;
		color: #9B9B9B;
	}
	.btn-logout {
		background: none;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 4px 12px;
		cursor: pointer;
		font-size: 13px;
		color: #666;
	}
	.btn-logout:hover {
		background: #f0f0f0;
	}
</style>
