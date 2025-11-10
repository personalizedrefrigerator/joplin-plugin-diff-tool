import joplin from 'api';
import { ContentScriptType, MenuItemLocation, ModelType, ToolbarButtonLocation } from 'api/types';
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
		let selectedNoteIds: string[] = [];
		await joplin.workspace.onNoteSelectionChange(async (event: { value: string[] }) => {
			selectedNoteIds = [...event.value];
		});

		const contentScriptId = 'cm6-diff-view';
		await joplin.contentScripts.register(
			ContentScriptType.CodeMirrorPlugin,
			contentScriptId,
			'./contentScript/contentScript.js',
		);
		await joplin.contentScripts.onMessage(contentScriptId, async (message: unknown) => {
			if (message === 'getMergeContent' && selectedNoteIds.length) {
				return await getContentToDiffWith(selectedNoteIds[0]);
			} else if (message === 'stopMerge') {
				await setShowDiffWithId(selectedNoteIds[0], '');
			} else if (typeof message === 'object' && 'navigateToId' in message) {
				if (
					typeof message.navigateToId !== 'string' ||
					!message.navigateToId.match(/^[a-z0-9]{32}$/)
				) {
					throw new Error(`Invalid ID: ${message.navigateToId}`);
				}

				await joplin.commands.execute('openNote', message.navigateToId);
			}

			return null;
		});

		await joplin.commands.register({
			name: 'showDiffWithNote',
			label: 'Compare notes',
			iconName: 'fas fa-code-branch',
			enabledCondition: 'markdownEditorPaneVisible',
			execute: async (noteIds: string[] = []) => {
				if (noteIds.length > 2) {
					void joplin.views.dialogs.showToast({
						message:
							'Comparing more than two notes is unsupported. Only the first two notes will be compared.',
					});
				}

				const noteIdSource = noteIds[0] ?? selectedNoteIds[0];
				if (!noteIdSource) {
					console.warn('No source note ID.');
					return;
				}

				const noteIdDest = noteIds[1] ?? selectedNoteIds[1] ?? (await pickNote(noteIdSource));
				if (!noteIdDest) {
					console.warn('No destination note ID.');
					return;
				}

				if (selectedNoteIds.length > 1) {
					await joplin.commands.execute('openNote', noteIdSource);
				}
				await setShowDiffWithId(noteIdSource, noteIdDest);
			},
		});
		await joplin.views.toolbarButtons.create(
			'show-diff-with',
			'showDiffWithNote',
			ToolbarButtonLocation.EditorToolbar,
		);

		await joplin.views.menuItems.create(
			'diff.diff-compare',
			'showDiffWithNote',
			MenuItemLocation.NoteListContextMenu,
		);
	},
});
