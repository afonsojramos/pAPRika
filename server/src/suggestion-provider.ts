import { Diagnostic, DiagnosticSeverity, TextDocument, Range, CodeActionContext, CodeAction, CancellationToken, Command } from 'vscode-languageserver';
import Replacement from './replacement';

function suggestChangesLint(textDocument: TextDocument, replacementList: Replacement[]) {
	let diagnostics: Diagnostic[] = new Array<Diagnostic>();

	replacementList.forEach((replacement: Replacement) => {
		let diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Error,
			range: {
				start: textDocument.positionAt(replacement.start),
				end: textDocument.positionAt(replacement.end)
			},
			message: 'Replace: ' + replacement.oldText + ' ==> ' + replacement.newText,
			source: 'ProperFix'
		};
		diagnostics.push(diagnostic);
	});
}

function provideCodeActions(document: TextDocument, range: Range | Selection, context: CodeActionContext, token: CancellationToken): CodeAction[] {
	console.log('Range ' + range);
	return context.diagnostics.map((diagnostic: Diagnostic) => {
		return {
			title: 'Accept code suggestion',
			//command: commandId,
			command: Command.create('ProperFix', 'extension.runCodeAction'),
			arguments: [document, diagnostic.range, diagnostic.message]
		};
	});
}

function runCodeAction(document: TextDocument, range: Range, message: string): any {
	let fromRegex: RegExp = /.*Replace:(.*)==>.*/g;
	let fromMatch: RegExpExecArray | null = fromRegex.exec(message.replace(/\s/g, ''));
	let from = fromMatch![1];
	let to: string = document.getText(range).replace(/\s/g, '');
	if (from === to) {
		let newText = /[\s\S]*==>\s([\s\S]*)/g.exec(message)![1];
		/* let edit = new WorkspaceEdit();
		edit.replace(document.uri, range, newText);
		this.diagnosticCollection.clear();
		return vscode.workspace.applyEdit(edit); */
	} else {
		/* vscode.window.showErrorMessage('The suggestion was not applied because the source code changed.');
		this.diagnosticCollection.clear(); */
	}
}

export { suggestChangesLint, provideCodeActions, runCodeAction };
