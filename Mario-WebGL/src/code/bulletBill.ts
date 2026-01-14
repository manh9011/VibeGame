import { NotchSprite } from './notchSprite';
import { Resources } from '../Enjine/resources';
import { Sparkle } from './sparkle';
import { Mario } from './setup';
import type { LevelState } from './levelState';
import type { Fireball } from './fireball';
import type { Shell } from './shell';

/**
 * Represents the Bullet Bill enemy.
 */
export class BulletBill extends NotchSprite {
    /** Reference to the level state. */
    World: LevelState;
    /** Direction the bullet is facing (1 or -1). */
    Facing: number;
    /** Whether the bullet is dead (stomped). */
    Dead: boolean;
    /** Time remaining for the death animation. */
    DeadTime: number;
    /** Animation frame index. */
    Anim: number;

    constructor(world: LevelState, x: number, y: number, dir: number) {
        super(null);
        this.Image = Resources.Images["enemies"];
        this.World = world;
        this.X = x;
        this.Y = y;
        this.Facing = dir;

        this.XPicO = 8;
        this.YPicO = 31;
        this.Height = 12;
        this.Width = 4;
        this.PicWidth = 16;
        this.YPic = 5;
        this.XPic = 0;
        this.Ya = -5;
        this.DeadTime = 0;
        this.Dead = false;
        this.Anim = 0;
    }

    /**
     * Checks for collisions with Mario.
     */
    CollideCheck(): void {
        if (this.Dead) {
            return;
        }

        var xMarioD = Mario.MarioCharacter.X - this.X, yMarioD = Mario.MarioCharacter.Y - this.Y;
        if (xMarioD > -16 && xMarioD < 16) {
            if (yMarioD > -this.Height && yMarioD < Mario.MarioCharacter.Height) {
                if (Mario.MarioCharacter.Y > 0 && yMarioD <= 0 && (!Mario.MarioCharacter.OnGround || !Mario.MarioCharacter.WasOnGround)) {
                    Mario.MarioCharacter.Stomp(this);
                    this.Dead = true;

                    this.Xa = 0;
                    this.Ya = 1;
                    this.DeadTime = 100;
                } else {
                    Mario.MarioCharacter.GetHurt();
                }
            }
        }
    }

    /**
     * Updates the Bullet Bill's position and state.
     */
    Move(): void {
        var i = 0, sideWaysSpeed = 4;
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

        this.Xa = this.Facing * sideWaysSpeed;
        this.XFlip = this.Facing === -1;
        this.SubMove(this.Xa, 0);
    }

    /**
     * Handles sub-pixel movement.
     */
    SubMove(xa: number, ya: number): boolean {
        this.X += xa;
        return true;
    }

    /**
     * Checks for collision with a fireball.
     */
    FireballCollideCheck(fireball: Fireball): boolean {
        if (this.DeadTime !== 0) {
            return false;
        }

        var xD = fireball.X - this.X, yD = fireball.Y - this.Y;
        if (xD > -16 && xD < 16) {
            if (yD > -this.Height && yD < fireball.Height) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks for collision with a shell.
     */
    ShellCollideCheck(shell: Shell): boolean {
        if (this.DeadTime !== 0) {
            return false;
        }

        var xD = shell.X - this.X, yD = shell.Y - this.Y;
        if (xD > -16 && xD < 16) {
            if (yD > -this.Height && yD < shell.Height) {
                Resources.PlaySound("kick");
                this.Dead = true;
                this.Xa = 0;
                this.Ya = 1;
                this.DeadTime = 100;
                return true;
            }
        }
        return false;
    }
}
