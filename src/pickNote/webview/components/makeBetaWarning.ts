import localization from '../../../localization';

const makeBetaWarning = () => {
	const warningContainer = document.createElement('div');
	warningContainer.classList.add('beta-warning');
	warningContainer.appendChild(document.createTextNode(localization.betaWarning));
	return warningContainer;
};

export default makeBetaWarning;
