let assert = require('assert')

/*

Problem 2: Splice

Given an array a and two indexes, find the slice contained within those two indexes (both included).

The usage of your function should be:

mySlice(['a', 'b', 'c', 'd'], 1, 2) = ['b', 'c']
mySlice(['a', 'b', 'c', 'd'], 3, 3) = ['d']

Use the JavaScript Slice function (usage: arrayVariable.slice(num1, num2)).
*/

function mySlice(arr, i1, i2) {
    return arr
}

describe('mySlice', function() {
    it('should return reverse factorial. #fix {mySlice} (1)', function() {
        assert.deepEqual(mySlice(['a', 'b', 'c', 'd'], 1, 2), ['b', 'c'])
    })

    it('should return reverse factorial. #fix {mySlice} (2)', function() {
        assert.deepEqual(mySlice(['a', 'b', 'c', 'd'], 3, 3), ['d'])
    })
})