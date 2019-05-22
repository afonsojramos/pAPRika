import * as ts from "typescript";
import { readFileSync, fstat, writeFileSync } from "fs";
import { runTestSuiteOnce } from "./tests-interface";
import Replacement from "./replacement";
import SuggestionActionProvider from "./suggestion-action-provider";
import * as vscode from 'vscode';
    
const mathOperators: number[] = [ts.SyntaxKind.SlashToken, ts.SyntaxKind.AsteriskToken, ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken];

class Variation {
    constructor(readonly variation: string, readonly replacementList: Replacement[]) {}
}
  
function generateVariations(filePath: string, functionName: string, document: vscode.TextDocument, suggestionActionProvider: SuggestionActionProvider) {
    let codeVariations: Variation[] = [];
    
    let functionNode: ts.FunctionDeclaration | undefined = getFunctionDeclaration(filePath, functionName);
    
    // TODO hardcoded
    if (functionNode !== undefined) {
        let block: ts.Block | undefined = functionNode!.getChildren().find(ts.isBlock);
        let syntaxList: ts.Node | undefined = block!.getChildren().find((child) => child.kind === ts.SyntaxKind.SyntaxList);
        let returnStatement: ts.ReturnStatement | undefined = syntaxList!.getChildren().find(ts.isReturnStatement);
        let binaryExpression: ts.BinaryExpression | undefined = returnStatement!.getChildren().find(ts.isBinaryExpression);
        let mathOperator: ts.Node | undefined = binaryExpression!.getChildren().find(isMathOperator);

        mathOperators.filter((op) => op !== mathOperator!.kind).forEach((operator) => {
            let replacementList: Replacement[] = new Array();
            visitReplaceOperator(functionNode!, operator, replacementList);
            codeVariations.push(new Variation(replaceLines(readFileSync(filePath).toString(), replacementList), replacementList));
        });
    }

    const sourceFile: ts.SourceFile = ts.createSourceFile('tmpDeclaration.ts', readFileSync(filePath).toString(), ts.ScriptTarget.Latest, true);

    for (let index = 0; index < codeVariations.length; index++) {
        let variation: string = codeVariations[index].variation;
        let variationFileName: string = `/home/diogocampos/workspace/feup/diss/project/sample-project/test/tmpVar${index}.ts`;
        writeFileSync(variationFileName, variation);
        runTestSuiteOnce(filePath, variationFileName, document, codeVariations[index].replacementList, suggestionActionProvider);
    }
}

function visitReplaceOperator(node: ts.Node, operator: number, replacementList: Replacement[]) {
    if (ts.isBinaryExpression(node)) {
        const newNode: ts.Node = ts.createBinary(<ts.Expression> node.getChildAt(0), operator, <ts.Expression> node.getChildAt(2));
        const replacement: Replacement = Replacement.replace(node.getStart(), node.getEnd(), getTSNodeText(node), getTSNodeText(newNode));
        replacementList.push(replacement);
    }

    ts.forEachChild(node, (child) => visitReplaceOperator(child, operator, replacementList));
}

function replaceLines(originalFile: string, replacementList: Replacement[]): string {
    let newFile: string = originalFile;

    replacementList.forEach((replacement: Replacement) => {
        newFile = newFile.slice(0, replacement.start) + replacement.newText + newFile.slice(replacement.end, newFile.length);
    });

    //console.log(newFile);

    return newFile;
}

function getTestedFunctionName(test: Mocha.Test): string {
    const testCode: string = test.body;
    const sourceFile: ts.SourceFile = ts.createSourceFile('tmp.ts', testCode, ts.ScriptTarget.Latest, true);
    let expressionStatementList: ts.Node[] = getExpressionStatementList(sourceFile);

    // hardcoded for now
    let assertCallExpression: ts.Node = expressionStatementList[0].getChildAt(0);
    let testedCallExpression: ts.Node = assertCallExpression.getChildAt(2).getChildAt(0);
    let testedFunctionName: string = testedCallExpression.getChildAt(0).getFullText();
    
    return testedFunctionName;
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

function oldSuggestChanges(originalPath: string, modifiedPath: string) {
    const originalFile: string[] = readFileSync(originalPath).toString().match(/^.+$/gm) || [];
    const modifiedFile: string[] = readFileSync(modifiedPath).toString().match(/^.+$/gm) || [];

    const originalSourceFile: ts.SourceFile = ts.createSourceFile('tmpOriginal.ts', readFileSync(originalPath).toString(), ts.ScriptTarget.Latest, true);
    const modifiedSourceFile: ts.SourceFile = ts.createSourceFile('tmpModified.ts', readFileSync(modifiedPath).toString(), ts.ScriptTarget.Latest, true);
    
    let lineNumber: number = 0;
    let differences: Object[] = [];

    console.log(originalFile.length);
    console.log(modifiedFile.length);

    for (lineNumber = 0; lineNumber < Math.max(originalFile.length, modifiedFile.length); lineNumber++) {
        let originalLine: string = originalFile[lineNumber];
        let modifiedLine: string = modifiedFile[lineNumber];

        if (originalLine !== modifiedLine) {
            differences.push({
                'originalLine': originalLine,
                'modifiedLine': modifiedLine,
                'lineNumber': lineNumber
            });
        }
    }   

    console.log(differences);
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

function isMathOperator(node: ts.Node) {
    return mathOperators.includes(node.kind);
}

function getExpressionStatementList(node: ts.Node): ts.Node[] {
    let expressionList: ts.Node[] = [];

    if (ts.isExpressionStatement(node)) {
        return [node];
    }

    for (let child of node.getChildren()) {
        expressionList = expressionList.concat(getExpressionStatementList(child));
    }

    return expressionList;
}

export {
    generateVariations,
    getTestedFunctionName,
    getFunctionDeclaration,
    suggestChanges
};