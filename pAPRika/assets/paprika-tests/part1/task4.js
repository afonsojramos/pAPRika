let assert = require('assert')

/*

Problem 2: Substring

Given a string a and two indexes, find the substring contained within those two indexes.

The usage of your function should be:

mySubstring('Mozilla', 1, 2) = 'oz'
mySubstring('Mozilla', 3, 3) = 'i'

Use the JavaScript substring function (usage: stringVariable.substring(num1, num2)).
*/

function mySubstring(str, i1, i2) {
    return str
}

describe('mySubstring', function() {
    it('should return a substring. #fix {mySubstring} (1)', function() {
        assert.equal(mySubstring('This is a string.', 1, 2), 'hi')
    })
    
    it('should return a substring. #fix {mySubstring} (2)', function() {
        assert.equal(mySubstring('This is a string.', 6, 8), 's a')
    })
})