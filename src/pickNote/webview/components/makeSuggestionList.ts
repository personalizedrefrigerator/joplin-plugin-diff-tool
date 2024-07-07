import localization from '../../../localization';
import { NoteSearchResult } from '../../messaging';
import makeLabeledInput from './makeLabeledInput';

type LoadMoreResultsCallback = () => Promise<NoteSearchResult[]>;
type OnSuggestionAccept = (id: string) => void;

let idCounter = 0;

const makeSuggestionList = (onSuggestionAccept: OnSuggestionAccept) => {
	const container = document.createElement('div');
	const suggestionList = document.createElement('ul');
	const loadMoreLink = document.createElement('button');

	container.classList.add('suggestion-list');
	loadMoreLink.classList.add('more');
	suggestionList.classList.add('list');

	const radioGroupId = `suggestion-radio-option-${idCounter++}`;
	let acceptedSuggestionContainer: HTMLElement | null = null;

	const addSuggestions = (suggestions: NoteSearchResult[]) => {
		for (const suggestion of suggestions) {
			const suggestionContainer = document.createElement('li');
			suggestionContainer.classList.add('search-suggestion');

			const suggestionRadio = makeLabeledInput(suggestion.title, 'radio');
			suggestionRadio.container.classList.add('search-suggestion-option');

			suggestionRadio.input.name = radioGroupId;
			suggestionRadio.input.oninput = () => {
				if (acceptedSuggestionContainer) {
					acceptedSuggestionContainer.classList.remove('-accepted');
				}
				acceptedSuggestionContainer = suggestionContainer;
				suggestionContainer.classList.add('-accepted');

				onSuggestionAccept(suggestion.id);
			};

			suggestionContainer.onclick = () => {
				suggestionRadio.input.click();
			};

			const descriptionElement = document.createElement('div');
			descriptionElement.classList.add('description');
			descriptionElement.textContent = suggestion.description;

			suggestionContainer.replaceChildren(suggestionRadio.container, descriptionElement);
			suggestionList.appendChild(suggestionContainer);
		}
	};

	let getMoreResultsCallback: LoadMoreResultsCallback | null = null;
	loadMoreLink.textContent = localization.noteSearch__loadMore;
	loadMoreLink.onclick = async () => {
		loadMoreLink.disabled = true;
		try {
			if (getMoreResultsCallback) {
				const results = await getMoreResultsCallback();
				addSuggestions(results);
			}
		} finally {
			loadMoreLink.disabled = false;
		}
	};

	container.replaceChildren(suggestionList, loadMoreLink);

	return {
		container,
		setSuggestions(
			suggestions: NoteSearchResult[],
			loadMoreResults: null | LoadMoreResultsCallback,
		) {
			getMoreResultsCallback = loadMoreResults;
			if (getMoreResultsCallback) {
				container.classList.add('-hasMore');
			} else {
				container.classList.remove('-hasMore');
			}
			suggestionList.replaceChildren();
			addSuggestions(suggestions);
		},
	};
};

export default makeSuggestionList;
