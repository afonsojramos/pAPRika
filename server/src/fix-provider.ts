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

	/**
	 * Update diagnostics on client and store them in docsDiagnostics field
	 *
	 * @param {strin} textDocumentUri
	 * @param {Diagnostic[]} diagnostics
	 * @returns {Promise<void>}
	 * @memberof SuggestionProvider
	 */
	async updateDiagnostics(textDocumentUri: string, diagnostics: Diagnostic[]): Promise<void> {
		console.info(`Update diagnostics for ${textDocumentUri}: ${diagnostics.length} diagnostics sent`);
		this.connection.sendDiagnostics({ uri: textDocumentUri, diagnostics: diagnostics });
		this.diagnosticsDocs.set(textDocumentUri, diagnostics);
	}

	/**
	 * Provide Quick Fix based on diagnostics.
	 *
	 * @param {string} textDocumentUri
	 * @param {Diagnostic[]} diagnostics
	 * @returns {CodeAction[]}
	 */
	async quickFix(textDocumentUri: string, diagnostics: Diagnostic[]): Promise<CodeAction[]> {
		if (isNullOrUndefined(diagnostics) || diagnostics.length === 0) {
			return [];
		}

		const codeActions: CodeAction[] = [];
		diagnostics.forEach((diag) => {
			// Skip Diagnostics not from pAPRika
			if (diag.source !== 'pAPRika') {
				return;
			}

			const replaceRegex: RegExp = /.*Replace:.*==>(.*)/g;
			const parsedText = diag.message.replace(/\s/g, '');
			const replaceRegexMatch: RegExpExecArray | null = replaceRegex.exec(parsedText);

			replaceRegexMatch &&
				replaceRegexMatch[1] &&
				codeActions.push({
					title: diag.message,
					kind: CodeActionKind.QuickFix,
					diagnostics: [diag],
					edit: {
						changes: {
							[textDocumentUri]: [
								{
									range: diag.range,
									newText: replaceRegexMatch[1]
								}
							]
						}
					}
				});
			return;
		});

		return codeActions;
	}
}
