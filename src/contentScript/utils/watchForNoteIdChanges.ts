import { EditorState, Extension, Facet } from '@codemirror/state';
import { CodeMirrorControl } from 'api/types';

type OnNoteIdChange = (id: string) => void;

// **Returns an extension** that watches for changes in the editor's note ID state.
const watchForNoteIdChanges = (
	editorControl: CodeMirrorControl,
	onChange: OnNoteIdChange,
): Extension => {
	const noteIdFacet: Facet<string, string> = editorControl.joplinExtensions.noteIdFacet;
	return EditorState.transactionExtender.of((tr) => {
		const initialId = tr.startState.facet(noteIdFacet);
		const finalId = tr.state.facet(noteIdFacet);
		if (initialId !== finalId) {
			onChange(finalId);
		}
		return {};
	});
};

export default watchForNoteIdChanges;
