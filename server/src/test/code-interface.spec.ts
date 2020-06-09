import { generateOperatorVariants, getFunctionDeclarationNode, getArrowFunctionNode } from '../code-interface'
import { expect } from 'chai'
import 'mocha'
import * as ts from 'typescript'

const testPath: string = 'server/src/test/'

describe('Function Declarations', () => {
	it('should return undefined to inexistent function', () => {
		const result = getFunctionDeclarationNode(`${testPath}functiondeclaration.js`, 'myFunction')
		expect(result).to.equal(undefined)
	})

	it('should return function declaration', () => {
		const result = getFunctionDeclarationNode(`${testPath}functiondeclaration.js`, 'mySubstring')
		expect(result?.kind).to.equal(ts.SyntaxKind.FunctionDeclaration)
	})
})

describe('Arrow Function', () => {
	it('should return undefined to inexistent arrow function', () => {
		const result = getArrowFunctionNode(`${testPath}fast-check.js`, 'myFunction')
		expect(result).to.equal(undefined)
	})

	it('should return arrow function', () => {
		const result = getArrowFunctionNode(`${testPath}fast-check.js`, 'contains')
		expect(result?.kind).to.equal(ts.SyntaxKind.ArrowFunction)
	})
})
