// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as tests from './tests-interface';
import SuggestionActionProvider from './suggestion-action-provider';
import { TestResultObject } from './tests-interface';

const passDecorationType = vscode.window.createTextEditorDecorationType({
	after: {
		contentText: ' // passed',
		textDecoration: 'none; opacity: 0.35'
	}
});

const failDecorationType = vscode.window.createTextEditorDecorationType({
	after: {
		contentText: ' // failed',
		textDecoration: 'none; color: #DC143C; opacity: 0.35'
	}
});

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let selector: vscode.DocumentSelector = {scheme: 'file', language: 'javascript'};
	let suggestionActionProvider = new SuggestionActionProvider(context.subscriptions);
	
	vscode.languages.registerCodeActionsProvider(selector, suggestionActionProvider);
	
	vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
		suggestionActionProvider.cleanSuggestions();
		
		let testSuitePath: string | undefined = document.uri.path;
		if (testSuitePath !== undefined) {
			tests.runTestSuite(testSuitePath, document, suggestionActionProvider);
		}
	});

	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		suggestionActionProvider.cleanSuggestions();
		
		let testSuitePath: string | undefined = document.uri.path;
		if (testSuitePath !== undefined) {
			tests.runTestSuite(testSuitePath, document, suggestionActionProvider);
		}
	});
}


export function decorate(editor: vscode.TextEditor, testResults: TestResultObject[]): void {
    let documentText: string = editor.document.getText();
    let documentLines: string[] = documentText.split('\n');
    let testLines: number[] = [];
    let testRegex = /it\((\'|\").*(\'|\")/;

    for (let lineIndex = 0; lineIndex < documentLines.length; lineIndex++) {
        let match = documentLines[lineIndex].match(testRegex);

        if (match !== null && match.index !== undefined) {
            testLines.push(lineIndex);
        }
    }

	let passDecorationsArray: vscode.DecorationOptions[] = [];
	let failDecorationsArray: vscode.DecorationOptions[] = [];
    
    for (let testIndex = 0; testIndex < testResults.length; testIndex++) {
        let lineIndex: number = testLines[testIndex];
        let line: string = documentLines[lineIndex];

        let range = new vscode.Range(
            new vscode.Position(lineIndex, line.length),
            new vscode.Position(lineIndex, line.length)
        );

        if (testResults[testIndex].passed) {
            passDecorationsArray.push({range});
        } else {
            failDecorationsArray.push({range});
        }

        editor.setDecorations(passDecorationType, passDecorationsArray);
        editor.setDecorations(failDecorationType, failDecorationsArray);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {}

process.setMaxListeners(0);