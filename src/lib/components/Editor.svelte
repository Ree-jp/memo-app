<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor, Extension } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Link from '@tiptap/extension-link';
	import Placeholder from '@tiptap/extension-placeholder';

	let {
		initialContent = null,
		editable = true,
		memoId = '',
		onUpdate: onUpdateCallback = () => {}
	}: {
		initialContent: string | null;
		editable?: boolean;
		memoId?: string;
		onUpdate?: () => void;
	} = $props();

	let element: HTMLDivElement | undefined = $state();
	let editor: Editor | undefined = $state();

	// バブルメニュー状態
	let bubbleVisible = $state(false);
	let bubblePos = $state({ top: 0, left: 0 });

	// スラッシュコマンドメニュー状態
	let slashMenuVisible = $state(false);
	let slashMenuPos = $state({ top: 0, left: 0 });
	let slashQuery = $state('');
	let slashRange: any = $state(null);
	let selectedIndex = $state(0);

	const slashCommands = [
		{ label: '見出し 1', icon: 'fa-heading', desc: '大見出し', action: (ed: Editor) => ed.chain().focus().deleteRange(slashRange).toggleHeading({ level: 1 }).run() },
		{ label: '見出し 2', icon: 'fa-heading', desc: '中見出し', action: (ed: Editor) => ed.chain().focus().deleteRange(slashRange).toggleHeading({ level: 2 }).run() },
		{ label: '見出し 3', icon: 'fa-heading', desc: '小見出し', action: (ed: Editor) => ed.chain().focus().deleteRange(slashRange).toggleHeading({ level: 3 }).run() },
		{ label: '箇条書き', icon: 'fa-list-ul', desc: '- で始まるリスト', action: (ed: Editor) => ed.chain().focus().deleteRange(slashRange).toggleBulletList().run() },
		{ label: '番号リスト', icon: 'fa-list-ol', desc: '1. で始まるリスト', action: (ed: Editor) => ed.chain().focus().deleteRange(slashRange).toggleOrderedList().run() },
		{ label: 'コードブロック', icon: 'fa-code', desc: 'コードを挿入', action: (ed: Editor) => ed.chain().focus().deleteRange(slashRange).toggleCodeBlock().run() },
		{ label: '引用', icon: 'fa-quote-right', desc: '引用ブロック', action: (ed: Editor) => ed.chain().focus().deleteRange(slashRange).toggleBlockquote().run() },
		{ label: '区切り線', icon: 'fa-minus', desc: '水平線を挿入', action: (ed: Editor) => ed.chain().focus().deleteRange(slashRange).setHorizontalRule().run() },
		{ label: '画像', icon: 'fa-image', desc: '画像をアップロード', action: () => { closeSlash(); triggerImageUpload(); } },
		{ label: 'ファイル', icon: 'fa-paperclip', desc: 'ファイルを添付', action: () => { closeSlash(); triggerFileUpload(); } },
	];

	let filteredCommands = $derived(
		slashQuery
			? slashCommands.filter(c => c.label.includes(slashQuery) || c.desc.includes(slashQuery))
			: slashCommands
	);

	function closeSlash() {
		slashMenuVisible = false;
		slashQuery = '';
		slashRange = null;
		selectedIndex = 0;
	}

	function execSlashCommand(index: number) {
		if (!editor) return;
		const cmd = filteredCommands[index];
		if (cmd) cmd.action(editor);
		closeSlash();
	}

	// スラッシュコマンド + バブルメニュー制御 Extension
	const EditorExtensions = Extension.create({
		name: 'editorExtensions',
		addKeyboardShortcuts() {
			return {
				ArrowDown: () => {
					if (!slashMenuVisible) return false;
					selectedIndex = (selectedIndex + 1) % filteredCommands.length;
					return true;
				},
				ArrowUp: () => {
					if (!slashMenuVisible) return false;
					selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
					return true;
				},
				Enter: () => {
					if (!slashMenuVisible) return false;
					execSlashCommand(selectedIndex);
					return true;
				},
				Escape: () => {
					if (!slashMenuVisible) return false;
					closeSlash();
					return true;
				}
			};
		},
		onSelectionUpdate() {
			const { state } = this.editor;
			const { from, to, empty } = state.selection;

			// バブルメニュー: テキスト選択時のみ表示
			if (!empty && editable) {
				const coords = this.editor.view.coordsAtPos(from);
				const endCoords = this.editor.view.coordsAtPos(to);
				const wrapperRect = element?.getBoundingClientRect();
				if (wrapperRect) {
					bubblePos = {
						top: coords.top - wrapperRect.top - 44,
						left: (coords.left + endCoords.left) / 2 - wrapperRect.left
					};
					bubbleVisible = true;
				}
			} else {
				bubbleVisible = false;
			}
		},
		onUpdate() {
			onUpdateCallback();

			const { state } = this.editor;
			const { from } = state.selection;
			const textBefore = state.doc.textBetween(
				Math.max(0, from - 50),
				from,
				'\n'
			);
			const slashIdx = textBefore.lastIndexOf('/');

			if (slashIdx !== -1 && !textBefore.slice(slashIdx + 1).includes(' ')) {
				const query = textBefore.slice(slashIdx + 1);
				slashQuery = query;
				slashRange = { from: from - query.length - 1, to: from };

				const coords = this.editor.view.coordsAtPos(from);
				const wrapperRect = element?.getBoundingClientRect();
				if (wrapperRect) {
					slashMenuPos = {
						top: coords.bottom - wrapperRect.top + 4,
						left: coords.left - wrapperRect.left
					};
				}
				slashMenuVisible = true;
				selectedIndex = 0;
			} else {
				if (slashMenuVisible) closeSlash();
			}
		},
		onBlur() {
			// 少し遅延させてメニュークリックを拾えるようにする
			setTimeout(() => { bubbleVisible = false; }, 150);
		}
	});

	async function uploadFile(file: File): Promise<string | null> {
		if (!memoId) return null;
		const formData = new FormData();
		formData.append('file', file);
		formData.append('memo_id', memoId);
		const res = await fetch('/api/upload', { method: 'POST', body: formData });
		const result = await res.json();
		return result.status === 'success' ? result.url : null;
	}

	function triggerImageUpload() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			const url = await uploadFile(file);
			if (url) editor?.chain().focus().setImage({ src: url }).run();
		};
		input.click();
	}

	function triggerFileUpload() {
		const input = document.createElement('input');
		input.type = 'file';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return;
			const url = await uploadFile(file);
			if (url) {
				if (file.type.startsWith('image/')) {
					editor?.chain().focus().setImage({ src: url }).run();
				} else {
					editor?.chain().focus().insertContent(`<a href="${url}">${file.name}</a>`).run();
				}
			}
		};
		input.click();
	}

	function handleDrop(_view: any, event: DragEvent) {
		if (!event.dataTransfer?.files.length || !memoId) return false;
		const file = event.dataTransfer.files[0];
		if (!file.type.startsWith('image/')) return false;
		event.preventDefault();
		uploadFile(file).then(url => {
			if (url) editor?.chain().focus().setImage({ src: url }).run();
		});
		return true;
	}

	function handlePaste(_view: any, event: ClipboardEvent) {
		if (!memoId) return false;
		for (const item of event.clipboardData?.items ?? []) {
			if (item.type.startsWith('image/')) {
				event.preventDefault();
				const file = item.getAsFile();
				if (!file) return false;
				uploadFile(file).then(url => {
					if (url) editor?.chain().focus().setImage({ src: url }).run();
				});
				return true;
			}
		}
		return false;
	}

	onMount(() => {
		if (!element) return;

		let content: any = '';
		if (initialContent) {
			try { content = JSON.parse(initialContent); } catch { content = ''; }
		}

		editor = new Editor({
			element,
			extensions: [
				StarterKit,
				Image.configure({ inline: false, allowBase64: false }),
				Link.configure({ openOnClick: !editable }),
				Placeholder.configure({ placeholder: editable ? "書き始めるか '/' でコマンドを入力..." : '' }),
				...(editable ? [EditorExtensions] : [])
			],
			content,
			editable,
			editorProps: {
				handleDrop,
				handlePaste
			},
			onTransaction: () => { editor = editor; }
		});
	});

	onDestroy(() => editor?.destroy());

	export function getJSON(): string {
		return JSON.stringify(editor?.getJSON() ?? {});
	}
	export function getHTML(): string {
		return editor?.getHTML() ?? '';
	}
