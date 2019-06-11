let assert = require('assert');

function add(val1, val2) {
    return val1 + val2;
}

function sub(val1, val2) {
    return val1 - val2;
}

describe('add', function() {
    it('should return 4 when adding 2 to 2. #fix {add}', function() {
        assert.equal(add(2, 2), 4);
    });
    
    it('should return 5 when adding 3 to 2. #fix {add}', function() {
        assert.equal(add(3, 2), 5);
    });
})

describe('sub', function() {
    it('should return 0 when subtracting 1 to 1. #fix {sub}', function() {
        assert.equal(sub(1, 1), 0);
    });

    it('should return 1 when subtracting 3 to 2. #fix {sub}', function() {
        assert.equal(sub(3, 2), 1);
    });
    
    it('should return 1 when subtracting 3 to 2. #fix {sub}', function() {
        assert.equal(sub(3, 2), 1);
    });
});