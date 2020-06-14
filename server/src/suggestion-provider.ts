import { isNullOrUndefined } from 'util'
import {
	CodeAction,
	CodeActionKind,
	Connection,
	Diagnostic,
	DiagnosticSeverity,
	TextDocument,
	TextDocumentContentChangeEvent
} from 'vscode-languageserver'
import Replacement from './replacement'
import { WorkDoneProgress } from 'vscode-languageserver/lib/progress'

const INITIAL_PROGRESS_PERCENTAGE = 25

export default class SuggestionProvider {
	private connection: Connection
	private diagnosticsDocs: Map<String, Diagnostic[]> = new Map<String, Diagnostic[]>()
	private replacementsDocs: Map<String, Map<String, Replacement>> = new Map<String, Map<String, Replacement>>()
	private currentProgress: number = 0
	private progressStep: number = 0
	private paprikaProgress: WorkDoneProgress | undefined

	constructor(connection: Connection) {
		this.connection = connection
	}

	/**
	 * Sends a Progress Notification to the Code Editor.
	 *
	 * @param {number} numberOfActions Number of actions for the test suite of the base file.
	 * @param {string} message
	 * @memberof SuggestionProvider
	 */
	async startProgressFeedback(numberOfActions: number, message: string) {
		this.paprikaProgress = await this.connection.window.createWorkDoneProgress()
		this.paprikaProgress.begin(`pAPRika: ${message}`, 0)
		this.currentProgress = 0

		this.progressStep = INITIAL_PROGRESS_PERCENTAGE / numberOfActions
		this.paprikaProgress?.report(Math.ceil(this.progressStep))
	}

	/**
	 * Sends updated reports of progress to the Code Editor.
	 * If numberOfActions is provided, updates the progressStep.
	 *
	 * @param {number} [numberOfActions=0] Number of actions for the generation and testing of variations.
	 * @memberof SuggestionProvider
	 */
	updateProgressFromStep(numberOfActions: number = -1) {
		if (numberOfActions === 0) this.connection.window.showInformationMessage('pAPRika: All tests passed!')
		else if (numberOfActions > 0) this.progressStep = (INITIAL_PROGRESS_PERCENTAGE * 2) / numberOfActions
		else {
			this.currentProgress += this.progressStep

			this.paprikaProgress?.report(Math.ceil(this.currentProgress))
		}
	}

	/**
	 * Terminates process.
	 *
	 * @memberof SuggestionProvider
	 */
	terminateProgress() {
		this.paprikaProgress?.done()
	}

	sendWarningMessage(error: Error) {
		this.connection.window.showWarningMessage(
			`pAPRika - ${error.name}: ${error.message} (check pAPRika's output for more information)`
		)
		error.stack && console.error(`${error.name}: ${error.message}\n${error.stack}`)
	}

