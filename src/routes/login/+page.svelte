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
</style>
