import joplin from 'api';
import {
	NoteSearchResult,
	WebViewMessage,
	WebViewMessageType,
	WebViewResponse,
	WebViewResponseType,
} from './messaging';
import { ViewHandle } from 'api/types';
import noteLinkToId from '../utils/noteLinkToId';

let dialogHandle: ViewHandle | null = null;
const pickNote = async (currentNoteId?: string) => {
	const dialog = dialogHandle ?? (await joplin.views.dialogs.create('diff-dialog'));
	dialogHandle = dialog;

	await joplin.views.dialogs.addScript(dialog, 'pickNote/webview/webview.js');
	await joplin.views.dialogs.addScript(dialog, 'pickNote/webview/style.css');
	await joplin.views.dialogs.setHtml(
		dialog,
		`
			<h2>Select a note to compare with</h2>
	`,
	);

	let result: string | null = null;
	await joplin.views.panels.onMessage(
		dialog,
		async (message: WebViewMessage): Promise<WebViewResponse> => {
			if (message.type === WebViewMessageType.OnNoteSelected) {
				result = message.noteId;
				void joplin.views.dialogs.setButtons(dialog, [
					{ title: 'OK', id: 'ok' },
					{ title: 'Cancel', id: 'cancel' },
				]);
				return null;
			} else if (message.type === WebViewMessageType.SearchNotes) {
				const query = message.query;
				const results = await joplin.data.get(['search'], {
					query: message.query,
					fields: ['id', 'title'],
					page: message.cursor,
				});

				let resultList: NoteSearchResult[] = [];

				if ((message.cursor ?? 0) === 0) {
					const id = noteLinkToId(query);
					if (id) {
						const note = await joplin.data.get(['notes', id]);
						resultList.push({
							title: note.title,
							id: note.id,
							description: null,
						});
					}
				}

				resultList = resultList.concat(
					results.items.map((item: any) => ({
						id: item.id,
						title: item.title,
						description: '',
					})),
				);

				return {
					type: WebViewResponseType.NoteList,
					results: resultList,
					hasMore: results.has_more,
					cursor: (message.cursor ?? 0) + 1,
				};
			} else if (message.type === WebViewMessageType.GetDefaultSuggestions) {
				const defaultChoices: NoteSearchResult[] = [
					{ title: 'None', id: '', description: 'Chooses no notes.' },
				];

				// Include original notes, if a conflict.
				if (currentNoteId) {
					const currentNote = await joplin.data.get(['notes', currentNoteId], {
						fields: ['title', 'id', 'conflict_original_id'],
						include_deleted: 1,
					});
					if (currentNote && currentNote.conflict_original_id) {
						const original = await joplin.data.get(['notes', currentNote.conflict_original_id]);
						if (original) {
							defaultChoices.push({
								title: original.title,
								id: original.id,
								description: 'Original note for this conflict.',
							});
						}
					}
				}

				return {
					type: WebViewResponseType.NoteList,
					results: defaultChoices,
					hasMore: false,
				};
			}
		},
	);

	await joplin.views.dialogs.setButtons(dialog, [{ title: 'Cancel', id: 'cancel' }]);
	const dialogOpenResult = await joplin.views.dialogs.open(dialog);

	return dialogOpenResult.id === 'cancel' ? null : result;
};

export default pickNote;
