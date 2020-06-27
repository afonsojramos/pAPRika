let assert = require('assert')
let fc = require('fast-check')

function longestCommonSubstring(string1, string2) {
	// Convert strings to arrays to treat unicode symbols length correctly.
	// For example:
	// '𐌵'.length === 2
	// [...'𐌵'].length === 1
	const s1 = [...string1]
	const s2 = [...string2]

	// Init the matrix of all substring lengths to use Dynamic Programming approach.
	const substringMatrix = Array(s2.length + 1)
		.fill(null)
		.map(() => {
			return Array(s1.length + 1).fill(null)
		})

	// Fill the first row and first column with zeros to provide initial values.
	for (let columnIndex = 0; columnIndex <= s1.length; columnIndex += 1) {
		substringMatrix[0][columnIndex] = 0
	}

	for (let rowIndex = 0; rowIndex <= s2.length; rowIndex += 1) {
		substringMatrix[rowIndex][0] = 0
	}

	// Build the matrix of all substring lengths to use Dynamic Programming approach.
	let longestSubstringLength = 0
	let longestSubstringColumn = 0
	let longestSubstringRow = 0

	for (let rowIndex = 1; rowIndex <= s2.length; rowIndex += 1) {
		for (let columnIndex = 1; columnIndex <= s1.length; columnIndex += 1) {
			if (s1[columnIndex - 1] === s2[rowIndex - 1]) {
				substringMatrix[rowIndex][columnIndex] = substringMatrix[rowIndex - 1][columnIndex - 1] + 1
			} else {
				substringMatrix[rowIndex][columnIndex] = 0
			}

			// Try to find the biggest length of all common substring lengths
			// and to memorize its last character position (indices)
			if (substringMatrix[rowIndex][columnIndex] > longestSubstringLength) {
				longestSubstringLength = substringMatrix[rowIndex][columnIndex]
				longestSubstringColumn = columnIndex
				longestSubstringRow = rowIndex
			}
		}
	}

	if (longestSubstringLength === 0) {
		// Longest common substring has not been found.
		return ''
	}

	// Detect the longest substring from the matrix.
	let longestSubstring = ''

	while (substringMatrix[longestSubstringRow][longestSubstringColumn] > 0) {
		longestSubstring = s1[longestSubstringColumn - 1] + longestSubstring
		longestSubstringRow -= 1
		longestSubstringColumn -= 1
	}

	return longestSubstring
}

describe('Longest Common Substring', () => {
	it('should find "sentence" {longestCommonSubstring}', () => {
		assert.equal(
			longestCommonSubstring(
				'This is a sentence that will get analised a lot',
				'There are a lot of sentences with a lot of common substrings'
			),
			' sentence'
		)
	})

	it('should find "mportant" {longestCommonSubstring}', () => {
		assert.equal(longestCommonSubstring('Wording is important', 'Important wording'), 'mportant')
	})

	it('should find "ika" {longestCommonSubstring}', () => {
		assert.equal(longestCommonSubstring('pAPRika', 'paprika'), 'ika')
	})
})

describe('Properties of Longest Common Substring', () => {
	it('should find the same substring lengths whatever the order of the inputs {longestCommonSubstring}', () =>
		fc.assert(
			fc.property(fc.string(), fc.string(), (s1, s2) => {
				assert.equal(longestCommonSubstring(s1, s2).length, longestCommonSubstring(s2, s1).length)
			})
		))

	it('should include the substr in both strings {longestCommonSubstring}', () =>
		fc.assert(
			fc.property(fc.string(), fc.string(), (s1, s2) => {
				const longest = longestCommonSubstring(s1, s2)
				assert.ok(s1.includes(longest))
				assert.ok(s2.includes(longest))
			})
		))

	it('should detect the longest common {longestCommonSubstring}', () =>
		fc.assert(
			fc.property(fc.string(), fc.string(), fc.string(), (s, prefix, suffix) => {
				assert.equal(longestCommonSubstring(prefix + s + suffix, s), s)
			})
		))
})
