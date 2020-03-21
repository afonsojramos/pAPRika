let assert = require('assert');
 
/*
 
Problem 2: Given a square matrix, return the diagonal difference.
 
Example:
 
1 1 2
2 2 3
3 3 3
 
Diagonal 1 is 1, 2, 3. Sum is 6.
Diagonal 2 is 3, 2, 2. Sum is 7.
 
Difference |6 - 7| = 1.
 
*/
 
function diagonalDifference(matrix) {
    let len = matrix.length;
    let firstDiag = 0;
    let secondDiag = 0;
   
    for (let i = 0; i < len; i++) {
        firstDiag = firstDiag + matrix[i][i];
        secondDiag = secondDiag + matrix[len - i][i];
    }
 
    return Math.abs(firstDiag - secondDiag);
};
 
describe('diagonalDifference', function() {
    it('should return diagonal difference. #fix {diagonalDifference}', function() {
        assert.equal(diagonalDifference([[1]]), 0);
    });
 
    it('should return diagonal difference. #fix {diagonalDifference}', function() {
        assert.equal(diagonalDifference([[1, 1, 1], [2, 2, 2], [3, 3, 3]]), 0);
    });
 
    it('should return diagonal difference. #fix {diagonalDifference}', function() {
        assert.equal(diagonalDifference([[1, 1, 2], [2, 2, 3], [3, 3, 3]]), 1);
    });
});
