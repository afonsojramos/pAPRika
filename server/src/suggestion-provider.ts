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
import { WorkDoneProgress } from 'vscode-languageserver/lib/progress';

const INITIAL_PROGRESS_PERCENTAGE = 25;

export default class SuggestionProvider {
	private connection: Connection;
	private diagnosticsDocs: Map<String, Diagnostic[]> = new Map<String, Diagnostic[]>();
	private currentProgress: number = 0;
	private progressStep: number = 0;
	private paprikaProgress: WorkDoneProgress | undefined;

	constructor(connection: Connection) {
		this.connection = connection;
	}

	/**
	 * Sends a Progress Notification to the Code Editor.
	 *
	 * @param {number} numberOfActions Number of actions for the test suite of the base file.
	 * @param {string} message
	 * @memberof SuggestionProvider
	 */
	async startProgressFeedback(numberOfActions: number, message: string) {
		this.paprikaProgress = await this.connection.window.createWorkDoneProgress();
		this.paprikaProgress.begin(`pAPRika: ${message}`, 0);
		this.currentProgress = 0;

		this.progressStep = INITIAL_PROGRESS_PERCENTAGE / numberOfActions;
		this.paprikaProgress?.report(Math.ceil(this.progressStep));
	}

	/**
	 * Sends updated reports of progress to the Code Editor.
	 * If numberOfActions is provided, updates the progressStep.
	 *
	 * @param {number} [numberOfActions=0] Number of actions for the generation and testing of variations.
	 * @memberof SuggestionProvider
	 */
	updateProgressFromStep(numberOfActions: number = 0) {
		if (numberOfActions) this.progressStep = (INITIAL_PROGRESS_PERCENTAGE * 2) / numberOfActions;
		else {
			this.currentProgress += this.progressStep;

			this.paprikaProgress?.report(Math.ceil(this.currentProgress));
		}
	}

	/**
	 * Terminates process.
	 *
	 * @memberof SuggestionProvider
	 */
	terminateProgress() {
		this.paprikaProgress?.done();
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
				message: `Replace: ${replacement.oldText} ==> ${replacement.newText}`,
				source: 'pAPRika'
			};
			diagnostics.push(diagnostic);
		});

		const existingDiagnostics = this.diagnosticsDocs.get(textDocument.uri) || [];
		const newDiagnostics = diagnostics.filter((diag) => {
			return existingDiagnostics?.find((newDiag) => diag === newDiag) ? false : true;
		});
		newDiagnostics.push(...existingDiagnostics);

		this.updateDiagnostics(textDocument.uri, newDiagnostics);
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
	 * Deletes all diagnostics for a Document
	 *
	 * @param {string} textDocumentUri
	 * @memberof SuggestionProvider
	 */
	resetDiagnostics(textDocumentUri: string) {
		console.info(`Reset diagnostics for ${textDocumentUri}`);
		this.connection.sendDiagnostics({ uri: textDocumentUri, diagnostics: [] });
		this.diagnosticsDocs.set(textDocumentUri, []);
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
