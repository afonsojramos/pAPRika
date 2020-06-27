# Change Log

## [0.3.0] - 2020-06-05

### Fixed

-   Buggy space that appeared in some suggestions.
-   Error handling.
-   Replacement storing to deprecate the parsing of Diagnostic messages.
-   Replacements not being updated properly.
-   Broken Document conversion of Offset to Position.

### Changed

-   Improved possible mutations.
-   Removed unsupported capabilities.
-   Refactoring of generateOperatorVariants().
-   Refactoring to create getSyntaxList()
-   Cleared Diagnostics on Change.
-   Adapted Replacement to the use of test codes.
-   Improved readability on Diagnostic messages.
-   Minor improvements to the repository.
-   Removed independent versioning of client and server.

### Added

-   Support for Arrow Function variations.
-   Missing documentation.
-   Logical operators mutation.
-   BetterCodeHub & CircleCI badge.
-   Prettier to the whole repository to enforce uniformity.
-   Examples of usage.
-   Boolean operators mutation.
-   Prefix removal variation.
-   Started unit testing.
-   GitHub templates.
-   Support for Classes variations.

## [0.2.0] - 2020-06-05

### Fixed

-   Crash when certain Nodes did not have a certain property.
-   Deployment running only on master.
-   Capture of function content on ArrowFunctions.

### Changed

-   Updated dependencies.
-   Changed Mocha reporter.
-   Updated usage to improve ease of use.
-   Replaced "==>" with "with".

### Added

-   TypeScript support.
-   Usage information in ReadMe.
-   Notification for passed tests.
-   Mutation support for Arrow Functions.

## [0.1.3] - 2020-06-02

### Fixed

-   Misplaced documents listener call.

### Changed

-   Asynchronous suggestion provider.
-   Overall code improvements.
-   Updated prettier rules for uniformity.

### Added

-   Progress reporting support.
-   Created checks for diagnostic capability.
-   Attempts at updating range on change.

## [0.1.2] - 2020-05-23

### Fixed

-   Fixed diagnostics ignoring previously found problems in file, allowing for only one problem per file.
-   Fixed diagnostics not being cleared after re-run, duplicating already found diagnostics.
-   Updated `.vscodeignore` with the website folder and other unnecessary folders, which were being packaged into the extension `.vsix`.

### Changed

-   Organized server code.

### Added

-   Implemented code actions with support for quick fixes.
-   Continued with documentation efforts.
-   Added changelog.

## [0.1.1] - 2020-05-19

### Fixed

-   Fixed global settings not being taken into account.

### Changed

-   Moved code formatting to prettier to ensure better and stricter code formatting.

### Added

-   Implemented extension command to run pAPRika.

## [0.1.0] - 2020-05-18

### Fixed

-   Completely fixed path errors, allowing for multiple runs of test suites.

### Changed

-   Changed Text Document Sync to Incremental.
-   Removed deprecated Client tests.
-   Removed code from the LSP sample.

### Added

-   Created a Jekyll Website for the tool.
-   Implemented Firebase deployment.
-   Added breadcrumbs to the website.
-   Added categories filtering to blog posts.
-   Added favicon.
-   Published the first blog post.
-   Implemented CircleCI for tool building and website building and deployment.
-   Added issue templates.
-   Started documenting codebase.
-   Added extension settings, allowing the user to set when to run pAPRika.

## [0.0.4] - 2020-05-03

### Fixed

-   Fixed test suite path provided to Mocha.
-   Removed unsupported on LSP features.
-   Removed deprecated package.json functions.
-   Fixed bug that limited test execution to the root folder.

### Changed

-   Revamped Suggestion Provider.
-   Changed some for loops to maps for increased readability.

### Added

-   Added required extension dependencies.

## [0.0.3] - 2020-04-22

### Added & Fixed

-   Implemented suggestion provider.
-   Implemented code interface.
-   Created a replacement class.
-   Created Test runner.
-   Run ProperFix on Save.

## [0.0.2] - 2020-03-31

-   Conversion of the project to follow the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/).

### Added

-   Change activation language to JavaScript.
-   Support for Property-Based Testing using fast-check.

## [0.0.1] - 2020-03-23

-   The first release of ProperFix without Property-Based Testing.

### Fixed

-   Eliminated hard-coded paths.

### Added

-   Added extension assets.
