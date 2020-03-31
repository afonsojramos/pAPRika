# ProperFix

ProperFix is a `Proper`ty-Based Automatic Program Repair tool that attempts to `Fix` small faults in your code.

## Features

<!-- List with gifs for each feature example: https://github.com/James-Yu/LaTeX-Workshop -->

- Live code suggestions
- Myriad of fault detection

![ProperFix v0.0.1](/assets/properfix-v0.0.1.gif)

## Structure

```
.
├── client // Language Client
│   ├── src
│   │   ├── test // End to End tests for Language Client / Server
│   │   └── extension.ts // Language Client entry point
├── package.json // The extension manifest.
└── server // Language Server
    └── src
        └── server.ts // Language Server entry point
```

<!-- ## Requirements

* JavaScript/TypeScript test framework [`mocha`](https://github.com/mochajs/mocha) -->

<!-- ## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something -->

<!-- ## Known Issues

Lacks the. -->

## Development

- Run `npm install` in this folder. This installs all necessary npm modules in both the client and server folder
- Open VS Code on this folder.
- Press Ctrl+Shift+B to compile the client and server.
- Switch to the Debug view.
- Select `Launch Client` from the drop-down.
- Run the launch config.
- If you want to debug the server as well use the launch configuration `Attach to Server`
- In the [Extension Development Host] instance of VSCode, open a document in 'plain text' language mode.
  - Type `j` or `t` to see `Javascript` and `TypeScript` completion.
  - Enter text content such as `AAA aaa BBB`. The extension will emit diagnostics for all words in all-uppercase.

<!-- ## Release Notes

### 0.0.1

The initial release of ProperFix without Property-Based Testing. -->

***Enjoy!***

**Made by [Afonso Ramos](https://github.com/afonsojramos)**
