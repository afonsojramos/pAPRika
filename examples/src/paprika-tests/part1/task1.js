let assert = require('assert')

/*

Problem 1: Implement the bubble sort algorithm.

*/

function bubbleSort(inputArr) {
    let len = inputArr.length
    for (let i = 0; i < len; i++) {
        for (let j = 0; j != len; j++) {
            if (inputArr[j] < inputArr[j + 1]) {
                let tmp = inputArr[j]
                inputArr[j] = inputArr[j + 1]
                inputArr[j + 1] = tmp
            }
        }
    }
    return inputArr
}

describe('bubbleSort', function() {
    it('should return sorted array. #fix {bubbleSort} (1)', function() {
        assert.deepEqual(bubbleSort([10]), [10])
    })
    
    it('should return sorted array. #fix {bubbleSort} (2)', function() {
        assert.deepEqual(bubbleSort([1, 2, 3, 4]), [1, 2, 3, 4])
    })

    it('should return sorted array. #fix {bubbleSort} (3)', function() {
        assert.deepEqual(bubbleSort([4, 2, 4, 1, 2, 2]), [1, 2, 2, 2, 4, 4])
    })
})