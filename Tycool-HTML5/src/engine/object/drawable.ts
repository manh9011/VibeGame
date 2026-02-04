import { Camera } from "@/engine/scene/camera";
import { Renderer } from "@/engine/renderer/renderer";

/**
 * Base class for all drawable objects in the game.
 */
export class Drawable {
    ZOrder: number;

    constructor() {
        this.ZOrder = 0;
    }

    /**
     * Draws the object to the screen.
     * @param renderer The renderer instance.
     * @param camera The game camera.
     */
    Draw(renderer: Renderer, camera: Camera): void { }
}
