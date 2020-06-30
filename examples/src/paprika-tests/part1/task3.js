let assert = require('assert')

/*

Problem 1: Reverse Factorial

Everyone knows 5! corresponds to 5 * 4 * 3 * 2 * 1 = 120. In this problem, you need to write a function which, given
120, returns 5 - the reverse factorial.

If there is no number possible, return -1.

Hint: The strategy is pretty straightforward, just divide the term by successively larger terms until you get to "1" as the resultant:
*/

function unfactorial(num, cand = 1) {
	if (num === cand) return cand
	if (num % cand < 0) return -1
    
    // Implement Recursive call
}

describe('unfactorial', function() {
    it('should return reverse factorial. #fix {unfactorial} (1)', function() {
        assert.equal(unfactorial(120), 5)
    })

    it('should return reverse factorial. #fix {unfactorial} (2)', function() {
        assert.equal(unfactorial(150), -1)
    })
})