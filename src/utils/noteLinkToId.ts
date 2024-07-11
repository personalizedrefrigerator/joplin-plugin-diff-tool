const noteLinkToId = (linkOrId: string) => {
	if (!linkOrId) {
		return null;
	}

	const idMatch = /^\s*(?:[:]\/)?([a-z0-9]{32})\s*$/.exec(linkOrId);
	if (idMatch) {
		return idMatch[1];
	}

	const markdownLinkMatch = /^\s*\[.*\]\(:\/([a-z0-9]+)\)\s*$/.exec(linkOrId);
	if (markdownLinkMatch) {
		return markdownLinkMatch[1];
	}

	const externalLinkMatch = /^joplin:\/\/.*\/openNote\?id=([a-z0-9]+)$/.exec(linkOrId);
	if (externalLinkMatch) {
		return externalLinkMatch[1];
	}

	return null;
};

export default noteLinkToId;
