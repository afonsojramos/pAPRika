// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as tests from './tests-interface';
import SuggestionActionProvider from './suggestion-action-provider';

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

// this method is called when your extension is deactivated
export function deactivate() {}

process.setMaxListeners(0);