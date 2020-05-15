import { CancellationToken, CodeAction, CodeActionContext, Command, Connection, Diagnostic, DiagnosticSeverity, Range, TextDocument } from 'vscode-languageserver';
import Replacement from './replacement';

export default class SuggestionProvider {
	private connection: Connection;

	constructor(connection: Connection) {
		this.connection = connection;
	}

	/**
	 * Sends suggested changes back to the code editor.
	 *
	 * @param {TextDocument} textDocument Document in question.
	 * @param {Replacement[]} replacementList List of suggested replacements.
	 * @memberof SuggestionProvider
	 */
	public suggestChanges(textDocument: TextDocument, replacementList: Replacement[]) {
		let diagnostics: Diagnostic[] = new Array<Diagnostic>();

		replacementList.forEach((replacement: Replacement) => {
			let diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: textDocument.positionAt(replacement.start),
					end: textDocument.positionAt(replacement.end)
				},
				message: 'Replace: ' + replacement.oldText + ' ==> ' + replacement.newText,
				source: 'pAPRika'
			};
			diagnostics.push(diagnostic);
		});

		this.connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	}

}
