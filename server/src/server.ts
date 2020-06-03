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
	CodeActionParams,
	TextDocumentContentChangeEvent
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { uriToFilePath } from 'vscode-languageserver/lib/files'
import SuggestionProvider from './suggestion-provider'
import { runTestSuite } from './test-runner'

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection: Connection = createConnection(ProposedFeatures.all)

// Saved connection to Suggestion Provider for Diagnostics Sending
let suggestionProvider = new SuggestionProvider(connection)

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

// Make the text document manager listen on the connection
// for open, change and close text document events
// This call has to be called here or some connection handlers won't work
documents.listen(connection)

let hasConfigurationCapability: boolean = false
let hasWorkspaceFolderCapability: boolean = false
let hasDiagnosticRelatedInformationCapability: boolean = false
let hasCodeActionLiteralsCapability: boolean = false

interface PAPRikaSettings {
	runOnSave: boolean
	runOnOpen: boolean
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: PAPRikaSettings = {
	runOnSave: true,
	runOnOpen: true
}
let globalSettings: PAPRikaSettings = defaultSettings

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities

	// Does the client support the `workspace/configuration` request?
	// If not, we will fall back using global settings
	hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration)
	hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders)
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	)
	hasCodeActionLiteralsCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.codeAction &&
		capabilities.textDocument.codeAction.codeActionLiteralSupport
	)

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
	}

	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		}
	}

	if (hasCodeActionLiteralsCapability) {
		result.capabilities.codeActionProvider = {
			codeActionKinds: [CodeActionKind.QuickFix]
		}
	}

	return result
})

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type)
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders((_event) => {
			connection.console.log('Workspace folder change event received.')
		})
	}

	require('ts-node').register()
})

documents.onDidSave((documentEvent) => {
	globalSettings.runOnSave && runPAPRika(documentEvent.document)
})

documents.onDidOpen((documentEvent) => {
	globalSettings.runOnOpen && runPAPRika(documentEvent.document)
})

connection.onDidChangeConfiguration((change) => {
	if (change.settings) {
		globalSettings = <PAPRikaSettings>(change.settings.pAPRika || defaultSettings)
	}
})

connection.onCodeAction((codeActionParams: CodeActionParams) => {
	if (!codeActionParams.context.diagnostics.length) {
		return
	}
	const textDocument = documents.get(codeActionParams.textDocument.uri)
	if (textDocument === undefined) {
		return
	}
	const codeActions = suggestionProvider.quickFix(textDocument.uri, codeActionParams.context.diagnostics)
	return codeActions
})

connection.onDidChangeTextDocument((params) => {
	console.info(`${params.textDocument.uri} changed`)

	params.contentChanges.forEach((change: TextDocumentContentChangeEvent) => {
		suggestionProvider.updateRangeOnChange(params.textDocument.uri, change)
	})
})

connection.onExecuteCommand(async (handler) => {
	handler.command == 'pAPRika.runAPRSuite' && documents.all().forEach(runPAPRika)
})

/**
 * Runs test suite for document if its path is valid.
 *
 * @param {TextDocumentChangeEvent<TextDocument>} documentEvent
 */
function runPAPRika(document: TextDocument) {
	if (!hasDiagnosticRelatedInformationCapability) {
		connection.window.showErrorMessage('Code Editor has no Diagnostic Related Information Capability')
		return
	}

	let testSuitePath: string | undefined = uriToFilePath(document.uri)
	console.info(`Running pAPRika on: ${testSuitePath}`)
	testSuitePath !== undefined && runTestSuite(testSuitePath, document, suggestionProvider)
}

// Listen on the connection
connection.listen()
