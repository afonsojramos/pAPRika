---
layout: single
title: 'Spice Up Your Development Workflow!'
categories: releases
---

pAPRika has arrived with its first public release!

## Usage

On each Test Function of Mocha (`it`) leave an identifier to the function that is attempting to fix, like so: `{mySubstring}`.

Example in JS:

_`i2` will show up as an error and suggest to be replaced with `(i2 + 1)`_

```js
function mySubstring(str, i1, i2) {
	return str.substring(i1, i2)
}

describe('mySubstring Testing Suite', function () {
	it('Test Name 1 {mySubstring}', function () {
		assert.equal(mySubstring('This is a string', 1, 2), 'hi')
	})

	it('Test Name 2 {mySubstring}', function () {
		assert.equal(mySubstring('This is a string', 6, 8), 's a')
	})
})
```

It also supports Property-Based Testing:

_`>` will show up as an error and suggest to be replaced with `>=`_

```js
const fc = require('fast-check')

contains = (text, pattern) => text.indexOf(pattern) > 0

describe('properties', () => {
	it('should always contain itself {contains}', () => {
		fc.assert(fc.property(fc.string(), (text) => contains(text, text)))
	})
	it('should always contain its substrings {contains}', () => {
		fc.assert(
			fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
				return contains(a + b + c, b)
			})
		)
	})
})
```

For `TypeScript` support it is required to have `tsconfig.json` in the root folder.

There is a command available for running pAPRika in all open files.

## Extension Settings

This extension contributes the following settings:

-   `pAPRika.runOnOpen`: enable/disable running this extension when opening new files.
-   `pAPRika.runOnSave`: enable/disable running this extension when saving new files.

The tool itself will be made available soon!
