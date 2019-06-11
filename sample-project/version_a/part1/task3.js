let assert = require('assert');

/*
Problem 3: Given a number, return its additive persistence. Additive persistence is defined as
how many loops you have to do while summing its digits until you get a single-digit number.

You have to solve this problem WITHOUT using strings.

Example:

123:
 - loop 1: 1 + 2 + 3 = 6. 6 is a single-digit number.

Additive Persistence of 123 is 1.

98:
 - loop 1: 9 + 8 = 17. 17 is not a single-digit number.
 - loop 2: 1 + 7 = 8. 8 is a single-digit number.

Additive Persistence of 98 is 2.
*/

function additivePersistence(input) {
    if (input < 10) {
        return 0;
    }
    var acc = 0;
    var working = input;

    while(working > 9) {
        acc += working % 10;
        working = Math.floor(working / 10);
    }
    acc += working;

    return (1 + additivePersistence(acc));
};

describe('additivePersistence', function() {
    it('should return additive persistence. #fix {additivePersistence}', function() {
        assert.equal(additivePersistence(13), 1);
    });

    it('should return additive persistence. #fix {additivePersistence}', function() {
        assert.equal(additivePersistence(9876), 2);
    });

    it('should return additive persistence. #fix {additivePersistence}', function() {
        assert.equal(additivePersistence(199), 3);
    });
});
