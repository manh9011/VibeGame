import { NotchSprite } from './notchSprite';
import { Resources } from '../Enjine/resources';
import type { LevelState } from './levelState';

/**
 * Represents a small particle effect (e.g., brick debris).
 */
export class Particle extends NotchSprite {
    /** Reference to the level state. */
    World: LevelState;
    /** Lifetime of the particle. */
    Life: number;

    constructor(world: LevelState, x: number, y: number, xa: number, ya: number, xPic: number = 0, yPic: number = 0) {
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

    /**
     * Updates the particle's movement and life.
     */
    Move(): void {
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
