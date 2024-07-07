const makeLabeledInput = (labelText: string, type: string) => {
	const container = document.createElement('div');
	const labelElement = document.createElement('label');
	const inputElement = document.createElement('input');

	labelElement.appendChild(document.createTextNode(labelText));
	inputElement.type = type;

	container.replaceChildren(labelElement, inputElement);
	return { container, label: labelElement, input: inputElement };
};

export default makeLabeledInput;
