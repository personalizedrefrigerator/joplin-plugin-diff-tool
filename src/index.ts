import joplin from 'api';
import { ContentScriptType, ModelType, ToolbarButtonLocation } from 'api/types';
import pickNote from './pickNote';

joplin.plugins.register({
	onStart: async function () {
		let selectedNoteId: string | null = null;
		await joplin.workspace.onNoteSelectionChange((event: { value: string[] }) => {
			const ids = event.value;
			if (ids.length !== 1) {
				selectedNoteId = null;
			} else {
				selectedNoteId = ids[0];
			}
		});

		const contentScriptId = 'cm6-diff-view';
		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			contentScriptId,
			'./contentScript/contentScript.js',
		);
		await joplin.contentScripts.onMessage(contentScriptId, async (message: string) => {
			if (message === 'getMergeContent' && selectedNoteId) {
				const mergeNoteId = await joplin.data.userDataGet(
					ModelType.Note,
					selectedNoteId,
					'diff-with',
				);
				if (!mergeNoteId || typeof mergeNoteId !== 'string') {
					return null;
				}

				const mergeNoteContent = await joplin.data.get(['notes', mergeNoteId], {
					fields: ['body'],
				});
				return mergeNoteContent.body;
			}

			return null;
		});

		const showDiffWith = async (noteId: string | null) => {
			let diffContent: string | null;
			if (noteId) {
				await joplin.data.userDataSet(ModelType.Note, selectedNoteId, 'diff-with', noteId);
				const note = await joplin.data.get(['notes', noteId], { fields: ['body'] });
				diffContent = note.body;
			} else {
				await joplin.data.userDataDelete(ModelType.Note, selectedNoteId, 'diff-with');
				diffContent = null;
			}
			await joplin.commands.execute('editor.execCommand', {
				name: 'cm6-show-diff-with',
				args: [diffContent],
			});
		};

		await joplin.commands.register({
			name: 'showDiffWithNote',
			label: 'Compare the current note with another',
			iconName: 'fas fa-code-branch',
			execute: async () => {
				if (!selectedNoteId) return;

				const noteId = await pickNote();
				if (!selectedNoteId || noteId === null) {
					console.warn('No note selected.');
					return;
				}

				await showDiffWith(noteId);
			},
		});
		await joplin.views.toolbarButtons.create(
			'show-diff-with',
			'showDiffWithNote',
			ToolbarButtonLocation.EditorToolbar,
		);
	},
});
