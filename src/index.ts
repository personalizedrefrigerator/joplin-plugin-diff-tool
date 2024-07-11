import joplin from 'api';
import { ContentScriptType, ModelType, ToolbarButtonLocation } from 'api/types';
import pickNote from './pickNote';

const showDiffWithIdKey = 'show-diff-with-id';

const setShowDiffWithId = async (currentNoteId: string, otherNoteId: string | null) => {
	let diffContent: string | null;
	if (otherNoteId) {
		await joplin.data.userDataSet(ModelType.Note, currentNoteId, showDiffWithIdKey, otherNoteId);
		const note = await joplin.data.get(['notes', otherNoteId], { fields: ['body'] });
		diffContent = note.body;
	} else {
		await joplin.data.userDataDelete(ModelType.Note, currentNoteId, showDiffWithIdKey);
		diffContent = null;
	}
	await joplin.commands.execute('editor.execCommand', {
		name: 'cm6-show-diff-with',
		args: [diffContent],
	});
};

const getNoteIdToDiffWith = async (currentNoteId: string) => {
	const mergeNoteId = await joplin.data.userDataGet(
		ModelType.Note,
		currentNoteId,
		showDiffWithIdKey,
	);
	if (!mergeNoteId || typeof mergeNoteId !== 'string') {
		return null;
	}
	return mergeNoteId;
};

const getContentToDiffWith = async (currentNoteId: string) => {
	const mergeNoteId = await getNoteIdToDiffWith(currentNoteId);
	if (!mergeNoteId) {
		return null;
	}

	try {
		const mergeNoteContent = await joplin.data.get(['notes', mergeNoteId], {
			fields: ['body'],
		});
		return mergeNoteContent.body;
	} catch (error) {
		console.warn('Failed to load note to diff with', error);
		return null;
	}
};

joplin.plugins.register({
	onStart: async function () {
		let selectedNoteId: string | null = null;
		await joplin.workspace.onNoteSelectionChange(async (event: { value: string[] }) => {
			const ids = event.value;
			if (ids.length !== 1) {
				selectedNoteId = null;
			} else {
				selectedNoteId = ids[0];

				await joplin.commands.execute('editor.execCommand', {
					name: 'cm6-show-diff-with',
					args: [await getContentToDiffWith(selectedNoteId)],
				});
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
				return await getContentToDiffWith(selectedNoteId);
			}

			return null;
		});

		await joplin.commands.register({
			name: 'showDiffWithNote',
			label: 'Compare the current note with another',
			iconName: 'fas fa-code-branch',
			execute: async () => {
				if (!selectedNoteId) return;

				const noteId = await pickNote(selectedNoteId);
				if (!selectedNoteId || noteId === null) {
					console.warn('No note selected.');
					return;
				}

				await setShowDiffWithId(selectedNoteId, noteId);
			},
		});
		await joplin.views.toolbarButtons.create(
			'show-diff-with',
			'showDiffWithNote',
			ToolbarButtonLocation.EditorToolbar,
		);
	},
});
