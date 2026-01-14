import { Sprite } from './sprite';
import { Renderer } from './renderer';
import { Camera } from './camera';

/**
 * Sprite that renders a specific frame from a spritesheet.
 */
export class FrameSprite extends Sprite {
    FrameX: number;
    FrameY: number;
    FrameWidth: number;
    FrameHeight: number;

    constructor() {
        super();
        this.FrameX = 0;
        this.FrameY = 0;
        this.FrameWidth = 0;
        this.FrameHeight = 0;
    }

    /**
     * Draws the sprite frame to the screen.
     */
    Draw(renderer: Renderer, camera: Camera): void {
        if (this.Image) {
            renderer.DrawImage(this.Image, this.X - camera.X, this.Y - camera.Y, this.FrameWidth, this.FrameHeight, this.FrameX, this.FrameY, this.FrameWidth, this.FrameHeight);
        }
    }
}
