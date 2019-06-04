import * as ts from "typescript";
import { readFileSync, fstat, writeFileSync } from "fs";
import { runTestSuiteOnce } from "./tests-interface";
import Replacement from "./replacement";
import SuggestionActionProvider from "./suggestion-action-provider";
import * as vscode from 'vscode';

interface SyntaxKindToTextMap {
    [key: number]: string;
}

const mathOperators: number[] = [ts.SyntaxKind.SlashToken, ts.SyntaxKind.AsteriskToken, ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken];
const mathOperatorsToText: SyntaxKindToTextMap = {
    [ts.SyntaxKind.SlashToken]: "/",
    [ts.SyntaxKind.AsteriskToken]: "*",
    [ts.SyntaxKind.MinusToken]: "-",
    [ts.SyntaxKind.PlusToken]: "+"
};

function generateVariations(filePath: string, functionName: string, document: vscode.TextDocument, suggestionActionProvider: SuggestionActionProvider) {
    let functionNode: ts.FunctionDeclaration | undefined = getFunctionDeclaration(filePath, functionName);
    let replacementList: Replacement[] = new Array();
    visitDoReplacements(functionNode!, replacementList);

    for (let index = 0; index < replacementList.length; index++) {
        let variation: string = replaceLines(readFileSync(filePath).toString(), replacementList[index]);
        let variationFileName: string = `/home/diogocampos/workspace/feup/diss/project/sample-project/test/tmp${functionName}${index}.ts`;
        writeFileSync(variationFileName, variation);
        runTestSuiteOnce(filePath, variationFileName, document, [replacementList[index]], suggestionActionProvider);
    }
}

function visitDoReplacements(node: ts.Node, replacementList: Replacement[]) {
    if (ts.isBinaryExpression(node)) {
        generateMathOperatorVariants(node, replacementList);
    }

    ts.forEachChild(node, (child) => visitDoReplacements(child, replacementList));
}

function generateMathOperatorVariants(node: ts.Node, replacementList: Replacement[]) {
    const operator: ts.Node = node.getChildAt(1);
    if (mathOperators.includes(operator.kind)) {
        mathOperators.filter((op) => op !== operator.kind).forEach((newOperator) => {
            const operatorText = mathOperatorsToText[newOperator];
            const replacement: Replacement = Replacement.replace(operator.getStart(), operator.getEnd(), getTSNodeText(operator), operatorText);
            replacementList.push(replacement);
        });
    }
}

function replaceLines(originalFile: string, replacement: Replacement): string {
    let newFile: string = originalFile;
    newFile = newFile.slice(0, replacement.start) + replacement.newText + newFile.slice(replacement.end, newFile.length);
    return newFile;
}

function getTestedFunctionName(test: Mocha.Test): string | undefined { 
    const testTitle: string = test.title;
    const regex: RegExp = new RegExp(/(?<=#fix\s*{).*(?=})/);
    const results: RegExpExecArray | null = regex.exec(testTitle);

    if (results !== null && results.length >= 1) {
        return results[0];
    }

    return undefined;
}

function getFunctionDeclaration(filePath: string, functionName: string): ts.FunctionDeclaration | undefined {
    const sourceFile: ts.SourceFile = ts.createSourceFile('tmpDeclaration.ts', readFileSync(filePath).toString(), ts.ScriptTarget.Latest, true);
    const syntaxList: ts.Node = sourceFile.getChildAt(0);
    const functionDeclarations: ts.FunctionDeclaration[] = syntaxList.getChildren().filter(ts.isFunctionDeclaration);
    
    return functionDeclarations.find((functionNode) => isFunctionName(functionName, functionNode));
}

function suggestChanges(document: vscode.TextDocument, replacementList: Replacement[], suggestionActionProvider: SuggestionActionProvider) {
    suggestionActionProvider.suggestChangesLint(document, replacementList);
}

function getTSNodeText(node: ts.Node): string {
    const tempSourceFile: ts.SourceFile = ts.createSourceFile('temp.js', '', ts.ScriptTarget.Latest, true);
    return ts.createPrinter().printNode(ts.EmitHint.Unspecified, node, tempSourceFile);
}

function isFunctionName(comparable: string, functionNode: ts.FunctionDeclaration): boolean {
    const identifier: ts.Identifier | undefined = functionNode.name;

    if (identifier) {
        return identifier.getText() === comparable;
    }

    return false;
}

function syntaxKindToName(kind: ts.SyntaxKind): string {
    return (<any>ts).SyntaxKind[kind];
}

export {
    generateVariations,
    getTestedFunctionName,
    getFunctionDeclaration,
    suggestChanges
};