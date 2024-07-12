import { ContentScriptContext, MarkdownEditorContentScriptModule } from 'api/types';
import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { MainProcessApi } from './types';
import makeMergeExtension from './utils/makeMergeExtension';

export default (context: ContentScriptContext): MarkdownEditorContentScriptModule => {
	return {
		plugin: async (editorControl) => {
			const editor: EditorView = editorControl.cm6;
			if (!editor) return;

			const diffExtensionCompartment = new Compartment();
			editorControl.addExtension([diffExtensionCompartment.of([])]);

			const mainProcessApi: MainProcessApi = {
				goToNote(id: string) {
					void context.postMessage({ navigateToId: id });
				},
				stopMerge() {
					void context.postMessage('stopMerge');
				},
			};

			const updateMergeView = (originalItem: MergeSource | null) => {
				const mergeExtension =
					originalItem !== null ? makeMergeExtension(originalItem, mainProcessApi) : null;

				editor.dispatch({
					effects: [diffExtensionCompartment.reconfigure(mergeExtension ? [mergeExtension] : [])],
				});
			};

			editorControl.registerCommand('cm6-show-diff-with', (originalItem: MergeSource | null) => {
				if (originalItem !== null) {
					// The merge view needs to be cleared before it can be used again.
					updateMergeView(null);
				}

				updateMergeView(originalItem);
			});
			updateMergeView(await context.postMessage('getMergeContent'));
		},
	};
};
