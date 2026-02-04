import { Drawable } from '@/engine/object/drawable';
import { Renderer } from '@/engine/renderer/renderer';
import { Camera } from '@/engine/scene/camera';

/**
 * Represents a string to be drawn with a sprite font.
 */
export interface FontString {
    String: string;
    X: number;
    Y: number;
}

/** Letter position in sprite sheet */
export interface LetterPosition {
    X: number;
    Y: number;
}

/**
 * Class to draw text using a bitmap font (spritesheet).
 */
export class SpriteFont extends Drawable {
    Image: HTMLImageElement;
    Letters: { [key: number]: LetterPosition };
    LetterWidth: number;
    LetterHeight: number;
    Strings: FontString[];

    constructor(strings: FontString[], image: HTMLImageElement, letterWidth: number, letterHeight: number, letters: { [key: number]: LetterPosition }) {
        super();
        this.Image = image;
        this.Letters = letters;
        this.LetterWidth = letterWidth;
        this.LetterHeight = letterHeight;
        this.Strings = strings;
    }

    /**
     * Draws the strings managed by this font object.
     */
    Draw(renderer: Renderer, camera: Camera): void { // Helper function doesn't use camera?
        for (var s = 0; s < this.Strings.length; s++) {
            var string = this.Strings[s];
            for (var i = 0; i < string.String.length; i++) {
                var code = string.String.charCodeAt(i);
                renderer.DrawImage(this.Image, string.X + this.LetterWidth * (i + 1), string.Y, this.LetterWidth, this.LetterHeight, this.Letters[code].X, this.Letters[code].Y, this.LetterWidth, this.LetterHeight);
            }
        }
    }
}
