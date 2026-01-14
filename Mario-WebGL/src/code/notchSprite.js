/**
 * Notch made his own sprite class for this game. Rather than hack around my own,
 * I directly ported his to JavaScript and used that where needed.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { Drawable } from '../Enjine/drawable.js';
import * as PIXI from 'pixi.js';

export class NotchSprite extends Drawable {
    constructor(image) {
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
        this.LastImage = null;
    }

    Draw(container, camera) {
        if (!this.Visible) {
            if (this.pixiSprite) this.pixiSprite.visible = false;
            return;
        }

        var xPixel = ((this.XOld + (this.X - this.XOld) * this.Delta) | 0) - this.XPicO;
        var yPixel = ((this.YOld + (this.Y - this.YOld) * this.Delta) | 0) - this.YPicO;

        if (this.Image !== this.LastImage) {
            if (this.pixiSprite) {
                if (this.pixiSprite.parent) this.pixiSprite.parent.removeChild(this.pixiSprite);
                this.pixiSprite.destroy();
                this.pixiSprite = null;
            }
            this.LastImage = this.Image;
        }

        if (this.Image && !this.pixiSprite) {
            const baseTex = PIXI.Texture.from(this.Image);
            const tex = new PIXI.Texture({
                source: baseTex.source,
                frame: new PIXI.Rectangle(this.XPic * this.PicWidth, this.YPic * this.PicHeight, this.PicWidth, this.PicHeight)
            });
            this.pixiSprite = new PIXI.Sprite(tex);
            container.addChild(this.pixiSprite);
        }

        if (this.pixiSprite) {
            this.pixiSprite.visible = true;
            // Layer 0 = Behind Level (5), Layer 1 = Front of Level (15)
            // LevelRenderer is zIndex 10
            this.pixiSprite.zIndex = (this.Layer === 1) ? 15 : 5;

            // Update Texture Frame or Source
            const tex = this.pixiSprite.texture;
            const targetX = this.XPic * this.PicWidth;
            const targetY = this.YPic * this.PicHeight;

            if (tex.frame.x !== targetX || tex.frame.y !== targetY ||
                tex.frame.width !== this.PicWidth || tex.frame.height !== this.PicHeight) {
                tex.frame.x = targetX;
                tex.frame.y = targetY;
                tex.frame.width = this.PicWidth;
                tex.frame.height = this.PicHeight;
                tex.updateUvs();
            }

            // Standardize Flip Logic similar to Enemy/FrameSprite
            this.pixiSprite.anchor.set(0, 0);
            this.pixiSprite.scale.set(1, 1);

            // Position
            // Original: drawImage(..., xPixel, yPixel, ...)
            // With flip: (320 - xPixel - PicWidth) ??
            // Wait, the original code had `context.translate(this.XFlip ? -320 : 0 ...)`
            // This suggests it flips the WHOLE SCREEN coordinate system relative to 320 width?
            // "Notch made his own sprite class... I directly ported his..."
            // It seems specific to the viewport size (320x240).
            // context.scale(-1, 1) flips the X axis. 
            // -320 translation means pixel 320 becomes 0.
            // If xPixel is 100. Draw at 320-100-Width = 220-Width.
            // Inverted X: -220. translate(-320) -> -220 - 320? No.
            // It's tricky.
            // Let's stick to Local object flip.
            // If I flip the sprite, I just mirror it.
            // If the INTENT is just to mirror the sprite image:

            let drawX = xPixel - camera.X;
            let drawY = yPixel - camera.Y;

            if (this.XFlip) {
                this.pixiSprite.anchor.x = 1;
                this.pixiSprite.scale.x = -1;
                drawX += this.PicWidth;
            }
            if (this.YFlip) {
                this.pixiSprite.anchor.y = 1;
                this.pixiSprite.scale.y = -1;
                drawY += this.PicHeight;
            }

            this.pixiSprite.x = drawX;
            this.pixiSprite.y = drawY;
        }
    }

    Update(delta) {
        this.XOld = this.X;
        this.YOld = this.Y;
        this.Move();
        this.Delta = delta;
    }

    UpdateNoMove(delta) {
        this.XOld = this.X;
        this.YOld = this.Y;
        this.Delta = 0;
    }

    Move() {
        this.X += this.Xa;
        this.Y += this.Ya;
    }

    GetX(delta) {
        return ((this.XOld + (this.X - this.XOld) * delta) | 0) - this.XPicO;
    }

    GetY(delta) {
        return ((this.YOld + (this.Y - this.YOld) * delta) | 0) - this.YPicO;
    }

    CollideCheck() { }

    BumpCheck(xTile, yTile) { }

    Release(mario) { }

    ShellCollideCheck(shell) {
        return false;
    }

    FireballCollideCheck(fireball) {
        return false;
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
