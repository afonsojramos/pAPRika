import { unlinkSync } from 'fs';
import * as Mocha from 'mocha';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as code from './code-interface';
import Replacement from './replacement';

interface TestListMap {
    [key: string]: Mocha.Test[];
}

interface TestResultObject {
    'test': Mocha.Test;
    'passed': boolean;
}

function runTestSuite(testSuitePath: string, document: TextDocument) {
	let mocha: Mocha = new Mocha();
	let filePath: RegExpMatchArray | null;
	filePath = testSuitePath.match('[^\/]*.js$');
	if (filePath === null)	{ console.error('File Path not found'); return; }

	mocha.addFile(filePath[0]);
	console.log('Mocha added file: ' + filePath[0]);

	// see https://github.com/mochajs/mocha/issues/2783
	// Not working on second run
	delete require.cache[filePath[0]];

	try {
		let runner: Mocha.Runner = mocha.run();

		let failingTests: TestListMap = {};
		let testResults: TestResultObject[] = [];

		runner.on('fail', (test: Mocha.Test) => {
			testResults.push({
				'test': test,
				'passed': false
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
				'test': test,
				'passed': true
			});
		});

		runner.on('end', () => {
			Object.keys(failingTests).forEach(testedFunctionName => {
				if (testedFunctionName !== undefined && filePath !== null) {
					code.generateVariations(filePath[0], testedFunctionName, document);
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

function runTest(testSuitePath: string, document: TextDocument, replacements: Replacement[], functionName: string): void{
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
			console.log(test);
			failingTestsList.push(test);
		});

		runner.on('end', () => {
			if (failingTestsList.length === 0) {
				code.suggestChanges(document, replacements);
			}

			unlinkSync(testSuitePath);
		});

	} catch (err) {
		console.log(err);
		unlinkSync(testSuitePath);
	}
}

export { TestResultObject, runTestSuite, runTest };