	/**
	 * Sends suggested changes back to the code editor.
	 *
	 * @param {TextDocument} textDocument Document in question.
	 * @param {Replacement[]} replacementList List of suggested replacements.
	 * @memberof SuggestionProvider
	 */
	async suggestChanges(textDocument: TextDocument, replacementList: Replacement[]) {
		const diagnostics: Diagnostic[] = []

		replacementList.forEach((replacement: Replacement) => {
			let diagnostic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					// Outputting wrong positions if document has changed
					start: textDocument.positionAt(replacement.start),
					end: textDocument.positionAt(replacement.end)
				},
				message: `Replace: \"${replacement.oldText
					.replace(/\n/, '\\n')
					.replace(/\t/g, ' ')
					.replace(/\s/g, ' ')
					.trim()}\" with \"${replacement.newText
					.replace(/\n/, '\\n')
					.replace(/\t/g, ' ')
					.replace(/\s/g, ' ')
					.trim()}\"`.replace(/ +/g, ' '),
				code: replacement.code,
				source: 'pAPRika'
			}
			diagnostics.push(diagnostic)
			this.updateReplacements(textDocument.uri, replacement)
		})

		const existingDiagnostics = this.diagnosticsDocs.get(textDocument.uri) || []
		const newDiagnostics = diagnostics.filter((diag) => {
			return existingDiagnostics?.find((newDiag) => diag === newDiag) ? false : true
		})
		newDiagnostics.push(...existingDiagnostics)

		this.updateDiagnostics(textDocument.uri, newDiagnostics)
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
		console.info(
			`Update diagnostics for ${textDocumentUri.replace(/^.*[\\\/]/, '')}: ${diagnostics.length} diagnostics sent`
		)
		this.diagnosticsDocs.set(textDocumentUri, diagnostics)
		this.connection.sendDiagnostics({ uri: textDocumentUri, diagnostics: diagnostics })
	}

	/**
	 * Adds a replacement to the map of a given TextDocument.
	 *
	 * @param {string} textDocumentUri
	 * @param {Replacement} replacement
	 * @memberof SuggestionProvider
	 */
	updateReplacements(textDocumentUri: string, replacement: Replacement) {
		const codeToReplacement = new Map<String, Replacement>()
		codeToReplacement.set(replacement.code, replacement)
		this.replacementsDocs.set(textDocumentUri, codeToReplacement)
	}

	/**
	 * Update diagnostics' range on document change
	 *
	 * @param {string} textDocumentUri
	 * @param {TextDocumentContentChangeEvent} change
	 * @memberof SuggestionProvider
	 */
	updateRangeOnChange(textDocumentUri: string, change: TextDocumentContentChangeEvent) {
		if ('range' in change) {
			const currentDiagnostics = this.diagnosticsDocs.get(textDocumentUri) || []
			const updatedDiagnostics = currentDiagnostics.reduce(
				(prevDiagnostics: Diagnostic[], diagnostic: Diagnostic) => {
					const changeArray = this.getLines(change.text)
					if (change.range.start.line <= diagnostic.range.end.line) {
						if (change.text.length === 0) {
							const deletedLinesNum = change.range.end.line - change.range.start.line
							console.log(`Deleted ${deletedLinesNum} lines`)
							diagnostic.range.start.line -= deletedLinesNum
							diagnostic.range.end.line -= deletedLinesNum
							if (change.range.end.line === diagnostic.range.start.line) {
								if (change.range.end.character > diagnostic.range.start.character) {
									console.log(`Removed Diagnostic`)
									return prevDiagnostics
								} else {
									const charDiff = change.range.end.character - change.range.start.character
									diagnostic.range.start.character -= charDiff
									diagnostic.range.end.character -= charDiff
									console.log('Removed Char')
								}
							}
						} else {
							console.log(`Changed ${diagnostic.range.start.line}`)
							diagnostic.range.start.line += changeArray.length - 1
							diagnostic.range.end.line += changeArray.length - 1
							if (change.range.end.line === diagnostic.range.start.line) {
								if (change.range.start.character === diagnostic.range.start.character)
									return prevDiagnostics
								else if (change.range.start.character < diagnostic.range.start.character) {
									diagnostic.range.start.character += change.text.length
									diagnostic.range.end.character += change.text.length
								}
							}
						}
					}

					prevDiagnostics.push(diagnostic)
					return prevDiagnostics
				},
				[]
			)

			this.updateDiagnostics(textDocumentUri, updatedDiagnostics)
		}
	}

	/**
	 * Split source string into array of lines.
	 *
	 * @param {string} changeText
	 * @returns
	 * @memberof SuggestionProvider
	 */
	getLines(changeText: string) {
		return changeText.replace(/\r?\n/g, '\r\n').split('\r\n')
	}

	/**
	 * Deletes all diagnostics for a Document
	 *
	 * @param {string} textDocumentUri
	 * @memberof SuggestionProvider
	 */
	resetDiagnostics(textDocumentUri: string) {
		console.info(`Reset diagnostics for ${textDocumentUri.replace(/^.*[\\\/]/, '')}`)
		this.connection.sendDiagnostics({ uri: textDocumentUri, diagnostics: [] })
		this.diagnosticsDocs.set(textDocumentUri, [])
		this.replacementsDocs.set(textDocumentUri, new Map<String, Replacement>())
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
			return []
		}

		const codeActions: CodeAction[] = []
		diagnostics.forEach((diagnostic) => {
			// Skip Diagnostics not from pAPRika
			if (diagnostic.source !== 'pAPRika') {
				return
			}

			const documentReplacements = this.replacementsDocs.get(textDocumentUri)
			const replacement =
				documentReplacements && diagnostic.code
					? documentReplacements.get(diagnostic.code.toString())
					: undefined

			replacement &&
				codeActions.push({
					title: diagnostic.message,
					kind: CodeActionKind.QuickFix,
					diagnostics: [diagnostic],
					edit: {
						changes: {
							[textDocumentUri]: [
								{
									range: diagnostic.range,
									newText: replacement.newText
								}
							]
						}
					}
				})
			return
		})

		return codeActions
	}
}