</script>

<div class="editor-wrapper" class:readonly={!editable}>
	<div bind:this={element}></div>

	<!-- バブルメニュー（テキスト選択時） -->
	{#if bubbleVisible}
		<div
			class="bubble-menu"
			style="top: {bubblePos.top}px; left: {bubblePos.left}px;"
		>
			<button class="bm-btn" class:active={editor?.isActive('bold')} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }} title="太字"><b>B</b></button>
			<button class="bm-btn" class:active={editor?.isActive('italic')} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }} title="斜体"><i>I</i></button>
			<button class="bm-btn" class:active={editor?.isActive('strike')} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleStrike().run(); }} title="取り消し線"><s>S</s></button>
			<button class="bm-btn" class:active={editor?.isActive('code')} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleCode().run(); }} title="コード"><code>`</code></button>
			<span class="bm-divider"></span>
			<button class="bm-btn" class:active={editor?.isActive('heading', { level: 1 })} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 1 }).run(); }} title="見出し1">H1</button>
			<button class="bm-btn" class:active={editor?.isActive('heading', { level: 2 })} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 2 }).run(); }} title="見出し2">H2</button>
			<button class="bm-btn" class:active={editor?.isActive('heading', { level: 3 })} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleHeading({ level: 3 }).run(); }} title="見出し3">H3</button>
			<span class="bm-divider"></span>
			<button class="bm-btn" title="箇条書き" class:active={editor?.isActive('bulletList')} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}><i class="fa fa-list-ul"></i></button>
			<button class="bm-btn" title="引用" class:active={editor?.isActive('blockquote')} onmousedown={(e) => { e.preventDefault(); editor?.chain().focus().toggleBlockquote().run(); }}><i class="fa fa-quote-right"></i></button>
		</div>
	{/if}

	<!-- スラッシュコマンドメニュー -->
	{#if slashMenuVisible && filteredCommands.length > 0}
		<div
			class="slash-menu"
			style="top: {slashMenuPos.top}px; left: {slashMenuPos.left}px;"
		>
			{#each filteredCommands as cmd, i}
				<button
					class="slash-item"
					class:selected={i === selectedIndex}
					onmousedown={(e) => { e.preventDefault(); execSlashCommand(i); }}
					onmouseenter={() => selectedIndex = i}
				>
					<span class="slash-icon"><i class="fa {cmd.icon}"></i></span>
					<span class="slash-label">
						<span class="slash-name">{cmd.label}</span>
						<span class="slash-desc">{cmd.desc}</span>
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* エディタ本体 */
	.editor-wrapper {
		min-height: 400px;
		background: #fdfbf8;
		position: relative;
		border: 1px solid #e8e5e0;
		border-radius: 8px;
	}
	.editor-wrapper.readonly {
		border: none;
	}
	.editor-wrapper :global(.tiptap) {
		padding: 20px 24px;
		outline: none;
		min-height: 400px;
		font-size: 16px;
		line-height: 1.7;
		color: #373530;
	}
	.editor-wrapper :global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: #adb5bd;
		pointer-events: none;
		height: 0;
	}
	.editor-wrapper :global(.tiptap h1) { font-size: 32px; font-weight: 700; margin: 0.5em 0 0.3em; }
	.editor-wrapper :global(.tiptap h2) { font-size: 24px; font-weight: 600; margin: 0.5em 0 0.3em; }
	.editor-wrapper :global(.tiptap h3) { font-size: 20px; font-weight: 600; margin: 0.5em 0 0.3em; }
	.editor-wrapper :global(.tiptap img) { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }
	.editor-wrapper :global(.tiptap pre) { background: #f4f4f4; border-radius: 6px; padding: 14px 16px; overflow-x: auto; font-size: 14px; }
	.editor-wrapper :global(.tiptap code) { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; font-size: 14px; }
	.editor-wrapper :global(.tiptap pre code) { background: none; padding: 0; }
	.editor-wrapper :global(.tiptap blockquote) { border-left: 3px solid #ddd; padding-left: 16px; color: #666; margin-left: 0; }
	.editor-wrapper :global(.tiptap a) { color: #447ACB; }
	.editor-wrapper :global(.tiptap hr) { border: none; border-top: 2px solid #eee; margin: 16px 0; }
	.editor-wrapper :global(.tiptap ul),
	.editor-wrapper :global(.tiptap ol) { padding-left: 1.5em; }

	/* バブルメニュー */
	.bubble-menu {
		position: absolute;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 2px;
		background: #1e1e1e;
		border-radius: 6px;
		padding: 4px 6px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		transform: translateX(-50%);
		white-space: nowrap;
	}
	.bm-btn {
		background: none;
		border: none;
		border-radius: 4px;
		color: #fff;
		cursor: pointer;
		padding: 4px 8px;
		font-size: 13px;
		min-width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.bm-btn:hover { background: rgba(255,255,255,0.15); }
	.bm-btn.active { background: rgba(255,255,255,0.25); }
	.bm-divider {
		width: 1px;
		height: 18px;
		background: rgba(255,255,255,0.2);
		margin: 0 2px;
	}

	/* スラッシュコマンドメニュー */
	.slash-menu {
		position: absolute;
		z-index: 100;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0,0,0,0.12);
		width: 260px;
		max-height: 320px;
		overflow-y: auto;
		padding: 4px;
	}
	.slash-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		background: none;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		padding: 8px 10px;
		text-align: left;
	}
	.slash-item:hover, .slash-item.selected {
		background: #f5f5f5;
	}
	.slash-icon {
		width: 32px;
		height: 32px;
		background: #f0f0f0;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		color: #555;
		flex-shrink: 0;
	}
	.slash-label {
		display: flex;
		flex-direction: column;
	}
	.slash-name {
		font-size: 14px;
		font-weight: 500;
		color: #373530;
	}
	.slash-desc {
		font-size: 12px;
		color: #9B9B9B;
	}
</style>
