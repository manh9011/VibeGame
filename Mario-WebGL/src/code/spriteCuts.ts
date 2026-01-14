import { SpriteFont } from '../Enjine/spriteFont';
import { Resources } from '../Enjine/resources';

/** Interface for sprite frame data used in sprite sheets */
/** Interface for sprite frame data used in sprite sheets */
export interface SpriteFrame {
    /** X coordinate in the spritesheet. */
    X: number;
    /** Y coordinate in the spritesheet. */
    Y: number;
    /** Width of the frame. */
    Width: number;
    /** Height of the frame. */
    Height: number;
}

/**
 * Helper object for cutting spritesheets into individual frames and creating fonts.
 */
export const SpriteCuts = {

    /*********************
     * Font related
     ********************/
    /**
     * Creates a black font sprite.
     */
    CreateBlackFont: function (): SpriteFont {
        return new SpriteFont([], Resources.Images["font"], 8, 8, this.GetCharArray(0));
    },

    /**
     * Creates a red font sprite.
     */
    CreateRedFont: function (): SpriteFont {
        return new SpriteFont([], Resources.Images["font"], 8, 8, this.GetCharArray(8));
    },

    /**
     * Creates a green font sprite.
     */
    CreateGreenFont: function (): SpriteFont {
        return new SpriteFont([], Resources.Images["font"], 8, 8, this.GetCharArray(16));
    },

    /**
     * Creates a blue font sprite.
     */
    CreateBlueFont: function (): SpriteFont {
        return new SpriteFont([], Resources.Images["font"], 8, 8, this.GetCharArray(24));
    },

    /**
     * Creates a yellow font sprite.
     */
    CreateYellowFont: function (): SpriteFont {
        return new SpriteFont([], Resources.Images["font"], 8, 8, this.GetCharArray(32));
    },

    /**
     * Creates a pink font sprite.
     */
    CreatePinkFont: function (): SpriteFont {
        return new SpriteFont([], Resources.Images["font"], 8, 8, this.GetCharArray(40));
    },

    /**
     * Creates a cyan font sprite.
     */
    CreateCyanFont: function (): SpriteFont {
        return new SpriteFont([], Resources.Images["font"], 8, 8, this.GetCharArray(48));
    },

    /**
     * Creates a white font sprite.
     */
    CreateWhiteFont: function (): SpriteFont {
        return new SpriteFont([], Resources.Images["font"], 8, 8, this.GetCharArray(56));
    },

    /**
     * Generates character positions for the font sheet.
     */
    GetCharArray: function (y: number): { X: number, Y: number }[] {
        var letters = [];
        var i = 0;
        for (i = 32; i < 127; i++) {
            letters[i] = { X: (i - 32) * 8, Y: y };
        }
        return letters;
    },

    /*********************
     * Spritesheet related
     ********************/
    /**
     * cuts the background spritesheet.
     */
    GetBackgroundSheet: function (): SpriteFrame[][] {
        var sheet: SpriteFrame[][] = [];
        var x = 0, y = 0, width = Resources.Images["background"].width / 32, height = Resources.Images["background"].height / 32;

        for (x = 0; x < width; x++) {
            sheet[x] = [];

            for (y = 0; y < height; y++) {
                sheet[x][y] = { X: x * 32, Y: y * 32, Width: 32, Height: 32 };
            }
        }
        return sheet;
    },

    /**
     * Cuts the level spritesheet.
     */
    GetLevelSheet: function (): SpriteFrame[][] {
        var sheet: SpriteFrame[][] = [], x = 0, y = 0, width = Resources.Images["map"].width / 16, height = Resources.Images["map"].height / 16;

        for (x = 0; x < width; x++) {
            sheet[x] = [];

            for (y = 0; y < height; y++) {
                sheet[x][y] = { X: x * 16, Y: y * 16, Width: 16, Height: 16 };
            }
        }
        return sheet;
    }
};
