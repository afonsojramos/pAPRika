import * as vscode from 'vscode';
import Replacement from "./replacement";

export default class SuggestionActionProvider implements vscode.CodeActionProvider {
    private static commandId: string = 'extension.runCodeAction';
    private diagnosticCollection: vscode.DiagnosticCollection;
    private command: vscode.Disposable;

    constructor(subscriptions: vscode.Disposable[]) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection();
        this.command = vscode.commands.registerCommand(SuggestionActionProvider.commandId, this.runCodeAction, this);
        subscriptions.push(this);
    }
    
    public dispose(): void {
        this.diagnosticCollection.dispose();
        this.command.dispose();
    }
    
    public suggestChangesLint(textDocument: vscode.TextDocument, replacementList: Replacement[]) {
        let diagnostics: vscode.Diagnostic[] = new Array<vscode.Diagnostic>();

        replacementList.forEach((replacement: Replacement) => {
            const severity: number = vscode.DiagnosticSeverity.Error;
            const message: string = "Replace: " + replacement.oldText + " ==> " + replacement.newText;
            const range: vscode.Range = new vscode.Range(textDocument.positionAt(replacement.start), textDocument.positionAt(replacement.end));
            const diagnostic: vscode.Diagnostic = new vscode.Diagnostic(range, message, severity);
            diagnostics.push(diagnostic);
        });

        this.diagnosticCollection.set(textDocument.uri, diagnostics);
    }

    public provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        return context.diagnostics.map((diagnostic) => {
            return {
                title: "Accept code suggestion",
                command: SuggestionActionProvider.commandId,
                arguments: [document, diagnostic.range, diagnostic.message]
            };
        });
    }
    
    private runCodeAction(document: vscode.TextDocument, range: vscode.Range, message: string): any {
        let fromRegex: RegExp = /.*Replace:(.*)==>.*/g;
        let fromMatch: RegExpExecArray | null = fromRegex.exec(message.replace(/\s/g, ''));
        let from = fromMatch![1];
        let to:string = document.getText(range).replace(/\s/g, '');
        if (from === to) {
            let newText = /.*==>\s(.*)/g.exec(message)![1];
            let edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, range, newText);
            this.diagnosticCollection.clear();
            return vscode.workspace.applyEdit(edit);
        } else {
            vscode.window.showErrorMessage("The suggestion was not applied because it is out of date. You might have tried to apply the same edit twice.");
        }

    }

}