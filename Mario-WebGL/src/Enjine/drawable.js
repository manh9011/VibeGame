/**
 * Base class for all drawable objects, makes ordering automatic.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

export class Drawable {
    constructor() {
        this.ZOrder = 0;
    }

    Draw(context) { }
}
