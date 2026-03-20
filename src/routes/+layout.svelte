<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: { user: { id: number; username: string } | null }; children: Snippet } = $props();

	async function handleLogout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.href = '/login';
	}
</script>

<Header username={data.user?.username ?? null} onLogout={handleLogout} />
{@render children()}
<Footer />
