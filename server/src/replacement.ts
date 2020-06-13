export default class Replacement {
	/**
	 * Creates an instance of a Replacement.
	 *
	 * @param {number} start Start position.
	 * @param {number} end End position.
	 * @param {string} [oldText=''] Old text to replace.
	 * @param {string} [newText=''] New text.
	 * @memberof Replacement
	 */
	constructor(
		readonly start: number,
		readonly end: number,
		readonly oldText: string = '',
		readonly newText: string = '',
		readonly code: string = ''
	) {}

	/**
	 * Creates a `Replacement` insertion.
	 *
	 * @param {number} pos Insertion position.
	 * @param {string} text New text.
	 */
	public static insert(pos: number, text: string) {
		return new Replacement(pos, pos, text)
	}

	/**
	 * Creates a `Replacement`.
	 *
	 * @param {number} start Start position.
	 * @param {number} end End position.
	 * @param {string} oldText Old text to replace.
	 * @param {string} newText New text.
	 */
	public static replace(start: number, end: number, oldText: string, newText: string, code: string) {
		return new Replacement(start, end, oldText, newText, code)
	}
}
