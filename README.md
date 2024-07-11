# Joplin Plugin Diff View

This plugin shows a diff that can be used to compare the content of related notes and to resolve conflicts.

At present, it only supports the mobile and desktop beta markdown editors.

> [!WARNING]
>
> Due to occasional crashes related to interactions between syntax highlighting and `@codemirror/merge`, this plugin should be considered to be **in beta**.

## Desktop setup

On desktop, be sure that the beta markdown editor is enabled. To do this, go to settings > general, then check "opt-in to the editor beta".

This plugin does not support the Rich Text Editor.

## Usage

This plugin adds a "compare" button to the desktop and mobile markdown toolbars.

To compare the current note with another:

1. Click "compare" (<img alt="branch icon" src="./images/compare-button.png" width="32"/>).
2. Search for a note ID, note title, or content.
   - The search bar supports the same search syntax as Joplin.
3. Click "OK".

To stop comparing with another note:

1. Click "compare" (<img alt="branch icon" src="./images/compare-button.png" width="32"/>).
2. Click "None".  
   <img alt="screenshot: Select a note to compare with, 'none' circled." src="./images/compare-with-no-notes.png" width="500"/>
3. Click "OK".
