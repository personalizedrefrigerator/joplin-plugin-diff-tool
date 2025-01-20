import joplin from 'api';
import { ContentScriptType, ModelType, ToolbarButtonLocation } from 'api/types';
import pickNote from './pickNote';

const showDiffWithIdKey = 'show-diff-with-id';

const loadNoteAsMergeSource = async (id: string): Promise<MergeSource> => {
	const note = await joplin.data.get(['notes', id], { fields: ['body', 'title'] });
	return {
		content: note.body,
		title: note.title,
		id,
	};
};

let lastDiffContent: MergeSource | null = null;
const showDiffWithContent = async (diffContent: MergeSource | null) => {
	if (diffContent === lastDiffContent) return;
	lastDiffContent = diffContent;

	try {
		await joplin.commands.execute('editor.execCommand', {
			name: 'cm6-show-diff-with',
			args: [diffContent],
		});
	} catch (error) {
		console.info('Failed to show diff:', error, '. Is the editor open?');
	}
};

const setShowDiffWithId = async (currentNoteId: string, otherNoteId: string | null) => {
	let diffContent: MergeSource | null;
	if (otherNoteId) {
		await joplin.data.userDataSet(ModelType.Note, currentNoteId, showDiffWithIdKey, otherNoteId);
		diffContent = await loadNoteAsMergeSource(otherNoteId);
	} else {
		await joplin.data.userDataDelete(ModelType.Note, currentNoteId, showDiffWithIdKey);
		diffContent = null;
	}
	await showDiffWithContent(diffContent);
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

const getContentToDiffWith = async (currentNoteId: string): Promise<MergeSource | null> => {
	const mergeNoteId = await getNoteIdToDiffWith(currentNoteId);
	if (!mergeNoteId) {
		return null;
	}

	try {
		return loadNoteAsMergeSource(mergeNoteId);
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

				await showDiffWithContent(await getContentToDiffWith(selectedNoteId));
			}
		});

		const contentScriptId = 'cm6-diff-view';
		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			contentScriptId,
			'./contentScript/contentScript.js',
		);
		await joplin.contentScripts.onMessage(contentScriptId, async (message: unknown) => {
			if (message === 'getMergeContent' && selectedNoteId) {
				return await getContentToDiffWith(selectedNoteId);
			} else if (message === 'stopMerge') {
				await setShowDiffWithId(selectedNoteId, '');
			} else if (typeof message === 'object' && 'navigateToId' in message) {
				await joplin.commands.execute('openNote', message.navigateToId);
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
