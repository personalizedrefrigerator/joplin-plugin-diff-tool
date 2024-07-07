import { WebViewMessage, WebViewMessageType, WebViewResponse } from '../messaging';
import makeNoteInput from './components/makeNoteInput';

type WebViewAPI = {
	postMessage(message: WebViewMessage): Promise<WebViewResponse>;
};
declare const webviewApi: WebViewAPI;

(() => {
	const noteInput = makeNoteInput((id) => {
		webviewApi.postMessage({ type: WebViewMessageType.OnNoteSelected, noteId: id });
	});

	(document.querySelector('#joplin-plugin-content') ?? document.body).appendChild(noteInput);
})();
