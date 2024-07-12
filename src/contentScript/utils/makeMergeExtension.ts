import { unifiedMergeView } from '@codemirror/merge';
import { EditorView, PanelConstructor, showPanel } from '@codemirror/view';
import localization from '../../localization';
import { MainProcessApi } from '../types';
import { Extension } from '@codemirror/state';

const makePanelView = (mergeSource: MergeSource, ipc: MainProcessApi): PanelConstructor => {
	const dom = document.createElement('div');
	dom.classList.add('note-compare-panel');

	const comparingWithMessage = document.createElement('div');
	comparingWithMessage.appendChild(document.createTextNode(localization.merge__comparingWith));

	const comparingWithLink = document.createElement('button');
	comparingWithLink.classList.add('note-compare-link-button');

	comparingWithLink.textContent = mergeSource.title;
	comparingWithLink.onclick = () => {
		ipc.goToNote(mergeSource.id);
	};
	comparingWithMessage.appendChild(comparingWithLink);

	const stopComparingButton = document.createElement('button');
	stopComparingButton.classList.add('note-compare-link-button');

	stopComparingButton.textContent = localization.merge__stop;
	stopComparingButton.onclick = () => {
		ipc.stopMerge();
	};

	dom.replaceChildren(comparingWithMessage, stopComparingButton);

	return (_view: EditorView) => {
		return { dom, top: true };
	};
};

const makeMergeExtension = (source: MergeSource, ipc: MainProcessApi): Extension => {
	return [
		unifiedMergeView({
			original: source.content,
		}),
		showPanel.of(makePanelView(source, ipc)),
		EditorView.theme({
			'& .note-compare-panel': {
				display: 'flex',
				flexDirection: 'row',
				fontFamily: 'sans-serif',
				padding: '4px',
				justifyContent: 'space-between',
			},
			'& .note-compare-link-button': {
				textDecoration: 'underline',
				border: 'none',
				backgroundColor: 'transparent',
				fontSize: 'inherit',
				color: 'var(--joplin-url-color)',
				cursor: 'pointer',
			},
			'& .cm-panels-top': {
				// Prevents the panel from being covered by the editor
				zIndex: 2,
			},
		}),
	];
};

export default makeMergeExtension;
