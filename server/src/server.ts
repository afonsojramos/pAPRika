import {
	Connection,
	createConnection,
	DidChangeConfigurationNotification,
	InitializeParams,
	InitializeResult,
	ProposedFeatures,
	TextDocuments,
	TextDocumentSyncKind,
	CodeActionKind,
	CodeActionParams
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { uriToFilePath } from 'vscode-languageserver/lib/files';
import SuggestionProvider from './suggestion-provider';
import { runTestSuite } from './test-runner';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection: Connection = createConnection(ProposedFeatures.all);

// Saved connection to Suggestion Provider for Diagnostics Sending
let suggestionProvider = new SuggestionProvider(connection);

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;
let hasCodeActionLiteralsCapability: boolean = false;

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
	hasCodeActionLiteralsCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.codeAction &&
		capabilities.textDocument.codeAction.codeActionLiteralSupport
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that the server supports code completion
			completionProvider: {
				resolveProvider: true
			},
			executeCommandProvider: {
				commands: ['pAPRika.runAPRSuite']
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

	if (hasCodeActionLiteralsCapability) {
		result.capabilities.codeActionProvider = {
			codeActionKinds: [CodeActionKind.QuickFix]
		};
	}

	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders((_event) => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

connection.onDidChangeConfiguration((change) => {
	if (change.settings) {
		globalSettings = <PAPRikaSettings>(change.settings.pAPRika || defaultSettings);
	}
});

connection.onCodeAction((codeActionParams: CodeActionParams) => {
	if (!codeActionParams.context.diagnostics.length) {
		return [];
	}
	const textDocument = documents.get(codeActionParams.textDocument.uri);
	if (textDocument === undefined) {
		return [];
	}
	const codeActions = suggestionProvider.quickFix(textDocument.uri, codeActionParams.context.diagnostics);
	return codeActions;
});

connection.onExecuteCommand(async (handler) => {
	var coiso = await connection.window.createWorkDoneProgress();
	coiso.begin('running', 0.5, 'oh shit here he comes again', false);
	//coiso.report(.70);
	/* connection.window.attachWorkDoneProgress('2/5');
	let type = new ProgressType();
	connection.sendProgress(type, '2/6', 2); */
	handler.command == 'pAPRika.runAPRSuite' && documents.all().forEach(runPAPRika);
	coiso.done();
});

/**
 * Runs test suite for document if its path is valid.
 *
 * @param {TextDocumentChangeEvent<TextDocument>} documentEvent
 */
function runPAPRika(document: TextDocument) {
	let testSuitePath: string | undefined = uriToFilePath(document.uri);

	console.info('Running pAPRika on:', testSuitePath);
	testSuitePath !== undefined && runTestSuite(testSuitePath, document, suggestionProvider);
}

// Listen on the connection
connection.listen();
