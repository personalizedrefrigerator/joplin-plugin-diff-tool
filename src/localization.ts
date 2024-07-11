interface AppLocalization {
	noteSearch__loadMore: string;
	noteSearch__search: string;
	noteSelect__none: string;
	noteSelect__chooseNoNotes: string;
	noteSelect__conflictOriginalNote: string;
	noteSelect__cancel: string;
	betaWarning: string;
}

const defaultStrings: AppLocalization = {
	noteSearch__loadMore: 'Load more',
	noteSearch__search: 'Search:',
	noteSelect__none: 'None',
	noteSelect__chooseNoNotes: 'Chooses no notes.',
	noteSelect__conflictOriginalNote: 'The original note for this conflict.',
	noteSelect__cancel: 'Cancel',
	betaWarning:
		'Warning: Due to occasional crashes related to syntax highlighting and @codemirror/merge, this plugin is in beta.',
};

const localizations: Record<string, AppLocalization> = {
	en: defaultStrings,

	es: {
		...defaultStrings,
		noteSearch__search: 'Buscar:',
		noteSelect__cancel: 'Cancelar',
	},
};

let localization: AppLocalization | undefined;

const languages = [...navigator.languages];
for (const language of navigator.languages) {
	const localeSep = language.indexOf('-');

	if (localeSep !== -1) {
		languages.push(language.substring(0, localeSep));
	}
}

for (const locale of languages) {
	if (locale in localizations) {
		localization = localizations[locale];
		break;
	}
}

if (!localization) {
	console.log('No supported localization found. Falling back to default.');
	localization = defaultStrings;
}

export default localization!;
