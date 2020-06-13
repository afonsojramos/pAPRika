import { readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import * as ts from 'typescript'
import { TextDocument } from 'vscode-languageserver'
import Replacement from './replacement'
import SugestionProvider from './suggestion-provider'
import { runTest } from './test-runner'

interface SyntaxKindToTextMap {
	[key: number]: string
}

const mathOperators: number[] = [
	ts.SyntaxKind.SlashToken,
	ts.SyntaxKind.AsteriskToken,
	ts.SyntaxKind.MinusToken,
	ts.SyntaxKind.PlusToken,
	ts.SyntaxKind.PercentToken
]

const mathOperatorsToText: SyntaxKindToTextMap = {
	[ts.SyntaxKind.SlashToken]: '/',
	[ts.SyntaxKind.AsteriskToken]: '*',
	[ts.SyntaxKind.MinusToken]: '-',
	[ts.SyntaxKind.PlusToken]: '+',
	[ts.SyntaxKind.PercentToken]: '%'
}

const comparisonOperators: number[] = [
	ts.SyntaxKind.FirstBinaryOperator,
	ts.SyntaxKind.LessThanToken,
	ts.SyntaxKind.LessThanEqualsToken,
	ts.SyntaxKind.EqualsEqualsToken,
	ts.SyntaxKind.EqualsEqualsEqualsToken,
	ts.SyntaxKind.ExclamationEqualsEqualsToken,
	ts.SyntaxKind.ExclamationEqualsToken,
	ts.SyntaxKind.GreaterThanEqualsToken,
	ts.SyntaxKind.GreaterThanToken
]

const comparisonOperatorsToText: SyntaxKindToTextMap = {
	[ts.SyntaxKind.FirstBinaryOperator]: '<',
	[ts.SyntaxKind.LessThanToken]: '<',
	[ts.SyntaxKind.LessThanEqualsToken]: '<=',
	[ts.SyntaxKind.EqualsEqualsToken]: '==',
	[ts.SyntaxKind.EqualsEqualsEqualsToken]: '===',
	[ts.SyntaxKind.ExclamationEqualsEqualsToken]: '!==',
	[ts.SyntaxKind.ExclamationEqualsToken]: '!=',
	[ts.SyntaxKind.GreaterThanEqualsToken]: '>=',
	[ts.SyntaxKind.GreaterThanToken]: '>'
}

const logicalOperators: number[] = [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken]

const logicalOperatorsToText: SyntaxKindToTextMap = {
	[ts.SyntaxKind.AmpersandAmpersandToken]: '&&',
	[ts.SyntaxKind.BarBarToken]: '||'
}

const booleanOperators: number[] = [ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.TrueKeyword]

const booleanOperatorsToText: SyntaxKindToTextMap = {
	[ts.SyntaxKind.FalseKeyword]: 'false',
	[ts.SyntaxKind.TrueKeyword]: 'true'
}

const operators = [mathOperators, comparisonOperators, logicalOperators]

const operatorsToText = [mathOperatorsToText, comparisonOperatorsToText, logicalOperatorsToText]

// TODO: Find alternative to Test PASS and FAIL Decoration
/* const passDecorationType = vscode.window.createTextEditorDecorationType({
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

function decorate(editor: vscode.TextEditor, testResults: TestResultObject[]): void {
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

	let passDecorationsArray: DecorationOptions[] = [];
	let failDecorationsArray: DecorationOptions[] = [];
    
	for (let testIndex = 0; testIndex < testResults.length; testIndex++) {
		let lineIndex: number = testLines[testIndex];
		let line: string = documentLines[lineIndex];

		let range = new Range(
			new Position(lineIndex, line.length),
			new Position(lineIndex, line.length)
		);

		if (testResults[testIndex].passed) {
			passDecorationsArray.push({range});
		} else {
			failDecorationsArray.push({range});
		}

		editor.setDecorations(passDecorationType, passDecorationsArray);
		editor.setDecorations(failDecorationType, failDecorationsArray);
	}
} */

/**
 * Exported function to generate variations of a `functionName` within a file.
 *
 * @param {string} filePath File path of the given file.
 * @param {string} functionName Name of function being tested.
 * @param {TextDocument} document Text document
 * @param {SugestionProvider} suggestionProvider
 */
async function generateVariations(
	filePath: string,
	testCode: string,
	document: TextDocument,
	suggestionProvider: SugestionProvider
) {
	const originalFileContent: string = readFileSync(filePath).toString()
	const functionNode: ts.FunctionDeclaration | ts.ArrowFunction | undefined =
		getFunctionDeclarationNode(filePath, functionName) || getArrowFunctionNode(filePath, functionName)

	if (!functionNode) {
		console.error('ERROR: Could not find a function with the name provided in the failing test')
		return
	}

	let replacementList: Replacement[] = new Array()
	const extension: string = /(?:\.([^.]+))?$/.exec(filePath)![1]
	visitDoReplacements(functionNode!, replacementList)

	replacementList.map((replacement, index) => {
		const variation: string = replaceLines(originalFileContent, replacement)
		const variationFileName: string = `${dirname(filePath)}\\tmp${functionName}${index}.${extension}`
		writeFileSync(variationFileName, variation)

		runTest(variationFileName, document, [replacement], functionName, suggestionProvider)
	})

	replacementList = []

	const originalFunction: string = ts.isFunctionDeclaration(functionNode)
		? functionNode!.getText()
		: functionNode!.parent.getText()
	const switchExpressionsVariations: string[] = switchExpressions(
		originalFileContent,
		originalFunction,
		replacementList
	)

	switchExpressionsVariations.map((switchExpressionsVariation, index) => {
		const variation: string = switchExpressionsVariation
		const variationFileName: string = `${dirname(filePath)}\\tmp${functionName}switch${index}.${extension}`
		writeFileSync(variationFileName, variation)

		runTest(variationFileName, document, [replacementList[index]], functionName, suggestionProvider)
	})
}

/**
 * Creates `Replacements` on a given node and its respective children.
 *
 * @param {ts.Node} node The given node.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 */
function visitDoReplacements(node: ts.Node, replacementList: Replacement[]) {
	try {
		if (ts.isBinaryExpression(node)) {
			generateSwitchVariants(node, replacementList)
			generateParenthesesVariants(node, replacementList)
			generateOffByOneVariants(node, replacementList)
			generateOperatorVariants(node, replacementList)
		}

		if (ts.isIdentifier(node)) {
			generateOffByOneIdentifierVariants(node, replacementList)
		}

		if (ts.isVariableDeclaration(node)) {
			generateOffByOneVariants(node, replacementList)
		}

		if (ts.isElementAccessExpression(node)) {
			generateOffByOneVariants(node, replacementList)
		}

		if (isBooleanKind(node)) {
			generateBooleanVariant(node, replacementList)
		}

		if (ts.isPrefixUnaryExpression(node)) {
			generateRemovePrefixVariant(node, replacementList)
		}
	} catch (error) {
		console.warn(`ERROR: ${error}`)
	}

	ts.forEachChild(node, (child) => visitDoReplacements(child, replacementList))
}

/**
 * Switches expressions order for a given function.
 *
 * @param {string} fileText File's content.
 * @param {string} functionText Function's content.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 * @returns {string[]} Respective variations.
 */
function switchExpressions(fileText: string, functionText: string, replacementList: Replacement[]): string[] {
	const functionLines: string[] = functionText.split('\n')
	const functionStartPos: number = fileText.indexOf(functionText)
	let variations: string[] = []

	for (let i = 0; i < functionLines.length - 1; i++) {
		let variationLines = [...functionLines]
		;[variationLines[i], variationLines[i + 1]] = [variationLines[i + 1], variationLines[i]]
		const variationText = fileText.replace(functionText, variationLines.join('\n'))
		variations.push(variationText)

		const startPos: number = fileText.indexOf(functionLines[i], functionStartPos)
		const endPos: number = startPos + functionLines[i].length + functionLines[i + 1].length + 1
		const oldText: string = [functionLines[i], functionLines[i + 1]].join('\n')
		const newText: string = [variationLines[i], variationLines[i + 1]].join('\n')
		const replacement: Replacement = Replacement.replace(startPos, endPos, oldText, newText)

		replacementList.push(replacement)
	}

	return variations
}

/**
 * Generates Operator Variants on a given node.
 *
 * @param {ts.Node} node The given node.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 */
function generateOperatorVariants(node: ts.Node, replacementList: Replacement[]) {
	const operator: ts.Node = node.getChildAt(1)

	for (let opIdx = 0; opIdx < operators.length; opIdx++) {
		if (operators[opIdx].includes(operator.kind)) {
			operators[opIdx]
				.filter((op) => op !== operator.kind)
				.forEach((newOperator) => {
					const operatorText = operatorsToText[opIdx][newOperator]
					const replacement: Replacement = Replacement.replace(
						operator.getStart(),
						operator.getEnd(),
						operator.getText(),
						operatorText
					)
					replacementList.push(replacement)
				})
		}
	}
}

/**
 * Generates Off By One Variants on a given node.
 *
 * @param {ts.Node} node The given node.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 */
function generateOffByOneVariants(node: ts.Node, replacementList: Replacement[]) {
	const rhsNode: ts.Node = node.getChildAt(2)
	const rhsNodeText: string = rhsNode.getText()
	const replacementPlusOne: Replacement = Replacement.replace(
		rhsNode.getStart(),
		rhsNode.getEnd(),
		rhsNodeText,
		`(${rhsNodeText} + 1)`
	)
	const replacementMinusOne: Replacement = Replacement.replace(
		rhsNode.getStart(),
		rhsNode.getEnd(),
		rhsNodeText,
		`(${rhsNodeText} - 1)`
	)
	replacementList.push(replacementPlusOne)
	replacementList.push(replacementMinusOne)
}

/**
 * Generates Off By One Identifier Variants on a given node.
 *
 * @param {ts.Node} node The given node.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 */
function generateOffByOneIdentifierVariants(node: ts.Node, replacementList: Replacement[]) {
	const nodeText: string = node.getFullText().replace(/\s/g, '')
	const replacementPlusOne: Replacement = Replacement.replace(
		node.getStart(),
		node.getEnd(),
		nodeText,
		`(${nodeText} + 1)`
	)
	const replacementMinusOne: Replacement = Replacement.replace(
		node.getStart(),
		node.getEnd(),
		nodeText,
		`(${nodeText} - 1)`
	)
	replacementList.push(replacementPlusOne)
	replacementList.push(replacementMinusOne)
}

/**
 * Generates Switch Variants on a given node.
 *
 * @param {ts.Node} node The given node.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 */
function generateSwitchVariants(node: ts.Node, replacementList: Replacement[]) {
	const lhsNode: ts.Node = node.getChildAt(0)
	const lhsNodeText: string = lhsNode.getText()
	const operator: ts.Node = node.getChildAt(1)
	const operatorText: string = operator.getFullText()
	const rhsNode: ts.Node = node.getChildAt(2)
	const rhsNodeText: string = rhsNode.getText()
	const newText: string = rhsNodeText + operatorText + lhsNodeText
	const replacement: Replacement = Replacement.replace(
		lhsNode.getStart(),
		rhsNode.getEnd(),
		node.getFullText(),
		newText
	)
	replacementList.push(replacement)
}

/**
 * Generates Parethesis Variants on a given node.
 *
 * @param {ts.Node} node The given node.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 */
function generateParenthesesVariants(node: ts.Node, replacementList: Replacement[]) {
	const lhsNode: ts.Node = node.getChildAt(0)
	const lhsNodeText: string = lhsNode.getText()
	const rhsNode: ts.Node = node.getChildAt(2)
	const rhsNodeText: string = rhsNode.getText()
	const replacementLeftPar: Replacement = Replacement.replace(
		lhsNode.getStart(),
		lhsNode.getEnd(),
		lhsNodeText,
		`(${lhsNodeText})`
	)
	const replacementRightPar: Replacement = Replacement.replace(
		rhsNode.getStart(),
		rhsNode.getEnd(),
		rhsNodeText,
		`(${rhsNodeText})`
	)
	replacementList.push(replacementLeftPar)
	replacementList.push(replacementRightPar)
}

/**
 * Generates Remove Prefix Variants on a given node.
 *
 * @param {ts.Node} node The given node.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 */
function generateRemovePrefixVariant(node: ts.Node, replacementList: Replacement[]) {
	const prefix: ts.Node = node.getChildAt(0)
	const replacement: Replacement = Replacement.replace(prefix.getStart(), prefix.getEnd(), prefix.getText(), '')
	replacementList.push(replacement)
}

/**
 * Generates Boolean Variants on a given node.
 *
 * @param {ts.Node} node The given node.
 * @param {Replacement[]} replacementList Replacement List passed as reference.
 */
function generateBooleanVariant(node: ts.Node, replacementList: Replacement[]) {
	const operatorText = !(booleanOperatorsToText[node.kind] === 'true')
	const replacement: Replacement = Replacement.replace(
		node.getStart(),
		node.getEnd(),
		node.getText(),
		operatorText.toString()
	)
	replacementList.push(replacement)
}

/**
 * Verifies if a node is of Boolean Kind.
 *
 * @param {ts.Node} node The given node.
 * @returns {boolean} True if node is of Boolean Kind, false otherwise.
 */
function isBooleanKind(node: ts.Node): boolean {
	return booleanOperators.includes(node.kind)
}

/**
 * Replace lines in original file based on `replacement` and returns updated file.
 *
 * @param {string} originalFile Original file content.
 * @param {Replacement} replacement Replacement.
 * @returns {string} New file content.
 */
function replaceLines(originalFile: string, replacement: Replacement): string {
	let newFile: string = originalFile
	newFile = newFile.slice(0, replacement.start) + replacement.newText + newFile.slice(replacement.end, newFile.length)
	return newFile
}

/**
 * Extracts the TestIdentifier if available from a Mocha test.
 *
 * @param {Mocha.Test} test
 * @returns {({ functionName: string; className: string } | undefined)}
 */
function getTestIdentifier(test: Mocha.Test): TestIdentifier | undefined {
	const testTitle: string = test.title
	const regex: RegExp = new RegExp(/(?<={).*(?=})/)
	const results: RegExpExecArray | null = regex.exec(testTitle)
	if (results === null) return undefined

	const splitResult = results[0].split('.')
	return {
		testCode: results[0],
		className: splitResult.length > 1 ? splitResult[0] : '',
		functionName: splitResult.length > 1 ? splitResult[1] : splitResult[0]
	}
}

/**
 * Finds a Function Declaration Node with a specific name in a file.
 *
 * @param {string} filePath The corresponding file path.
 * @param {string} functionName The function's name to be found.
 * @returns {(ts.FunctionDeclaration | undefined)}The Function Declaration Node.
 */
function getFunctionDeclarationNode(filePath: string, functionName: string): ts.FunctionDeclaration | undefined {
	const syntaxList: ts.Node = getSyntaxList(filePath)
	const functionDeclarations: ts.FunctionDeclaration[] = syntaxList.getChildren().filter(ts.isFunctionDeclaration)

	return functionDeclarations.find((functionNode) => isFunctionName(functionName, functionNode))
}

/**
 * Finds an Arrow Function Node with a specific name in a file.
 *
 * @param {string} filePath The corresponding file path.
 * @param {string} functionName The function's name to be found.
 * @returns {(ts.ArrowFunction | undefined)} The Arrow Function Node.
 */
function getArrowFunctionNode(filePath: string, functionName: string): ts.ArrowFunction | undefined {
	const syntaxList: ts.Node = getSyntaxList(filePath)
	const variableStatements: ts.VariableStatement[] = syntaxList.getChildren().filter(ts.isVariableStatement)

	const arrowFunctionDeclarations = variableStatements.find((variableStatement) =>
		variableStatement.declarationList.declarations.find((functionNode) =>
			isNodeName(testIdentifier.functionName, functionNode)
		)
	)
	const variableDeclarationList = arrowFunctionDeclarations?.getChildren().find(ts.isVariableDeclarationList)
	const syntaxListArrow = variableDeclarationList
		?.getChildren()
		.find((node) => node.kind === ts.SyntaxKind.SyntaxList)
	const variableDeclaration = syntaxListArrow?.getChildren().find(ts.isVariableDeclaration)
	const arrowFunction = variableDeclaration?.getChildren().find(ts.isArrowFunction)

	return arrowFunction
}

/**
 * Return syntax list of a given file.
 *
 * @param {string} filePath Path of corresponding file.
 * @returns {ts.Node} Node of the syntax list.
 */
function getSyntaxList(filePath: string): ts.Node {
	const sourceFile: ts.SourceFile = ts.createSourceFile(
		'tmpDeclaration.ts',
		readFileSync(filePath).toString(),
		ts.ScriptTarget.Latest,
		true
	)
	return sourceFile.getChildAt(0)
}

function getTSNodeText(node: ts.Node): string {
	const tempSourceFile: ts.SourceFile = ts.createSourceFile('temp.js', '', ts.ScriptTarget.Latest, true)
	return ts.createPrinter().printNode(ts.EmitHint.Unspecified, node, tempSourceFile)
}

/**
 * Verifies if provided name in `comparable` is the same as
 * the provided `functionNode`'s name.
 *
 * @param {string} comparable Function name string.
 * @param {(ts.FunctionDeclaration | ts.VariableDeclaration | ts.MethodDeclaration | ts.ClassDeclaration)} node
 * Node to be compared.
 * @returns {boolean}  Respective boolean for the verification.
 */
function isNodeName(
	comparable: string,
	node: ts.FunctionDeclaration | ts.VariableDeclaration | ts.MethodDeclaration | ts.ClassDeclaration
): boolean {
	const identifier:
		| ts.Identifier
		| ts.ObjectBindingPattern
		| ts.ArrayBindingPattern
		| ts.StringLiteral
		| ts.NumericLiteral
		| ts.ComputedPropertyName
		| ts.PrivateIdentifier
		| undefined = node.name

	if (identifier) {
		return comparable === (identifier.getText() || ('text' in identifier ? identifier.text : ''))
	}

	return false
}

function testIdentifierFromTestCode(testCode: string): TestIdentifier {
	const splitTestCode: string[] = testCode.split('.')
	const testIdentifier: TestIdentifier = {
		testCode: testCode,
		functionName: splitTestCode.length > 1 ? splitTestCode[1] : splitTestCode[0],
		className: splitTestCode.length > 1 ? splitTestCode[0] : ''
	}

	return testIdentifier
}

function syntaxKindToName(kind: ts.SyntaxKind): string {
	return (<any>ts).SyntaxKind[kind]
}

export {
	generateVariations,
	getTestIdentifier,
	generateOperatorVariants,
	generateSwitchVariants,
	generateParenthesesVariants,
	generateOffByOneVariants,
	generateOffByOneIdentifierVariants,
	generateBooleanVariant,
	generateRemovePrefixVariant,
	getFunctionDeclarationNode,
	getSyntaxList,
	getArrowFunctionNode,
	TestIdentifier
}
