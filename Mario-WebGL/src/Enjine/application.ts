import { GameCanvas } from './gameCanvas';
import { GameTimer } from './gameTimer';
import { KeyboardInput } from './keyboardInput';
import { MouseInput } from './mouseInput';
import { GameStateContext, GameState } from './state';

/**
 * Main Application class that manages the game loop and state.
 */
export class Application {
    canvas: GameCanvas;
    timer: GameTimer;
    stateContext: GameStateContext | null;
    renderMode: string;

    constructor(renderMode: string = 'webgl') {
        this.canvas = new GameCanvas();
        this.timer = new GameTimer();
        this.stateContext = null;
        this.renderMode = renderMode;
    }

    /**
     * Main update loop.
     * @param delta Time elapsed since last update.
     */
    Update(delta: number): void {
        if (this.stateContext) {
            this.stateContext.Update(delta);

            this.canvas.BeginDraw();
            this.stateContext.Draw(this.canvas.Renderer);

            if (this.canvas.Renderer.flush) {
                this.canvas.Renderer.flush();
            }

            this.canvas.EndDraw();
        }
    }

    /**
     * Initializes the application.
     * @param defaultState The starting game state.
     * @param resWidth Resolution width.
     * @param resHeight Resolution height.
     */
    Initialize(defaultState: GameState, resWidth: number, resHeight: number): void {
        this.canvas = new GameCanvas();
        this.timer = new GameTimer();
        KeyboardInput.Initialize();
        this.canvas.Initialize("canvas", resWidth, resHeight, this.renderMode);
        MouseInput.Initialize(this.canvas.Canvas!);
        this.timer.UpdateObject = this;

        this.stateContext = new GameStateContext(defaultState);

        this.timer.Start();
    }
}
