import debounce from '../../../utils/debounce';
import {
	NoteSearchResult,
	WebViewMessage,
	WebViewMessageType,
	WebViewResponse,
} from '../../messaging';
import makeLabeledInput from './makeLabeledInput';
import makeSuggestionList from './makeSuggestionList';

type WebViewAPI = {
	postMessage(message: WebViewMessage): Promise<WebViewResponse>;
};
declare const webviewApi: WebViewAPI;

const makeNoteInput = (onAccept: (id: string) => void) => {
	const container = document.createElement('div');
	container.classList.add('note-picker');

	const { container: searchInputContainer, input: pickNoteInput } = makeLabeledInput(
		'Search:',
		'text',
	);
	searchInputContainer.classList.add('search');
	const { container: searchResultContainer, setSuggestions } = makeSuggestionList(onAccept);

	let defaultSuggestions: NoteSearchResult[] = [];

	pickNoteInput.oninput = debounce(async () => {
		if (!pickNoteInput.value) {
			setSuggestions(defaultSuggestions, null);
			return;
		}

		const noteData = await webviewApi.postMessage({
			type: WebViewMessageType.SearchNotes,
			query: pickNoteInput.value,
		});

		let cursor = noteData.cursor;
		const loadMoreResults = async () => {
			const results = await webviewApi.postMessage({
				type: WebViewMessageType.SearchNotes,
				query: pickNoteInput.value,
				cursor,
			});
			cursor = results.cursor;
			return results.results;
		};

		setSuggestions(noteData.results, noteData.hasMore ? loadMoreResults : null);
	}, 300);

	void (async () => {
		defaultSuggestions = (await webviewApi.postMessage({
			type: WebViewMessageType.GetDefaultSuggestions,
		}))!.results;
		setSuggestions(defaultSuggestions, null);
	})();

	container.replaceChildren(searchInputContainer, searchResultContainer);
	return container;
};

export default makeNoteInput;
