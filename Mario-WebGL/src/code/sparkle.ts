import { NotchSprite } from './notchSprite';
import { Resources } from '../Enjine/resources';
import type { LevelState } from './levelState';

/**
 * Represents a sparkle effect (e.g. from coins or magic).
 */
export class Sparkle extends NotchSprite {
    /** Reference to the level state. */
    World: LevelState;
    /** Lifetime of the sparkle. */
    Life: number;
    /** Initial X index in the spritesheet. */
    XPicStart: number;

    constructor(world: LevelState, x: number, y: number, xa: number, ya: number, xPic: number = 0, yPic: number = 0, time: number = 10) {
        super(null);
        this.World = world;
        this.X = x;
        this.Y = y;
        this.Xa = xa;
        this.Ya = ya;
        this.XPic = xPic; // Was random
        if (arguments.length < 6) {
            this.XPic = (Math.random() * 2) | 0;
        }
        this.YPic = yPic;

        this.Life = time + ((Math.random() * 5) | 0);
        this.XPicStart = this.XPic;
        this.XPicO = 4;
        this.YPicO = 4;

        this.PicWidth = 8;
        this.PicHeight = 8;
        this.Image = Resources.Images["particles"];
    }

    /**
     * Updates the sparkle animation and position.
     */
    Move(): void {
        if (this.Life > 10) {
            this.XPic = 7;
        } else {
            this.XPic = (this.XPicStart + (10 - this.Life) * 0.4) | 0;
        }

        if (this.Life-- < 0) {
            this.World.RemoveSprite(this);
        }

        this.X += this.Xa;
        this.Y += this.Ya;
    }
}
