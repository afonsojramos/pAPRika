let assert = require('assert');

/*
 
Problem 1: Given a string, return a subtring within the given limits.
 
Example:

A substring of "This is a string" is "is"
 
*/

function mySubstring(str, i1, i2) {
	return str.substring(i1, i2);
}

describe('mySubstring', function () {
	it('#fix {mySubstring}', function () {
		assert.equal(mySubstring('This is a string', 1, 2), 'hi');
	});

	it('#fix {mySubstring}', function () {
		assert.equal(mySubstring('This is a string', 6, 8), 's a');
	});
});
