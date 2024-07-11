import { WebViewMessage, WebViewMessageType, WebViewResponse } from '../messaging';
import makeBetaWarning from './components/makeBetaWarning';
import makeNoteInput from './components/makeNoteInput';

type WebViewAPI = {
	postMessage(message: WebViewMessage): Promise<WebViewResponse>;
};
declare const webviewApi: WebViewAPI;

(() => {
	const container = document.createElement('div');
	container.classList.add('main-content');

	const noteInput = makeNoteInput((id) => {
		webviewApi.postMessage({ type: WebViewMessageType.OnNoteSelected, noteId: id });
	});

	container.replaceChildren(noteInput, makeBetaWarning());
	(document.querySelector('#joplin-plugin-content') ?? document.body).appendChild(container);
})();
