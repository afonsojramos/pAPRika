<p align="center">
  <img src="pAPRika/assets/pAPRika.png" alt="pAPRika logo" width="72" height="72">
</p>
<h1 align="center">
  <b>p<span style="color:#c10301">APR</span>ika</b>
</h1>
<p align="center">
  An <b><span style="color:#c10301">A</span>utomatic <span style="color:#c10301">P</span>rogram <span style="color:#c10301">R</span>epair</b> tool that attempts to fix small faults in your <i>JS/TS</i> code.
  <br>
  <strong>Developed by <a href="https://github.com/afonsojramos">Afonso Ramos</a></strong>

  <br>
  <br>
  <a href="https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API">TypeScript Compiler API</a>
  ·
  <a href="https://mochajs.org/">Mocha</a>
  <br>
  <a href="https://microsoft.github.io/language-server-protocol/">Language Server Protocol</a>
  <br>
  <br>
  <a href="https://app.circleci.com/pipelines/github/afonsojramos/pAPRika"> <img src="https://circleci.com/gh/afonsojramos/pAPRika.svg?style=shield&circle-token=f17b0877cd06b72ce45d01a6224f19eb435d269d"></a>
  <img src='https://bettercodehub.com/edge/badge/afonsojramos/pAPRika?branch=master&token=9dc668864992fc676ce1d34c63c045705f7c90e0'>
</p>

A prototype extension to _Visual Studio Code_, repairing _JavaScript_ and _TypeScript_ code and offering suggestions to the developers in real-time, using a mutation-based approach to Automated Program Repair in order to generate patches.

<p align="center">
  <img src="pAPRika/assets/pAPRika-v0.2.1.gif">
  <img src="pAPRika/assets/pAPRika-v0.2.gif">
</p>

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

There are four options for running `pAPRika`, by saving the file, by opening a file, or by running either of the available commands:

1.  `pAPRika: Spice this file` - This command runs pAPRika on the current file.
2.  `pAPRika: Spice all open files` - This command runs pAPRika on all opened files, as such, it may become resource intensive.

## Extension Settings

This extension contributes the following settings:

-   `pAPRika.runOnOpen`: enable/disable running this extension when opening new files.
-   `pAPRika.runOnSave`: enable/disable running this extension when saving new files.

## Development

-   Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
-   Open VS Code on this folder.
-   Press Ctrl+Shift+B to compile the client and server.
-   Switch to the Debug view.
-   Select `Launch Client` from the drop-down.
-   Run the launch config.
-   If you want to debug the server as well use the launch configuration `Attach to Server`

### Structure

```
.
├── client // Language Client.
│   ├── src
│   │   └── extension.ts // Language Client entry point.
├── examples // Examples of problems fixable with pAPRika.
├── pAPRika // pAPRika website.
└── server // Language Server.
    └── src
        └── server.ts // Language Server entry point.
```

**_Enjoy!_**
