let fc = require('fast-check')

const contains = (text, pattern) => text.indexOf(pattern) > 0

describe('properties', () => {
	it('should always contain itself {contains}', () => {
		fc.assert(fc.property(fc.string(), (text) => contains(text, text)))
	})
	it('should always contain its substrings {contains}', () => {
		fc.assert(
			fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
				return contains(a + b + c, b)
			})
		)
	})
})
