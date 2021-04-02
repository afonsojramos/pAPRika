import { TestIdentifier, getFunctionDeclarationNode, getArrowFunctionNode } from '../code-interface'
import { expect } from 'chai'
import 'mocha'
import * as ts from 'typescript'

const testPath: string = 'examples/src/'
const testIdentifier: TestIdentifier = {
	testCode: 'myFunction',
	functionName: 'myFunction',
	className: ''
}

describe('Function Declarations', () => {
	const correctTestIdentifier: TestIdentifier = {
		testCode: 'mySubstring',
		functionName: 'mySubstring',
		className: ''
	}

	it('should return undefined to inexistent function', () => {
		const result = getFunctionDeclarationNode(`${testPath}functiondeclaration.js`, testIdentifier)
		expect(result).to.equal(undefined)
	})

	it('should return function declaration', () => {
		const result = getFunctionDeclarationNode(`${testPath}functiondeclaration.js`, correctTestIdentifier)
		expect(result?.kind).to.equal(ts.SyntaxKind.FunctionDeclaration)
	})
})

describe('Arrow Function', () => {
	const correctTestIdentifier: TestIdentifier = {
		testCode: 'contains',
		functionName: 'contains',
		className: ''
	}

	it('should return undefined to inexistent arrow function', () => {
		const result = getArrowFunctionNode(`${testPath}fast-check.js`, testIdentifier)
		expect(result).to.equal(undefined)
	})

	it('should return arrow function', () => {
		const result = getArrowFunctionNode(`${testPath}fast-check.js`, correctTestIdentifier)
		expect(result?.kind).to.equal(ts.SyntaxKind.ArrowFunction)
	})
})
