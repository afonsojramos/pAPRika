import { expect } from 'chai'

function mySubstring(str, i1, i2) {
	return str.substring(i1, i2)
}

describe('mySubstring', function () {
	it('#fix {mySubstring}', function () {
		expect(mySubstring('This is a string', 1, 2)).to.equal('hi')
	})

	it('#fix {mySubstring}', function () {
		expect(mySubstring('This is a string', 6, 8)).to.equal('s a')
	})
})
