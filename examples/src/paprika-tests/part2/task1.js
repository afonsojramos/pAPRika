let assert = require('assert')

/*

Problem 1: Given a string, check if every letter appears the same number of times.

Example:

"xxxyyyzzz" = true
"aabbbccac" = true
"aab" = false
"x" = true
"" = true

*/

function balancedStrings(string) {
    // Create object that contains the occurence of every char
    let chars = {}

    // Count occurences
    Array.from(string).forEach(char => {
        // Initialize property if not done yet
        if (!chars[char]) {
            chars[char] = 0
        }
        // Count up
        chars[char]++
    })

    // Create return value that is true until two values are not equal
    let isBalanced = true

    // If any value does not equal another return false
    Object.values(chars).sort((a, b) => {
        if (a == b) {
            isBalanced = false
        }
    })

    return isBalanced
}

describe('balancedStrings', function() {
    it('should return if string is balanced. #fix {balancedStrings} (1)', function() {
        assert.equal(balancedStrings("xxxyyyzzz"), true)
    })

    it('should return if string is balanced. #fix {balancedStrings} (2)', function() {
        assert.equal(balancedStrings("aabbbccac"), true)
    })

    it('should return if string is balanced. #fix {balancedStrings} (3)', function() {
        assert.equal(balancedStrings(""), true)
    })

    it('should return if string is balanced. #fix {balancedStrings} (4)', function() {
        assert.equal(balancedStrings("a"), true)
    })

    it('should return if string is balanced. #fix {balancedStrings} (5)', function() {
        assert.equal(balancedStrings("aav"), false)
    })

    it('should return if string is balanced. #fix {balancedStrings} (6)', function() {
        assert.equal(balancedStrings("aab"), false)
    })
})
