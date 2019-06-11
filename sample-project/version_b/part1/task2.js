let assert = require('assert');

/*
Problem 2: Given a string, check if every letter appears the same number of times.

Example:

"xxxyyyzzz" = true
"aabbbccac" = true
"aab" = false
"x" = true
"" = true
*/

function balancedStrings(str) {
    let counters = {};

    for (let i = 0, l = str[i]; i < str.length; i++, l = str[i]) {
        counters[l] ? counters[l] += 1 : counters[l] = 1;
    }

    counters = Object.values(counters);
    for(let i = 0; i < counters.length - 1; ++i) {
        if (counters[i] !== counters[i + 1]) {
            return false;
        }
    }
    
    return true;
};

describe('balancedStrings', function() {
    it('should return if string is balanced. #fix {balancedStrings}', function() {
        assert.equal(balancedStrings("xxxyyyzzz"), true);
    });

    it('should return if string is balanced. #fix {balancedStrings}', function() {
        assert.equal(balancedStrings("aabbbccac"), true);
    });

    it('should return if string is balanced. #fix {balancedStrings}', function() {
        assert.equal(balancedStrings(""), true);
    });

    it('should return if string is balanced. #fix {balancedStrings}', function() {
        assert.equal(balancedStrings("a"), true);
    });

    it('should return if string is balanced. #fix {balancedStrings}', function() {
        assert.equal(balancedStrings("aav"), false);
    });

    it('should return if string is balanced. #fix {balancedStrings}', function() {
        assert.equal(balancedStrings("aab"), false);
    });
});
