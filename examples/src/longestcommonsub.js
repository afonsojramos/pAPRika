import * as assert from 'assert'
import * as fc from 'fast-check'
import { groupBy } from 'lodash'

export default function longestCommonSubstring(s1, s2) {
	// transform s1 & s2 into arrays to allow handling unicodes as single caracter.
	const [a1, a2] = [s1, s2].map((s) => Array.from(s))

	// Init the matrix of all substring lengths to use Dynamic Programming approach.
	const substringMatrix = Array(a2.length + 1)
		.fill(null)
		.map(() => {
			return Array(a1.length + 1).fill(null)
		})

	// Fill the first row and first column with zeros to provide initial values.
	for (let columnIndex = 0; columnIndex <= a1.length; columnIndex += 1) {
		substringMatrix[0][columnIndex] = 0
	}

	for (let rowIndex = 0; rowIndex <= a2.length; rowIndex += 1) {
		substringMatrix[rowIndex][0] = 0
	}

	// Build the matrix of all substring lengths to use Dynamic Programming approach.
	let longestSubstringLength = 0
	let longestSubstringColumn = 0
	let longestSubstringRow = 0

	for (let rowIndex = 1; rowIndex <= a2.length; rowIndex += 1) {
		for (let columnIndex = 1; columnIndex <= a1.length; columnIndex += 1) {
			if (a1[columnIndex - 1] === a2[rowIndex - 1]) {
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
		longestSubstring = a1[longestSubstringColumn - 1] + longestSubstring
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
			'sentence'
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
