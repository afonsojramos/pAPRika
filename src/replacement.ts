export default class Replacement {
    public static insert(pos: number, text: string) {
        return new Replacement(pos, pos, text);
    }

    public static replace(start: number, end: number, oldText: string, newText: string) {
        return new Replacement(start, end, oldText, newText);
    }
  
    constructor(readonly start: number, readonly end: number, readonly oldText = '', readonly newText = '') {}
}  