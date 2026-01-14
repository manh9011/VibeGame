import { Drawable } from '../Enjine/drawable';
import { Renderer } from '../Enjine/renderer';
import { Camera } from '../Enjine/camera';
import { SpriteTemplate } from './spriteTemplate';
import type { Character } from './character';
import type { Shell } from './shell';
import type { Fireball } from './fireball';

/**
 * Base class for various sprites in the game (Enemies, items, effects).
 */
export class NotchSprite extends Drawable {
    /** Previous X position (for interpolation). */
    XOld: number;
    /** Previous Y position (for interpolation). */
    YOld: number;
    /** Current X position. */
    X: number;
    /** Current Y position. */
    Y: number;
    /** X velocity/acceleration. */
    Xa: number;
    /** Y velocity/acceleration. */
    Ya: number;
    /** X index of the sprite in the sheet. */
    XPic: number;
    /** Y index of the sprite in the sheet. */
    YPic: number;
    /** X offset for drawing the sprite. */
    XPicO: number;
    /** Y offset for drawing the sprite. */
    YPicO: number;
    /** Width of the sprite frame. */
    PicWidth: number;
    /** Height of the sprite frame. */
    PicHeight: number;
    /** Whether to flip the sprite horizontally. */
    XFlip: boolean;
    /** Whether to flip the sprite vertically. */
    YFlip: boolean;
    /** Whether the sprite is visible. */
    Visible: boolean;
    /** Main sprite sheet image. */
    Image: HTMLImageElement | null;
    /** Frame delta time. */
    Delta: number;
    /** Template used to create this sprite (if any). */
    SpriteTemplate: SpriteTemplate | null;
    /** Rendering layer index. */
    Layer: number;
    /** Collision width. */
    Width: number;
    /** Collision height. */
    Height: number;

    constructor(image: HTMLImageElement | null) {
        super();
        this.XOld = 0; this.YOld = 0;
        this.X = 0; this.Y = 0;
        this.Xa = 0; this.Ya = 0;
        this.XPic = 0; this.YPic = 0;
        this.XPicO = 0; this.YPicO = 0;
        this.PicWidth = 32; this.PicHeight = 32;
        this.XFlip = false; this.YFlip = false;
        this.Visible = true;
        this.Image = image;
        this.Delta = 0;
        this.SpriteTemplate = null;
        this.Layer = 1;
        this.Width = 0;
        this.Height = 0;
    }

    /**
     * Draws the sprite to the screen.
     */
    Draw(renderer: Renderer, camera: Camera): void {
        var xPixel = 0, yPixel = 0;
        if (!this.Visible) {
            return;
        }

        // Interpolate position
        xPixel = ((this.XOld + (this.X - this.XOld) * this.Delta) | 0) - this.XPicO;
        yPixel = ((this.YOld + (this.Y - this.YOld) * this.Delta) | 0) - this.YPicO;

        renderer.Save();
        renderer.Scale(this.XFlip ? -1 : 1, this.YFlip ? -1 : 1);
        renderer.Translate(this.XFlip ? -320 : 0, this.YFlip ? -240 : 0);

        if (this.Image) {
            renderer.DrawImage(this.Image,
                this.XFlip ? (320 - xPixel - this.PicWidth) : xPixel,
                this.YFlip ? (240 - yPixel - this.PicHeight) : yPixel,
                this.PicWidth, this.PicHeight,
                this.XPic * this.PicWidth, this.YPic * this.PicHeight, this.PicWidth, this.PicHeight
            );
        }
        renderer.Restore();
    }

    /**
     * Updates the sprite state.
     */
    Update(delta: number): void {
        this.XOld = this.X;
        this.YOld = this.Y;
        this.Move();
        this.Delta = delta;
    }

    /**
     * Updates the sprite without moving it (e.g. when paused).
     */
    UpdateNoMove(delta: number): void {
        this.XOld = this.X;
        this.YOld = this.Y;
        this.Delta = 0;
    }

    /**
     * Handles movement logic. Intended to be overridden.
     */
    Move(): void {
        this.X += this.Xa;
        this.Y += this.Ya;
    }

    /**
     * Gets the interpolated X position.
     */
    GetX(delta: number): number {
        return ((this.XOld + (this.X - this.XOld) * delta) | 0) - this.XPicO;
    }

    /**
     * Gets the interpolated Y position.
     */
    GetY(delta: number): number {
        return ((this.YOld + (this.Y - this.YOld) * delta) | 0) - this.YPicO;
    }

    /**
     * Checks for collisions. Intended to be overridden.
     */
    CollideCheck(): void { }

    /**
     * Checks for bumps from below. Intended to be overridden.
     */
    BumpCheck(xTile: number, yTile: number): void { }

    /**
     * Called when thrown or released by Mario. Intended to be overridden.
     */
    Release(mario: Character): void { }

    /**
     * Checks for collision with a shell.
     */
    ShellCollideCheck(shell: Shell): boolean {
        return false;
    }

    /**
     * Checks for collision with a fireball.
     */
    FireballCollideCheck(fireball: Fireball): boolean {
        return false;
    }
}
