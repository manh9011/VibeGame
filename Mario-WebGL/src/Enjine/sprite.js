/**
 * Represents a simple static sprite.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { Drawable } from './drawable.js';
import * as PIXI from 'pixi.js';

export class Sprite extends Drawable {
    constructor() {
        super();
        this.X = 0;
        this.Y = 0;
        this.Image = null;
        this.pixiSprite = null;
    }

    Draw(container, camera) {
        if (!this.pixiSprite && this.Image) {
            this.pixiSprite = new PIXI.Sprite(PIXI.Texture.from(this.Image));
            container.addChild(this.pixiSprite);
        }

        if (this.pixiSprite) {
            this.pixiSprite.x = this.X - camera.X;
            this.pixiSprite.y = this.Y - camera.Y;
        }
    }

    OnRemove() {
        if (this.pixiSprite) {
            if (this.pixiSprite.parent) {
                this.pixiSprite.parent.removeChild(this.pixiSprite);
            }
            this.pixiSprite.destroy();
            this.pixiSprite = null;
        }
    }
}
