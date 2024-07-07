export enum WebViewMessageType {
	SearchNotes = 'SearchNotes',
	GetDefaultSuggestions = 'GetDefaultSuggestions',
	GetMoreResults = 'GetMoreResults',
	OnNoteSelected = 'OnNoteSelected',
}

interface SearchNotesMessage {
	type: WebViewMessageType.SearchNotes;
	query: string;
}

interface GetMoreResultsMessage {
	type: WebViewMessageType.GetMoreResults;
	cursor: number;
}

interface GetDefaultSuggestionsMessage {
	type: WebViewMessageType.GetDefaultSuggestions;
}

interface OnNoteSelected {
	type: WebViewMessageType.OnNoteSelected;
	noteId: string;
}

export type WebViewMessage =
	| SearchNotesMessage
	| GetDefaultSuggestionsMessage
	| GetMoreResultsMessage
	| OnNoteSelected;

export enum WebViewResponseType {
	NoteList = 'noteList',
}

export interface NoteSearchResult {
	id: string;
	title: string;
	description: string;
}

export type WebViewResponse = {
	type: WebViewResponseType.NoteList;
	results: NoteSearchResult[];
	hasMore: boolean;

	cursor?: number;
} | null;
