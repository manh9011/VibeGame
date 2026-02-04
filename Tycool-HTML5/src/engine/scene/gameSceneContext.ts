import { Renderer } from "@/engine/renderer/renderer";
import { GameScene } from "@/engine/scene/gameScene";

/**
 * Context class that holds the current game scene and delegates updates/drawing.
 */
export class GameSceneContext {
    Scene: GameScene | null;

    constructor(defaultScene: GameScene | null) {
        this.Scene = null;

        if (defaultScene != null) {
            this.Scene = defaultScene;
            this.Scene.Enter();
        }
    }

    /**
     * Changes the current scene.
     * @param newScene The new scene to switch to.
     */
    ChangeScene(newScene: GameScene): void {
        if (this.Scene != null) {
            this.Scene.Exit();
        }
        this.Scene = newScene;
        this.Scene.Enter();
    }

    /**
     * Updates the current scene.
     * @param delta Time elapsed.
     */
    Update(delta: number): void {
        if (this.Scene) {
            this.Scene.CheckForChange(this);
            this.Scene.Update(delta);
        }
    }

    /**
     * Draws the current scene.
     * @param renderer Renderer instance.
     */
    Draw(renderer: Renderer): void {
        if (this.Scene) {
            this.Scene.Draw(renderer);
        }
    }
}