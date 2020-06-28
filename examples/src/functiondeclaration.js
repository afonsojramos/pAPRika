let assert = require('assert')

function mySubstring(str, i1, i2) {
	return str.substring(i1, i2)
}

describe('mySubstring', function () {
	it('#fix {mySubstring}', function () {
		assert.equal(mySubstring('This is a string', 1, 2), 'hi')
	})

	it('#fix {mySubstring}', function () {
		assert.equal(mySubstring('This is a string', 6, 8), 's a')
	})
})
