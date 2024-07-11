const makeBetaWarning = () => {
	const warningContainer = document.createElement('div');
	warningContainer.classList.add('beta-warning');
	warningContainer.appendChild(
		document.createTextNode(
			'Warning: Due to occasional crashes related to @codemirror/merge, this plugin is considered to be in beta.',
		),
	);
	return warningContainer;
};

export default makeBetaWarning;
