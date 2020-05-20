import { CodeAction, CodeActionKind, Diagnostic } from 'vscode-languageserver';
import { isNullOrUndefined } from 'util';

/**
 * Provide Quick Fix based on diagnostics.
 *
 * @param {string} textDocumentUri
 * @param {Diagnostic[]} diagnostics
 * @returns {CodeAction[]}
 */
function quickFix(textDocumentUri: string, diagnostics: Diagnostic[]): CodeAction[] {
	if (isNullOrUndefined(diagnostics) || diagnostics.length === 0) {
		return [];
	}

	const codeActions: CodeAction[] = [];
	diagnostics.forEach((diag) => {
		const replaceRegex: RegExp = /.*Replace:.*==>(.*)/g;
		const parsedText = diag.message.replace(/\s/g, '');
		const replaceRegexMatch: RegExpExecArray | null = replaceRegex.exec(parsedText);
		const newText = replaceRegexMatch![1];

		newText &&
			codeActions.push({
				title: diag.message,
				kind: CodeActionKind.QuickFix,
				diagnostics: [diag],
				edit: {
					changes: {
						[textDocumentUri]: [
							{
								range: diag.range,
								newText
							}
						]
					}
				}
			});
		return;
	});

	return codeActions;
}

export { quickFix };
