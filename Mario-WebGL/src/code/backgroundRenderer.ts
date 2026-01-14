import { Drawable } from '../Enjine/drawable';
import { Resources } from '../Enjine/resources';
import { SpriteCuts, SpriteFrame } from './spriteCuts';
import { Level } from './level';
import { Renderer } from '../Enjine/renderer';
import { Camera } from '../Enjine/camera';

/**
 * Renders the background level.
 */
export class BackgroundRenderer extends Drawable {
    /** The level data to render. */
    Level: Level;
    /** Width of the visible area (viewport). */
    Width: number;
    /** Parallax distance factor (defines scrolling speed). */
    Distance: number;
    /** Number of tiles vertically to render. */
    TilesY: number;
    /** Spritesheet frames for the background tiles. */
    Background: SpriteFrame[][];

    constructor(level: Level, width: number, height: number, distance: number) {
        super();
        this.Level = level;
        this.Width = width;
        this.Distance = distance;
        this.TilesY = ((height / 32) | 0) + 1;

        this.Background = SpriteCuts.GetBackgroundSheet();
    }

    /**
     * Draws the background to the screen.
     */
    Draw(renderer: Renderer, camera: Camera): void {
        var xCam = camera.X / this.Distance;
        var x = 0, y = 0, b = 0, frame = null;

        var xTileStart = (xCam / 32) | 0;
        var xTileEnd = (((xCam + this.Width) / 32) | 0);

        for (x = xTileStart; x <= xTileEnd; x++) {
            for (y = 0; y < this.TilesY; y++) {
                b = this.Level.GetBlock(x, y) & 0xff;
                frame = this.Background[b % 8][(b / 8) | 0];

                renderer.DrawImage(Resources.Images["background"], ((x << 5) - xCam) | 0, (y << 5) | 0, frame.Width, frame.Height, frame.X, frame.Y, frame.Width, frame.Height);
            }
        }
    }
}
