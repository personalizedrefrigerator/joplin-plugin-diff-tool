import debounce from '../../../utils/debounce';
import { WebViewMessage, WebViewMessageType, WebViewResponse } from '../../messaging';
import makeLabeledInput from './makeLabeledInput';
import makeSuggestionList from './makeSuggestionList';

type WebViewAPI = {
	postMessage(message: WebViewMessage): Promise<WebViewResponse>;
};
declare const webviewApi: WebViewAPI;

const makeNoteInput = (onAccept: (id: string) => void) => {
	const container = document.createElement('div');

	const { container: pickNoteContainer, input: pickNoteInput } = makeLabeledInput(
		'Search:',
		'text',
	);
	const { container: searchResultContainer, setSuggestions } = makeSuggestionList(onAccept);

	pickNoteInput.oninput = debounce(async () => {
		const noteData = await webviewApi.postMessage({
			type: WebViewMessageType.SearchNotes,
			query: pickNoteInput.value,
		});

		let cursor = noteData.cursor;
		const loadMoreResults = async () => {
			const results = await webviewApi.postMessage({
				type: WebViewMessageType.GetMoreResults,
				cursor,
			});
			return results!.results;
		};

		setSuggestions(noteData.results, loadMoreResults);
	}, 300);

	const suggestionContainer = document.createElement('div');
	suggestionContainer.classList.add('note-suggestions');

	void (async () => {
		const defaultSuggestions = (await webviewApi.postMessage({
			type: WebViewMessageType.GetDefaultSuggestions,
		}))!.results;
		setSuggestions(defaultSuggestions, null);
	})();

	container.replaceChildren(pickNoteContainer, searchResultContainer);
	return container;
};

export default makeNoteInput;
