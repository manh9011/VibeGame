/**
 * Represents a fire powerup.
 * Code by Rob Kleffner, 2011
 */

import { NotchSprite } from './notchSprite';
import { Resources } from '../Enjine/resources';
import { Mario } from './setup';
import type { LevelState } from './levelState';

/**
 * Represents a fire flower power-up.
 */
export class FireFlower extends NotchSprite {
    /** Reference to the level state. */
    World: LevelState;
    /** Animation timer. */
    Life: number;
    /** Direction facing. */
    Facing: number;

    constructor(world: LevelState, x: number, y: number) {
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

    /**
     * Checks for collision with Mario.
     */
    CollideCheck(): void {
        var xMarioD = Mario.MarioCharacter.X - this.X, yMarioD = Mario.MarioCharacter.Y - this.Y;
        if (xMarioD > -16 && xMarioD < 16) {
            if (yMarioD > -this.Height && yMarioD < Mario.MarioCharacter.Height) {
                Mario.MarioCharacter.GetFlower();
                this.World.RemoveSprite(this);
            }
        }
    }

    /**
     * Moves the flower up out of the block.
     */
    Move(): void {
        if (this.Life < 9) {
            this.Layer = 0;
            this.Y--;
            this.Life++;
            return;
        }
    }
}
