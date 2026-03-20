<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>ログイン - メモアプリ</title>
</svelte:head>

<div class="login-body">
	<div class="login-container">
		<h1>ログイン</h1>
		<form method="POST" use:enhance>
			<div class="form-group">
				<label for="username">ユーザー名</label>
				<input class="w-full" type="text" name="username" id="username" required />
			</div>
			<div class="form-group">
				<label for="password">パスワード</label>
				<input class="w-full" type="password" name="password" id="password" required />
			</div>
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
			<button class="btn-primary w-full" type="submit">ログイン</button>
		</form>
		<a href="/register">アカウント登録はこちらから</a>

		<div class="demo-section">
			<div class="divider"><span>または</span></div>
			<form method="POST" use:enhance>
				<input type="hidden" name="username" value="demo" />
				<input type="hidden" name="password" value="demo" />
				<button class="btn-demo w-full" type="submit">デモアカウントで試す</button>
			</form>
			<p class="demo-note">※ デモデータは毎週リセットされます</p>
		</div>
	</div>
</div>

<style>
	.login-body {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}
	.login-container {
		max-width: 400px;
		width: 100%;
		padding: 10px 20px;
	}
	.login-container h1 {
		text-align: center;
		margin-bottom: 24px;
		font-size: 24px;
	}
	.form-group {
		margin-bottom: 4px;
	}
	.form-group label {
		display: block;
		margin-bottom: 4px;
		font-size: 14px;
	}
	.error {
		color: #BE524B;
		font-size: 14px;
	}
	a {
		display: block;
		margin-top: 16px;
		color: #447ACB;
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
	.demo-section {
		margin-top: 24px;
	}
	.divider {
		display: flex;
		align-items: center;
		margin-bottom: 16px;
		color: #999;
		font-size: 13px;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid #ddd;
	}
	.divider span {
		padding: 0 12px;
	}
	.btn-demo {
		padding: 8px 16px;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: #f5f5f5;
		color: #555;
		font-size: 14px;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn-demo:hover {
		background: #e8e8e8;
	}
	.demo-note {
		margin-top: 8px;
		font-size: 12px;
		color: #999;
		text-align: center;
	}
</style>
