import { Drawable } from '../Enjine/drawable';
import { Resources } from '../Enjine/resources';
import { SpriteCuts, SpriteFrame } from './spriteCuts';
import { Tile, Level } from './level';
import { Renderer } from '../Enjine/renderer';
import { Camera } from '../Enjine/camera';

/**
 * Renders the current level.
 */
export class LevelRenderer extends Drawable {
    /** Width of the level in pixels. */
    Width: number;
    /** Height of the level in pixels. */
    Height: number;
    /** Reference to the level data. */
    Level: Level;
    /** Height of the level in tiles. */
    TilesY: number;
    /** Frame delta time. */
    Delta: number;
    /** Animation tick counter. */
    Tick: number;
    /** Bounce animation timer for blocks. */
    Bounce: number;
    /** Global animation timer. */
    AnimTime: number;
    /** Background sprite frames. */
    Background: SpriteFrame[][];

    constructor(level: Level, width: number, height: number) {
        super();
        this.Width = width;
        this.Height = height;
        this.Level = level;
        this.TilesY = ((height / 16) | 0) + 1;
        this.Delta = 0;
        this.Tick = 0;
        this.Bounce = 0;
        this.AnimTime = 0;

        this.Background = SpriteCuts.GetLevelSheet();
    }

    /**
     * Updates the level renderer animation state.
     */
    Update(delta: number): void {
        this.AnimTime += delta;
        this.Tick = this.AnimTime | 0;
        this.Bounce += delta * 30;
        this.Delta = delta;
    }

    /**
     * Draws the level to the screen.
     */
    Draw(renderer: Renderer, camera: Camera): void {
        this.DrawStatic(renderer, camera);
        this.DrawDynamic(renderer, camera);
    }

    /**
     * Draws static static tiles (non-animated).
     */
    DrawStatic(renderer: Renderer, camera: Camera): void {
        var x = 0, y = 0, b = 0, frame = null, xTileStart = (camera.X / 16) | 0, xTileEnd = ((camera.X + this.Width) / 16) | 0;

        for (x = xTileStart; x < xTileEnd + 1; x++) {
            for (y = 0; y < this.TilesY; y++) {
                b = this.Level.GetBlock(x, y) & 0xff;
                if ((Tile.Behaviors[b] & Tile.Animated) === 0) {
                    frame = this.Background[b % 16][(b / 16) | 0];
                    renderer.DrawImage(Resources.Images["map"], ((x << 4) - camera.X) | 0, (y << 4) | 0, frame.Width, frame.Height, frame.X, frame.Y, frame.Width, frame.Height);
                }
            }
        }
    }

    /**
     * Draws dynamic tiles (animated).
     */
    DrawDynamic(renderer: Renderer, camera: Camera): void {
        var x = 0, y = 0, b = 0, animTime = 0, yo = 0, frame = null;
        for (x = (camera.X / 16) | 0; x <= (((camera.X + this.Width) / 16) | 0); x++) {
            for (y = (camera.Y / 16) | 0; y <= (((camera.Y + this.Height) / 16) | 0); y++) {
                b = this.Level.GetBlock(x, y);

                if (((Tile.Behaviors[b & 0xff] as number) & Tile.Animated) > 0) {
                    animTime = ((this.Bounce / 3) | 0) % 4;
                    if ((((b % 16) / 4) | 0) === 0 && ((b / 16) | 0) === 1) {
                        animTime = ((this.Bounce / 2 + (x + y) / 8) | 0) % 20;
                        if (animTime > 3) {
                            animTime = 0;
                        }
                    }
                    if ((((b % 16) / 4) | 0) === 3 && ((b / 16) | 0) === 0) {
                        animTime = 2;
                    }
                    yo = 0;
                    if (x >= 0 && y >= 0 && x < this.Level.Width && y < this.Level.Height) {
                        yo = this.Level.Data[x][y];
                    }
                    if (yo > 0) {
                        yo = (Math.sin((yo - this.Delta) / 4 * Math.PI) * 8) | 0;
                    }
                    frame = this.Background[(((b % 16) / 4) | 0) * 4 + animTime][(b / 16) | 0];
                    renderer.DrawImage(Resources.Images["map"], (x << 4) - camera.X, (y << 4) - camera.Y - yo, frame.Width, frame.Height, frame.X, frame.Y, frame.Width, frame.Height);
                }
            }
        }
    }

    /**
     * Draws the exit pipe/zone (part 0).
     */
    DrawExit0(renderer: Renderer, camera: Camera, bar: boolean): void {
        var y = 0, yh = 0, frame = null;
        for (y = this.Level.ExitY - 8; y < this.Level.ExitY; y++) {
            frame = this.Background[12][y === this.Level.ExitY - 8 ? 4 : 5];
            renderer.DrawImage(Resources.Images["map"], (this.Level.ExitX << 4) - camera.X - 16, (y << 4) - camera.Y, frame.Width, frame.Height, frame.X, frame.Y, frame.Width, frame.Height);
        }

        if (bar) {
            yh = this.Level.ExitY * 16 - (3 * 16) - (Math.sin(this.AnimTime) * 3 * 16) - 8;
            frame = this.Background[12][3];
            renderer.DrawImage(Resources.Images["map"], (this.Level.ExitX << 4) - camera.X - 16, yh - camera.Y, frame.Width, frame.Height, frame.X, frame.Y, frame.Width, frame.Height);
            frame = this.Background[13][3];
            renderer.DrawImage(Resources.Images["map"], (this.Level.ExitX << 4) - camera.X, yh - camera.Y, frame.Width, frame.Height, frame.X, frame.Y, frame.Width, frame.Height);
        }
    }

    /**
     * Draws the exit pipe/zone (part 1).
     */
    DrawExit1(renderer: Renderer, camera: Camera): void {
        var y = 0, frame = null;
        for (y = this.Level.ExitY - 8; y < this.Level.ExitY; y++) {
            frame = this.Background[13][y === this.Level.ExitY - 8 ? 4 : 5];
            renderer.DrawImage(Resources.Images["map"], (this.Level.ExitX << 4) - camera.X + 16, (y << 4) - camera.Y, frame.Width, frame.Height, frame.X, frame.Y, frame.Width, frame.Height);
        }
    }
}
