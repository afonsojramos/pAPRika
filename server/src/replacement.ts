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
	constructor(readonly start: number, readonly end: number, readonly oldText: string = '', readonly newText: string = '') { }

	public static insert(pos: number, text: string) {
		return new Replacement(pos, pos, text);
	}

	public static replace(start: number, end: number, oldText: string, newText: string) {
		return new Replacement(start, end, oldText, newText);
	}
}