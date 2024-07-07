import { ContentScriptContext, MarkdownEditorContentScriptModule } from 'api/types';
import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { unifiedMergeView } from '@codemirror/merge';

export default (context: ContentScriptContext): MarkdownEditorContentScriptModule => {
	return {
		plugin: async (editorControl) => {
			const editor: EditorView = editorControl.cm6;
			if (!editor) return;

			const diffExtensionCompartment = new Compartment();
			editorControl.addExtension([diffExtensionCompartment.of([])]);

			const updateMergeView = (originalItemContent: string | null) => {
				const mergeExtension =
					originalItemContent !== null
						? unifiedMergeView({
								original: originalItemContent,
							})
						: null;
				editor.dispatch({
					effects: [diffExtensionCompartment.reconfigure(mergeExtension ? [mergeExtension] : [])],
				});
			};

			editorControl.registerCommand('cm6-show-diff-with', (itemContent: string | null) => {
				if (itemContent !== null) {
					// The merge view needs to be cleared before it can be used again.
					updateMergeView(null);
				}

				updateMergeView(itemContent);
			});
			updateMergeView(await context.postMessage('getMergeContent'));
		},
	};
};
