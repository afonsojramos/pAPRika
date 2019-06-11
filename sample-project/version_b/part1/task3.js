let assert = require('assert');

/*
Problem 3: 5 Friends (a, b, c, d and e) are playing a game and need to keep track of the scores.
Each time someone scores a point, the letter of his name is typed in lowercase. 
If someone loses a point, the letter of his name is typed in uppercase. 

Return the result as an object, mapping the player to the respective score.

Example:

abcde:
{
    a: 1
    b: 1
    c: 1
    d: 1
    e: 1
}

dbaCEDbacB:
{
    a: 2
    b: 1
    c: 0
    d: 0
    e: -1
}

*/

function tallyScore(score) {

    let tally = {};

    for(let i = 0; i < score.length; i++){

        let lower = score[i].toLowerCase(),
            point = tally[lower] || 0;

        tally[lower] = score.charCodeAt(i) >= 97 ? point + 1 : point - 1;

    }

    return tally;
};

describe('tallyScore', function() {
    it('should return score. #fix {tallyScore}', function() {
        assert.deepEqual(tallyScore("abcde"), {
            "a": 1,
            "b": 1,
            "c": 1,
            "d": 1,
            "e": 1,
        });
    });

    it('should return score. #fix {tallyScore}', function() {
        assert.deepEqual(tallyScore("dbaCEDbacB"), {
            "a": 2,
            "b": 1,
            "c": 0,
            "d": 0,
            "e": -1,
        });
    });
});
