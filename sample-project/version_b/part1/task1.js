let assert = require('assert');

/*
Problem 1: Implement the insertion sort algorithm.
*/

function bubbleSort(inputArr) {
    const len = inputArr.length;

    for (let i = 0; i < len; i++) {
      let el = inputArr[i];
      let j = i - 1;
  
      for (j; j >= 0 && inputArr[j] > el; j--) {
        inputArr[j + 1] = inputArr[j];
      }

      inputArr[j + 1] = el;
    }

    return inputArr;
}

describe('bubbleSort', function() {
    it('should return sorted array. #fix {bubbleSort}', function() {
        assert.deepEqual(bubbleSort([10]), [10]);
    });
    
    it('should return sorted array. #fix {bubbleSort}', function() {
        assert.deepEqual(bubbleSort([1, 2, 3, 4]), [1, 2, 3, 4]);
    });

    it('should return sorted array. #fix {bubbleSort}', function() {
        assert.deepEqual(bubbleSort([4, 2, 4, 1, 2, 2]), [1, 2, 2, 2, 4, 4]);
    });
});