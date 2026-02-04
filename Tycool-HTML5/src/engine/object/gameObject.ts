/**
 * BaseObject - Base entity for Tycoon objects implementing IDrawable.
 * All game objects should extend this class for proper DrawableManager integration.
 */
import { IDrawable } from '@/engine/object/drawableManager';
import { Renderer } from '@/engine/renderer/renderer';
import { Camera } from '@/engine/scene/camera';
import { CONFIG } from '@/code/Options';

export class GameObject implements IDrawable {
    // Grid position
    public x: number = 0;
    public y: number = 0;

    // Visibility
    public visible: boolean = true;

    // IDrawable properties
    public ZOrder: number = 0;      // Draw order (lower = behind, higher = in front)
    public Layer: number = 0;       // 0 = world, 1 = UI

    protected zOrderOffset: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Set object grid position and recalculate ZOrder.
     */
    public SetPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.UpdateZOrder();
    }

    /**
     * Update object scene. Called by DrawableManager.
     */
    public Update(delta: number): void {
        // Override in subclass
    }

    /**
     * Draw the object. Called by DrawableManager.
     * @param renderer The renderer instance
     * @param camera The game camera (use for position transformations)
     */
    public Draw(renderer: Renderer, camera: Camera): void {
        // Override in subclass
    }

    /**
     * Calculate ZOrder based on grid position for isometric sorting.
     */
    public UpdateZOrder(mapSize: number = CONFIG.mapSize): void {
        // Isometric z-order: (x + y) gives the depth layer.
        // We multiply by mapSize to make it the primary sort and use x/y to resolve same-depth conflicts.
        this.ZOrder = ((this.x + this.y) * mapSize + this.x) + this.zOrderOffset;
    }
}
