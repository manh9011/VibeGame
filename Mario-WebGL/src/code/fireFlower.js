/**
 * Represents a fire powerup.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { NotchSprite } from './notchSprite.js';
import { Resources } from '../Enjine/resources.js';
import { Mario } from './setup.js';

export class FireFlower extends NotchSprite {
    constructor(world, x, y) {
        super(null);
        this.Width = 4;
        this.Height = 24;

        this.World = world;
        this.X = x;
        this.Y = y;
        this.Image = Resources.Images["items"];

        this.XPicO = 8;
        this.YPicO = 15;
        this.XPic = 1;
        this.YPic = 0;
        this.Height = 12;
        this.Facing = 1;
        this.PicWidth = this.PicHeight = 16;

        this.Life = 0;
    }

    CollideCheck() {
        var xMarioD = Mario.MarioCharacter.X - this.X, yMarioD = Mario.MarioCharacter.Y - this.Y;
        if (xMarioD > -16 && xMarioD < 16) {
            if (yMarioD > -this.Height && yMarioD < Mario.MarioCharacter.Height) {
                Mario.MarioCharacter.GetFlower();
                this.World.RemoveSprite(this);
            }
        }
    }

    Move() {
        if (this.Life < 9) {
            this.Layer = 0;
            this.Y--;
            this.Life++;
            return;
        }
    }
}
