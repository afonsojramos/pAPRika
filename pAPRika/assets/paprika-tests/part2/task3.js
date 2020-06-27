let assert = require('assert')

/*

Problem 1: Finish this partial implementation of a change processing function.

As an input, you're given an array with the coins you have, as well as the desired change to give. You must
output the smallest number of coins possible to return the correct value of change.

Assume the array is ordered from largest to smallest.

*/

function processChange(arr, change) {
  if (arr.length === 0) {
      return -1
  }

  let result = arr.reduce((map, num) => {
      const coin = parseInt(num)
      if (coin + map.coinTotal < change ) {
          map.coinTotal += coin
          map.coins.push(coin)
          // Update the "total" value
      }
      return map
  }, { total: 0, coinTotal: 0, coins: []})

  arr.splice(0, 1)

  return result.coinTotal === change ? result.total : processChange(arr, change)
}

describe('processChange', function() {
    it('should return change. #fix {processChange} (1)', function() {
        assert.equal(processChange([100, 50, 50, 50, 50], 150), 2)
    })

    it('should return change. #fix {processChange} (2)', function() {
        assert.equal(processChange([2, 4, 5], 10), -1)
    })
})