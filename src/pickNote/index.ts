import joplin from 'api';
import {
	WebViewMessage,
	WebViewMessageType,
	WebViewResponse,
	WebViewResponseType,
} from './messaging';
import { ViewHandle } from 'api/types';

let dialogHandle: ViewHandle | null = null;
const pickNote = async () => {
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
				const results = await joplin.data.get(['search'], {
					query: message.query,
					fields: ['id', 'title'],
					page: message.cursor,
				});
				console.warn('results', results);

				return {
					type: WebViewResponseType.NoteList,
					results: results.items.map((item: any) => ({
						id: item.id,
						title: item.title,
						description: '',
					})),
					hasMore: results.has_more,
					cursor: (message.cursor ?? 0) + 1,
				};
			} else if (message.type === WebViewMessageType.GetDefaultSuggestions) {
				return {
					type: WebViewResponseType.NoteList,
					results: [{ title: 'None', id: '', description: 'Chooses no notes.' }],
					hasMore: false,
				};
			}
		},
	);

	await joplin.views.dialogs.setButtons(dialog, [{ title: 'Cancel', id: 'cancel' }]);
	const wasCancelled = !(await joplin.views.dialogs.open(dialog));

	return wasCancelled ? null : result;
};

export default pickNote;
