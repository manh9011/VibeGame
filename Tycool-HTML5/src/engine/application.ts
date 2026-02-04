import { GameCanvas } from '@/engine/scene/gameCanvas';
import { GameTimer } from '@/engine/scene/gameTimer';
import { KeyboardInput } from '@/engine/input/keyboardInput';
import { MouseInput } from '@/engine/input/mouseInput';
import { GameSceneContext } from '@/engine/scene/gameSceneContext';
import { GameScene } from '@/engine/scene/gameScene';

/**
 * Main Application class that manages the game loop and scene.
 */
export class Application {
    canvas: GameCanvas;
    timer: GameTimer;
    sceneContext: GameSceneContext | null;
    renderMode: string;

    constructor(renderMode: string = 'webgl') {
        this.canvas = new GameCanvas();
        this.timer = new GameTimer();
        this.sceneContext = null;
        this.renderMode = renderMode;
    }

    /**
     * Main update loop.
     * @param delta Time elapsed since last update.
     */
    Update(delta: number): void {
        if (this.sceneContext) {
            this.sceneContext.Update(delta);

            this.canvas.BeginDraw();
            this.sceneContext.Draw(this.canvas.Renderer);

            if (this.canvas.Renderer.flush) {
                this.canvas.Renderer.flush();
            }

            this.canvas.EndDraw();
        }
    }

    /**
     * Initializes the application.
     * @param defaultScene The starting game scene.
     * @param resWidth Resolution width.
     * @param resHeight Resolution height.
     */
    Initialize(defaultScene: GameScene, resWidth: number, resHeight: number): void {
        this.canvas = new GameCanvas();
        this.timer = new GameTimer();
        KeyboardInput.Initialize();
        this.canvas.Initialize("game-canvas", resWidth, resHeight, this.renderMode);
        MouseInput.Initialize(this.canvas.Canvas!);
        this.timer.UpdateObject = this;

        this.sceneContext = new GameSceneContext(defaultScene);

        this.timer.Start();
    }

    /**
     * Checks if the current device is a mobile device.
     */
    static IsMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}
