import { Enemy } from './enemy';
import { Resources } from '../Enjine/resources';
import { Sparkle } from './sparkle';
import { Mario } from './setup';
import type { LevelState } from './levelState';

/**
 * Represents a Piranha Plant enemy that emerges from pipes.
 */
export class FlowerEnemy extends Enemy {
    /** y-coordinate of the top of the pipe. */
    YStart: number;
    /** Animation tick counter. */
    Tick: number;
    /** Time to wait before changing state (hidden/shown). */
    WaitTime: number;
    /** Whether the plant is currently rising out of the pipe. */
    Rising: boolean;

    constructor(world: LevelState, x: number, y: number) {
        super(world, x, y, 1, Enemy.Spiky, false);
        this.Image = Resources.Images["enemies"];
        this.World = world;
        this.X = x;
        this.Y = y;  // Start hidden (spriteTemplate already adds +24 offset)
        this.Facing = 1;
        this.Type = Enemy.Spiky;
        this.Winged = false;
        this.NoFireballDeath = false;
        this.XPic = 0;
        this.YPic = 6;
        this.YPicO = 24;
        this.Height = 12;
        this.Width = 2;
        this.YStart = y - 24;  // Top of pipe position (where plant emerges to)
        this.Ya = 0;
        this.Layer = 0;
        this.JumpTime = 0;
        this.Tick = 0;
        this.WaitTime = 0;
        this.Rising = false;
    }

    /**
     * Updates the plant's movement (rising/falling) and animation.
     */
    Move(): void {
        var i = 0, xd = 0;
        if (this.DeadTime > 0) {
            this.DeadTime--;

            if (this.DeadTime === 0) {
                this.DeadTime = 1;
                for (i = 0; i < 8; i++) {
                    this.World.AddSprite(new Sparkle(this.World, ((this.X + Math.random() * 16 - 8) | 0) + 4, ((this.Y + Math.random() * 8) | 0) + 4, Math.random() * 2 - 1, Math.random() * -1, 0, 1));
                }
                this.World.RemoveSprite(this);
            }

            this.X += this.Xa;
            this.Y += this.Ya;
            this.Ya *= 0.95;
            this.Ya += 1;

            return;
        }

        this.Tick++;

        // Check distance to Mario - don't emerge if Mario is too close
        xd = Math.abs(Mario.MarioCharacter.X - this.X) | 0;

        // Plant is hidden in pipe
        if (this.Y >= this.YStart + 24) {
            this.Y = this.YStart + 24;  // Clamp to hidden position
            this.WaitTime++;
            if (this.WaitTime > 40 && xd > 24) {
                // Start rising
                this.Rising = true;
                this.WaitTime = 0;
            }
        }
        // Plant is fully emerged
        else if (this.Y <= this.YStart) {
            this.Y = this.YStart;  // Clamp to emerged position
            this.WaitTime++;
            if (this.WaitTime > 40) {
                // Start descending
                this.Rising = false;
                this.WaitTime = 0;
            }
        }

        // Move based on state
        if (this.Rising) {
            this.Ya = -1;  // Rise slowly
        } else if (this.Y < this.YStart + 24) {
            this.Ya = 1;   // Descend slowly
        } else {
            this.Ya = 0;   // Stay hidden
        }

        this.Y += this.Ya;

        // Animate
        this.XPic = (((this.Tick / 2) | 0) & 1) * 2 + (((this.Tick / 6) | 0) & 1);
    }
}

