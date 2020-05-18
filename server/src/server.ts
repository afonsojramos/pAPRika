/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import {
	Connection,
	createConnection,
	DidChangeConfigurationNotification,
	InitializeParams,
	InitializeResult,
	ProposedFeatures,
	TextDocumentChangeEvent,
	TextDocuments,
	TextDocumentSyncKind
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { uriToFilePath } from 'vscode-languageserver/lib/files';
import SuggestionProvider from './suggestion-provider';
import { runTestSuite } from './test-runner';
import ts = require('typescript');

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection: Connection = createConnection(ProposedFeatures.all);

// Saved connection to Suggestion Provider for Diagnostics Sending
let suggestionProvider = new SuggestionProvider(connection);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
	hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that the server supports code completion
			completionProvider: {
				resolveProvider: true
			}
		}
	};

	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders((_event) => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

interface PAPRikaSettings {
	runOnSave: boolean;
	runOnOpen: boolean;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: PAPRikaSettings = {
	runOnSave: true,
	runOnOpen: true
};
let globalSettings: PAPRikaSettings = defaultSettings;

connection.onDidChangeConfiguration((change) => {
	if (change.settings) {
		globalSettings = <PAPRikaSettings>(change.settings.pAPRika || defaultSettings);
	}
});

/**
 * Runs test suite for document if its path is valid.
 *
 * @param {TextDocumentChangeEvent<TextDocument>} documentEvent
 */
async function runPAPRika(documentEvent: TextDocumentChangeEvent<TextDocument>) {
	let testSuitePath: string | undefined = uriToFilePath(documentEvent.document.uri);

	console.info('Running pAPRika on:', testSuitePath);
	testSuitePath !== undefined && runTestSuite(testSuitePath, documentEvent.document, suggestionProvider);
}

documents.onDidClose((e) => {});

documents.onDidChangeContent((change) => {});

documents.onDidSave(async (documentEvent) => {
	console.log(globalSettings);

	globalSettings.runOnSave && runPAPRika(documentEvent);
});

documents.onDidOpen(async (documentEvent) => {
	globalSettings.runOnOpen && runPAPRika(documentEvent);
});

connection.onDidChangeWatchedFiles((_change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
