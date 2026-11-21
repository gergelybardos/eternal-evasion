/**
 * @abstract
 */
export default class State {
    /** @type {string} */
    name;

    /**
     * @abstract
     * @throws {Error}
     */
    enter() {
        throw new Error(`Method 'enter()' must be implemented in ${this.constructor.name}`);
    }

    /**
     * @abstract
     * @throws {Error}
     */
    exit() {
        throw new Error(`Method 'exit()' must be implemented in ${this.constructor.name}`);
    }

    /**
     * @abstract
     * @protected
     * @throws {Error}
     */
    initUI() {
        throw new Error(`Method 'initUI()' must be implemented in ${this.constructor.name}`);
    }
}
