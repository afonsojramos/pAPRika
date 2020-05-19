import { CodeActionParams, CodeAction, CodeActionKind } from 'vscode-languageserver';
import { isNullOrUndefined } from 'util';

function quickFix(textDocumentUri: string, parms: CodeActionParams) {
	const diagnostics = parms.context.diagnostics;
	if (isNullOrUndefined(diagnostics) || diagnostics.length === 0) {
		return [];
	}

	const codeActions: CodeAction[] = [];
	diagnostics.forEach((diag) => {
		let fromRegex: RegExp = /.*Replace:(.*)==>./g;
		let fromMatch: RegExpExecArray | null = fromRegex.exec(diag.message.replace(/\s/g, ''));
		let from = fromMatch![1];
		console.log(from);

		codeActions.push({
			title: diag.message,
			kind: CodeActionKind.QuickFix,
			diagnostics: [diag],
			edit: {
				changes: {
					[textDocumentUri]: [
						{
							range: diag.range,
							newText: from
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
