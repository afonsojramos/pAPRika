import { unlinkSync } from 'fs'
import * as Mocha from 'mocha'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { generateVariations, getTestedFunctionName } from './code-interface'
import Replacement from './replacement'
import SuggestionProvider from './suggestion-provider'

interface TestListMap {
	[key: string]: Mocha.Test[]
}

interface TestResultObject {
	test: Mocha.Test
	passed: boolean
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
	let mocha: Mocha = new Mocha()
	mocha.addFile(testSuitePath)
	console.info(`Mocha added file: ${testSuitePath.replace(/^.*[\\\/]/, '')}`)
	suggestionProvider.resetDiagnostics(document.uri)

	// see https://github.com/mochajs/mocha/issues/2783
	// To be Solved in https://github.com/mochajs/mocha/pull/4234
	delete require.cache[testSuitePath]

	try {
		let runner: Mocha.Runner = mocha.run()
		suggestionProvider.startProgressFeedback(runner.total, 'Running Test Suite')

		let failingTests: TestListMap = {}
		let testResults: TestResultObject[] = []

		runner.on('fail', (test: Mocha.Test) => {
			testResults.push({
				test: test,
				passed: false
			})

			const testedFunctionName: string | undefined = getTestedFunctionName(test)

			if (testedFunctionName !== undefined && failingTests.hasOwnProperty(testedFunctionName)) {
				failingTests[testedFunctionName].push(test)
			} else if (testedFunctionName !== undefined) {
				failingTests[testedFunctionName] = [test]
			}
		})

		runner.on('pass', (test: Mocha.Test) => {
			testResults.push({
				test: test,
				passed: true
			})
		})

		runner.on('test end', () => {
			suggestionProvider.updateProgressFromStep()
		})

		runner.on('end', async () => {
			suggestionProvider.updateProgressFromStep(Object.keys(failingTests).length)
			Object.keys(failingTests).forEach(async (testedFunctionName) => {
				if (testedFunctionName !== undefined) {
					await generateVariations(testSuitePath, testedFunctionName, document, suggestionProvider)
					suggestionProvider.updateProgressFromStep()
				}
			})
			suggestionProvider.terminateProgress()

			// TODO: Implement Decorator through client-side VSCodeCommand
			/* const openEditor = vscode.window.visibleTextEditors.filter(
				editor => editor.document.uri === document.uri
			)[0]; 

			code.decorate(openEditor, testResults);
			*/
		})
	} catch (error) {
		suggestionProvider.sendWarningMessage(error)
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
	let mocha: Mocha = new Mocha()
	mocha.addFile(testSuitePath)
	mocha.fgrep(functionName)

	// see https://github.com/mochajs/mocha/issues/2783
	delete require.cache[require.resolve(testSuitePath)]

	try {
		let runner: Mocha.Runner = mocha.reporter('dot').run()
		let failingTestsList: Array<Mocha.Test> = []

		runner.on('fail', (test: Mocha.Test) => {
			failingTestsList.push(test)
		})

		runner.on('end', async () => {
			if (failingTestsList.length === 0) {
				await suggestionProvider.suggestChanges(document, replacements)
			}

			unlinkSync(testSuitePath)
		})
	} catch (err) {
		console.log(err)
		unlinkSync(testSuitePath)
	}
}

export { TestResultObject, runTestSuite, runTest }
