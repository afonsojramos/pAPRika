const fc = require('fast-check')

// Code under test
function contains(text, pattern){
	return text.indexOf(pattern) > 0
}

// Properties
describe('properties', () => {
	// string text always contains itself
	it('should always contain itself {contains}', () => {
		fc.assert(fc.property(fc.string(), (text) => contains(text, text)))
	})
	// string a + b + c always contains b, whatever the values of a, b and c
	it('should always contain its substrings {contains}', () => {
		fc.assert(
			fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
				// Alternatively: no return statement and direct usage of expect or assert
				return contains(a + b + c, b)
			})
		)
	})
})
