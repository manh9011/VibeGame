/**
 * Base class to represent a double buffered canvas object.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import * as PIXI from 'pixi.js';

export class GameCanvas {
    constructor() {
        this.App = new PIXI.Application();
        this.Canvas = null;
    }

    async Initialize(canvasId, resWidth, resHeight) {
        this.Canvas = document.getElementById(canvasId);

        // Initialize PixiJS Application
        await this.App.init({
            canvas: this.Canvas,
            width: resWidth,
            height: resHeight,
            backgroundColor: 0x6b8cff, // Example Sky Blue
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        // Set default scale mode to nearest for pixel art
        PIXI.TextureSource.defaultOptions.scaleMode = 'nearest';
    }

    BeginDraw() {
        // PixiJS handles clearing automatically
    }

    EndDraw() {
        // PixiJS handles rendering automatically via its ticker, 
        // but if we are manually driving the loop, we might render here.
        this.App.render();
    }
}
