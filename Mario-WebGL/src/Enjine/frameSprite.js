/**
 * For sprites that are only a portion of an image.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { Sprite } from './sprite.js';
import * as PIXI from 'pixi.js';

export class FrameSprite extends Sprite {
    constructor() {
        super();
        this.FrameX = 0;
        this.FrameY = 0;
        this.FrameWidth = 0;
        this.FrameHeight = 0;
    }

    Draw(container, camera) {
        if (this.Image && !this.pixiSprite) {
            const baseTex = PIXI.Texture.from(this.Image);
            // Create unique texture for this sprite so we can change framing
            const tex = new PIXI.Texture({
                source: baseTex.source,
                frame: new PIXI.Rectangle(this.FrameX, this.FrameY, this.FrameWidth, this.FrameHeight)
            });
            this.pixiSprite = new PIXI.Sprite(tex);
            container.addChild(this.pixiSprite);
        }

        if (this.pixiSprite) {
            // Update Frame if changed
            const tex = this.pixiSprite.texture;
            if (tex.frame.x !== this.FrameX || tex.frame.y !== this.FrameY ||
                tex.frame.width !== this.FrameWidth || tex.frame.height !== this.FrameHeight) {

                // Update frame
                // We could just assign a new texture, or update existing if it's unique
                // Safe way: update the frame object
                tex.frame.x = this.FrameX;
                tex.frame.y = this.FrameY;
                tex.frame.width = this.FrameWidth;
                tex.frame.height = this.FrameHeight;
                tex.updateUvs();
            }

            this.pixiSprite.x = this.X - camera.X;
            this.pixiSprite.y = this.Y - camera.Y;
        }
    }
}
