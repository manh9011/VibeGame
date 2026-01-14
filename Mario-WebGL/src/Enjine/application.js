/**
 * Simple demo of the engine.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { GameCanvas } from './gameCanvas.js';
import { GameTimer } from './gameTimer.js';
import { KeyboardInput } from './keyboardInput.js';
import { GameStateContext } from './state.js';

export class Application {
    constructor() {
        this.canvas = null;
        this.timer = null;
        this.stateContext = null;
    }

    Update(delta) {
        this.stateContext.Update(delta);

        // In retained mode, we don't clear and redraw. 
        // We update the scene graph.
        // But for compatibility with existing "Draw" calls doing logic, we call Draw passing the stage.
        // However, we should be careful not to keep adding sprites indefinitely.
        // For now, let's assume Draw updates existing sprites.
        this.stateContext.Draw(this.canvas.App.stage);

        this.canvas.EndDraw();
    }

    async Initialize(defaultState, resWidth, resHeight) {
        this.canvas = new GameCanvas();
        this.timer = new GameTimer();
        KeyboardInput.Initialize();

        await this.canvas.Initialize("canvas", resWidth, resHeight);

        this.timer.UpdateObject = this;
        this.stateContext = new GameStateContext(defaultState);
        this.timer.Start();
    }
}
