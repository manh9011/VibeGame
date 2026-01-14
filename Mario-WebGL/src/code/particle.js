/**
 * Represents a piece of a broken block.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { NotchSprite } from './notchSprite.js';
import { Resources } from '../Enjine/resources.js';

export class Particle extends NotchSprite {
    constructor(world, x, y, xa, ya, xPic, yPic) {
        super(null);
        this.World = world;
        this.X = x;
        this.Y = y;
        this.Xa = xa;
        this.Ya = ya;
        this.XPic = (Math.random() * 2) | 0;
        this.YPic = 0;
        this.XPicO = 4;
        this.YPicO = 4;

        this.PicWidth = 8;
        this.PicHeight = 8;
        this.Life = 10;

        this.Image = Resources.Images["particles"];
    }

    Move() {
        if (this.Life - this.Delta < 0) {
            this.World.RemoveSprite(this);
        }
        this.Life -= this.Delta;

        this.X += this.Xa;
        this.Y += this.Ya;
        this.Ya *= 0.95;
        this.Ya += 3;
    }
}
