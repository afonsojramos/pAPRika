import * as fc from 'fast-check'
import { expect } from 'chai'

/**
 * Parse and return the integer value of the string
 * @param {String} str - The string to be parsed
 * @returns {int) - Returns the integer value or, NaN if string cannot be converted to integer.
 */
function myParseInt(str) {
	//Helper function to conver the number string to int. Equivalent to Javascript's Number() function
	function toNumber(str) {
		var sign,
			result,
			base = 1,
			strArr = str.split('')
		if (strArr[0] && strArr[1].match(/(\-|\+)/)) sign = strArr.shift()
		result = strArr.reduceRight(function (lastVal, val, idx, arr) {
			var ret = val * base + lastVal
			base *= 10
			return ret
		}, 0)
		return sign === '-' ? -result : result
	}

	//use regular expression to extract the number portion of str
	var matchArr = /^\s*((\-|\+)?[0-9]+)\s*/.exec(str)
	if (!matchArr) {
		return NaN //not a number
	}
	return toNumber(matchArr[1])
}

describe('myParseInt', function () {
	it("should return same values as JavaScript's parseInt(). #fix {myParseInt} (1)", function () {
		expect(myParseInt('10')).to.equal(parseInt('10'))
	})
	it("should return same values as JavaScript's parseInt(). #fix {myParseInt} (2)", function () {
		expect(myParseInt('00 abs')).to.equal(parseInt('00 abs'))
	})
	it('should return NaN. #fix {myParseInt} (3)', function () {
		expect(myParseInt('abc 95')).to.be.NaN
	})
	it('should return NaN. #fix {myParseInt} (4)', function () {
		expect(myParseInt(' asd45.23')).to.be.NaN
	})
	it("should return same values as JavaScript's parseInt(). #fix {myParseInt} (5)", function () {
		expect(myParseInt('999.4')).to.equal(parseInt('999.4'))
	})
})

describe('Properties of myParseInt', function () {
	it('parsing integers {myParseInt}', () => {
		fc.assert(
			fc.property(fc.integer(), function (num) {
				const string1 = fc.stringify(num)
				expect(myParseInt(string1)).to.equal(parseInt(string1))
			})
		)
	})

	it('parsing doubles {myParseInt}', () => {
		fc.assert(
			fc.property(fc.double(), function (num) {
				const string1 = fc.stringify(num)
				expect(myParseInt(string1)).to.equal(parseInt(string1))
			})
		)
	})
})
