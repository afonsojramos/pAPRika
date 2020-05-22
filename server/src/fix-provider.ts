import { isNullOrUndefined } from 'util';
import {
	CodeAction,
	CodeActionKind,
	Connection,
	Diagnostic,
	DiagnosticSeverity,
	TextDocument
} from 'vscode-languageserver';
import Replacement from './replacement';

export default class SuggestionProvider {
	private connection: Connection;
	private diagnosticsDocs: Map<String, Diagnostic[]> = new Map<String, Diagnostic[]>();

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
	async suggestChanges(textDocument: TextDocument, replacementList: Replacement[]) {
		const diagnostics: Diagnostic[] = [];

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
		let existingDiagnostics = this.diagnosticsDocs.get(textDocument.uri);
		existingDiagnostics && diagnostics.push(...existingDiagnostics);
		await this.updateDiagnostics(textDocument.uri, diagnostics);
	}
}
