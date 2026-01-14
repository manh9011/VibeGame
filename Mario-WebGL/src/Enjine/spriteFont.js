/**
 * Represents a sprite sheet for a font.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { Drawable } from './drawable.js';
import * as PIXI from 'pixi.js';

export class SpriteFont extends Drawable {
    constructor(strings, image, letterWidth, letterHeight, letters) {
        super();
        this.Image = image;
        this.Letters = letters;
        this.LetterWidth = letterWidth;
        this.LetterHeight = letterHeight;
        this.Strings = strings;
    }

    Draw(container, camera) {
        // SpriteFont uses a collection of characters.
        // We can manage a child container for the text.

        if (!this.rootContainer) {
            this.rootContainer = new PIXI.Container();
            // We assume this font object is persistent
        }

        if (this.rootContainer.parent !== container) {
            container.addChild(this.rootContainer);
        }

        // Rebuild or Update sprites?
        // Simple but inefficient: Clear and Rebuild.
        // Better: Sync loop.

        // Let's assume low text count and just rebuild for robustness during migration.
        // Optimization can happen later.
        this.rootContainer.removeChildren();

        const baseTex = PIXI.Texture.from(this.Image);

        for (var s = 0; s < this.Strings.length; s++) {
            var string = this.Strings[s];
            for (var i = 0; i < string.String.length; i++) {
                var code = string.String.charCodeAt(i);

                // Create tex
                const tex = new PIXI.Texture({
                    source: baseTex.source,
                    frame: new PIXI.Rectangle(this.Letters[code].X, this.Letters[code].Y, this.LetterWidth, this.LetterHeight)
                });

                const sprite = new PIXI.Sprite(tex);
                sprite.x = string.X + this.LetterWidth * (i + 1);
                sprite.y = string.Y;
                this.rootContainer.addChild(sprite);
            }
        }

        // Camera offset if needed? 
        // Original code: context.drawImage(..., string.X ..., ...).
        // It doesn't use camera.X ?? 
        // `Draw(context, camera)` signature exists but camera isn't used in original `SpriteFont.Draw`.
        // Wait, `SpriteFont` is typically used for UI (Title Screen).
        // So no camera offset. 
        // Correct.
    }
}
