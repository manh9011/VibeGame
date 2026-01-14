/**
 * Renders a background portion of the level.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { Drawable } from '../Enjine/drawable.js';
import { Resources } from '../Enjine/resources.js';
import { SpriteCuts } from './spriteCuts.js';
import * as PIXI from 'pixi.js';

export class BackgroundRenderer extends Drawable {
    constructor(level, width, height, distance) {
        super();
        this.Level = level;
        this.Width = width;
        this.Distance = distance;
        this.TilesY = ((height / 32) | 0) + 1;

        this.Background = SpriteCuts.GetBackgroundSheet();
    }

    Draw(container, camera) {
        var xCam = camera.X / this.Distance;
        var x = 0, y = 0, b = null;

        // This is simplified. 
        // Ideally we should cache the background sprites too.
        // For now, I'll allow immediate-mode style creation for background as it's fewer tiles,
        // BUT better practice is to create them once.

        // Let's implement caching on the fly for BackgroundRenderer as well
        if (!this.rootContainer) {
            this.rootContainer = new PIXI.Container();
            this.baseTexture = PIXI.Texture.from(Resources.Images["background"]);
            this.textureCache = {};
            this.bgSprites = []; // We might need to handle infinite scrolling or just large level?
            // Background is usually repeating or tied to level size?
            // Code loops based on Width/32. width argument passed in constructor.

            for (x = 0; x <= this.Width; x++) {
                this.bgSprites[x] = [];
                for (y = 0; y < this.TilesY; y++) {
                    b = this.Level.GetBlock(x, y) & 0xff;
                    const frame = this.Background[b % 8][(b / 8) | 0];
                    const tex = new PIXI.Texture({
                        source: this.baseTexture.source,
                        frame: new PIXI.Rectangle(frame.X, frame.Y, frame.Width, frame.Height)
                    });
                    const sprite = new PIXI.Sprite(tex);
                    sprite.x = x * 32;
                    sprite.y = y * 32;
                    this.rootContainer.addChild(sprite);
                    this.bgSprites[x][y] = sprite;
                }
            }
        }

        if (this.rootContainer.parent !== container) {
            container.addChild(this.rootContainer);
        }

        // Parallax scrolling
        this.rootContainer.x = -xCam;
    }

    OnRemove() {
        if (this.rootContainer) {
            if (this.rootContainer.parent) {
                this.rootContainer.parent.removeChild(this.rootContainer);
            }
            this.rootContainer.destroy({ children: true });
            this.rootContainer = null;
        }
    }
}
