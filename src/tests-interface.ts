import { unlinkSync } from "fs";
import * as vscode from 'vscode';
import * as Mocha from 'mocha';
import * as code from "./code-interface";
import Replacement from "./replacement";
import SuggestionActionProvider from "./suggestion-action-provider";
import { decorate } from "./extension";

interface TestListMap {
    [key: string]: Mocha.Test[];
}

interface TestResultObject {
    'test': Mocha.Test;
    'passed': boolean;
}

function getCompletePath(workspacePath: string): string | undefined {
    let workspaceFolders: vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;

    if (workspaceFolders !== undefined) {
        let completePath: string = workspaceFolders[0].uri.path + '/' + workspacePath;
        return completePath;
    }

    return undefined;
}

function runTestSuite(testSuitePath: string, document: vscode.TextDocument, suggestionActionProvider: SuggestionActionProvider) {
    let mocha: Mocha = new Mocha();
    mocha.addFile(testSuitePath);

    // see https://github.com/mochajs/mocha/issues/2783
    delete require.cache[require.resolve(testSuitePath)];

    try {
        let runner: Mocha.Runner = mocha.run();

        let failingTests: TestListMap = {};
        let testResults: TestResultObject[] = [];

        runner.on('fail', (test: Mocha.Test) => {
            testResults.push({
                "test": test,
                "passed": false
            });
            
            const testedFunctionName: string | undefined = code.getTestedFunctionName(test);

            if (testedFunctionName !== undefined && failingTests.hasOwnProperty(testedFunctionName)) {
                failingTests[testedFunctionName].push(test);
            } else if (testedFunctionName !== undefined) {
                failingTests[testedFunctionName] = [test];
            }
        });

        runner.on('pass', (test: Mocha.Test) => {
            testResults.push({
                "test": test,
                "passed": true
            });
        });

        runner.on('end', () => {
            Object.keys(failingTests).forEach(testedFunctionName => {
                if (testedFunctionName !== undefined) {
                    code.generateVariations(testSuitePath, testedFunctionName, document, suggestionActionProvider);
                }
            });

            const openEditor = vscode.window.visibleTextEditors.filter(
                editor => editor.document.uri === document.uri
            )[0];

            decorate(openEditor, testResults);
        });
    } catch (err) {
        console.log(err);
    }
}

function runTestSuiteOnce(testSuitePath: string, document: vscode.TextDocument, replacements: Replacement[], suggestionActionProvider: SuggestionActionProvider, functionName: string): void{
    let mocha: Mocha = new Mocha();
    mocha.addFile(testSuitePath);
    mocha.fgrep(functionName);

    // see https://github.com/mochajs/mocha/issues/2783
    delete require.cache[require.resolve(testSuitePath)];

    mocha.reporter('Dot');

    try {
        let runner: Mocha.Runner = mocha.run();
        let failingTestsList: Array<Mocha.Test> = [];

        runner.on('fail', (test: Mocha.Test) => {
            failingTestsList.push(test);
        });

        runner.on('end', () => {
            if (failingTestsList.length === 0) {
                code.suggestChanges(document, replacements, suggestionActionProvider);
            }

            unlinkSync(testSuitePath);
        });

    } catch (err) {
        console.log(err);
    }
}

export {
    TestResultObject,
    getCompletePath,
    runTestSuite,
    runTestSuiteOnce
};