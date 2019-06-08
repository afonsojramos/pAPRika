import { unlinkSync } from "fs";
import * as vscode from 'vscode';
import * as Mocha from 'mocha';
import * as code from "./code-interface";
import Replacement from "./replacement";
import SuggestionActionProvider from "./suggestion-action-provider";

interface TestListMap {
    [key: string]: Mocha.Test[];
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

    let failingTests: TestListMap = {};

    try {
        let runner: Mocha.Runner = mocha.run();

        runner.on('fail', (test: Mocha.Test) => {
            const testedFunctionName: string | undefined = code.getTestedFunctionName(test);

            if (testedFunctionName !== undefined && failingTests.hasOwnProperty(testedFunctionName)) {
                failingTests[testedFunctionName].push(test);
            } else if (testedFunctionName !== undefined) {
                failingTests[testedFunctionName] = [test];
            }
        });

        runner.on('end', () => {
            Object.keys(failingTests).forEach(testedFunctionName => {
                if (testedFunctionName !== undefined) {
                    code.generateVariations(testSuitePath, testedFunctionName, document, suggestionActionProvider);
                    vscode.window.showInformationMessage(testedFunctionName);
                }
            });
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
            failingTestsList.forEach(test => {
                const testedFunctionName: string | undefined = code.getTestedFunctionName(test);
                if (testedFunctionName !== undefined) {
                    vscode.window.showInformationMessage(testedFunctionName);
                }
            });

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
    getCompletePath,
    runTestSuite,
    runTestSuiteOnce
};