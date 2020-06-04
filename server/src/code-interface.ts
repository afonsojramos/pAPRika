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
	ts.SyntaxKind.PlusToken
]

const mathOperatorsToText: SyntaxKindToTextMap = {
	[ts.SyntaxKind.SlashToken]: '/',
	[ts.SyntaxKind.AsteriskToken]: '*',
	[ts.SyntaxKind.MinusToken]: '-',
	[ts.SyntaxKind.PlusToken]: '+'
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
}); */

/* function decorate(editor: vscode.TextEditor, testResults: TestResultObject[]): void {
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

async function generateVariations(
	filePath: string,
	functionName: string,
	document: TextDocument,
	suggestionProvider: SugestionProvider
) {
	const originalFileContent: string = readFileSync(filePath).toString()
	const functionNode: ts.FunctionDeclaration | undefined = getFunctionDeclaration(filePath, functionName)
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

	const originalFunction: string = functionNode!.getText()
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

function visitDoReplacements(node: ts.Node, replacementList: Replacement[]) {
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

	ts.forEachChild(node, (child) => visitDoReplacements(child, replacementList))
}

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

function generateOperatorVariants(node: ts.Node, replacementList: Replacement[]) {
	const operator: ts.Node = node.getChildAt(1)
	if (mathOperators.includes(operator.kind)) {
		mathOperators
			.filter((op) => op !== operator.kind)
			.forEach((newOperator) => {
				const operatorText = mathOperatorsToText[newOperator]
				const replacement: Replacement = Replacement.replace(
					operator.getStart(),
					operator.getEnd(),
					operator.getText(),
					operatorText
				)
				replacementList.push(replacement)
			})
	}

	if (comparisonOperators.includes(operator.kind)) {
		comparisonOperators
			.filter((op) => op !== operator.kind)
			.forEach((newOperator) => {
				const operatorText = comparisonOperatorsToText[newOperator]
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

function generateOffByOneVariants(node: ts.Node, replacementList: Replacement[]) {
	try {
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
	} catch (error) {
		console.error(error)
	}
}

function generateOffByOneIdentifierVariants(node: ts.Node, replacementList: Replacement[]) {
	const nodeText: string = node.getFullText()
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

function replaceLines(originalFile: string, replacement: Replacement): string {
	let newFile: string = originalFile
	newFile = newFile.slice(0, replacement.start) + replacement.newText + newFile.slice(replacement.end, newFile.length)
	return newFile
}

function getTestedFunctionName(test: Mocha.Test): string | undefined {
	const testTitle: string = test.title
	const regex: RegExp = new RegExp(/(?<={).*(?=})/)
	const results: RegExpExecArray | null = regex.exec(testTitle)

	if (results !== null && results.length >= 1) {
		return results[0]
	}

	return undefined
}

function getFunctionDeclaration(filePath: string, functionName: string): ts.FunctionDeclaration | undefined {
	const sourceFile: ts.SourceFile = ts.createSourceFile(
		'tmpDeclaration.ts',
		readFileSync(filePath).toString(),
		ts.ScriptTarget.Latest,
		true
	)
	const syntaxList: ts.Node = sourceFile.getChildAt(0)
	const functionDeclarations: ts.FunctionDeclaration[] = syntaxList.getChildren().filter(ts.isFunctionDeclaration)

	return functionDeclarations.find((functionNode) => isFunctionName(functionName, functionNode))
}

function getTSNodeText(node: ts.Node): string {
	const tempSourceFile: ts.SourceFile = ts.createSourceFile('temp.js', '', ts.ScriptTarget.Latest, true)
	return ts.createPrinter().printNode(ts.EmitHint.Unspecified, node, tempSourceFile)
}

function isFunctionName(comparable: string, functionNode: ts.FunctionDeclaration): boolean {
	const identifier: ts.Identifier | undefined = functionNode.name

	if (identifier) {
		return identifier.getText() === comparable
	}

	return false
}

function syntaxKindToName(kind: ts.SyntaxKind): string {
	return (<any>ts).SyntaxKind[kind]
}

export { generateVariations, getTestedFunctionName, getFunctionDeclaration }
