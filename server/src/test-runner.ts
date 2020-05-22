import { unlinkSync } from 'fs';
import * as Mocha from 'mocha';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { generateVariations, getTestedFunctionName } from './code-interface';
import Replacement from './replacement';
import SuggestionProvider from './fix-provider';

interface TestListMap {
	[key: string]: Mocha.Test[];
}

interface TestResultObject {
	test: Mocha.Test;
	passed: boolean;
}

/**
 * Runs Mocha over a test suite.
 * If all tests pass for a funcion, said function is ignored, otherwise, it gets added to a list of failed tests.
 * Failed tests are then used to generate variations of the tested function.
 *
 * @param {string} testSuitePath Path of the original file.
 * @param {TextDocument} document Original document.
 * @param {SuggestionProvider} suggestionProvider Code editor suggestion provider.
 */
function runTestSuite(testSuitePath: string, document: TextDocument, suggestionProvider: SuggestionProvider) {
	let mocha: Mocha = new Mocha();
	mocha.addFile(testSuitePath);
	console.info('Mocha added file: ' + testSuitePath.replace(/^.*[\\\/]/, ''));

	// see https://github.com/mochajs/mocha/issues/2783
	// To be Solved in https://github.com/mochajs/mocha/pull/4234
	delete require.cache[testSuitePath];

	try {
		let runner: Mocha.Runner = mocha.run();

		let failingTests: TestListMap = {};
		let testResults: TestResultObject[] = [];

		runner.on('fail', (test: Mocha.Test) => {
			testResults.push({
				test: test,
				passed: false
			});

			const testedFunctionName: string | undefined = getTestedFunctionName(test);

			if (testedFunctionName !== undefined && failingTests.hasOwnProperty(testedFunctionName)) {
				failingTests[testedFunctionName].push(test);
			} else if (testedFunctionName !== undefined) {
				failingTests[testedFunctionName] = [test];
			}
		});

		runner.on('pass', (test: Mocha.Test) => {
			testResults.push({
				test: test,
				passed: true
			});
		});

		runner.on('end', () => {
			Object.keys(failingTests).forEach((testedFunctionName) => {
				if (testedFunctionName !== undefined) {
					generateVariations(testSuitePath, testedFunctionName, document, suggestionProvider);
				}
			});

			/* const openEditor = vscode.window.visibleTextEditors.filter(
				editor => editor.document.uri === document.uri
			)[0]; */

			//code.decorate(openEditor, testResults);
		});
	} catch (err) {
		console.log(err);
	}
}

/**
 * Runs Mocha over a test suite.
 * Test suite comes from a generated file with possible replacements deriving from a specific function that failed tests within the original file test suite.
 * Suggests changes if all tests pass for the test suite.
 * At the end generated file is deleted.
 *
 * @param {string} testSuitePath Generated file path.
 * @param {TextDocument} document Original document.
 * @param {Replacement[]} replacements List of suggested replacements.
 * @param {string} functionName Name of function under testing.
 * @param {SuggestionProvider} suggestionProvider Code editor suggestion provider.
 */
function runTest(
	testSuitePath: string,
	document: TextDocument,
	replacements: Replacement[],
	functionName: string,
	suggestionProvider: SuggestionProvider
): void {
	let mocha: Mocha = new Mocha();
	mocha.addFile(testSuitePath);
	mocha.fgrep(functionName);

	// see https://github.com/mochajs/mocha/issues/2783
	delete require.cache[require.resolve(testSuitePath)];

	try {
		let runner: Mocha.Runner = mocha.reporter('min').run();
		let failingTestsList: Array<Mocha.Test> = [];

		runner.on('fail', (test: Mocha.Test) => {
			failingTestsList.push(test);
		});

		runner.on('end', () => {
			if (failingTestsList.length === 0) {
				suggestionProvider.suggestChanges(document, replacements);
			}

			unlinkSync(testSuitePath);
		});
	} catch (err) {
		console.log(err);
		unlinkSync(testSuitePath);
	}
}

export { TestResultObject, runTestSuite, runTest };
