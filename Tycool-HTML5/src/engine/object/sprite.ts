import { Drawable } from '@/engine/object/drawable';
import { Renderer } from '@/engine/renderer/renderer';
import { Camera } from '@/engine/scene/camera';

/**
 * Base class for a simple drawable sprite using an image.
 */
export class Sprite extends Drawable {
    X: number;
    Y: number;
    Image: HTMLImageElement | null;

    constructor() {
        super();
        this.X = 0;
        this.Y = 0;
        this.Image = null;
    }

    /**
     * Draws the sprite to the screen.
     */
    Draw(renderer: Renderer, camera: Camera): void {
        if (this.Image) {
            renderer.DrawImage(this.Image, this.X - camera.X, this.Y - camera.Y);
        }
    }
}
