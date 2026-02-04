import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { DrawableManager } from "@/engine/object/drawableManager";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { GameSceneContext } from "@/engine/scene/gameSceneContext";

/**
 * GameScene - Base class for game scenes with built-in camera and drawable management.
 * Provides unified update and draw loops with proper z-ordering.
 */
export class GameScene {
    // Camera instance
    public camera: Camera;

    // Drawable managers for different layers
    public worldObjects: DrawableManager;  // Game world objects (tiles, buildings, characters)
    public uiObjects: DrawableManager;     // UI elements (buttons, panels, dialogs)

    // Flags
    protected initialized: boolean = false;

    constructor() {
        this.camera = new Camera();
        this.worldObjects = new DrawableManager();
        this.uiObjects = new DrawableManager();
    }

    /**
     * Called when scene is entered. Override to add initialization logic.
     */
    public Enter(): void {
        // Override in subclass
    }

    /**
     * Called when scene is exited. Override to add cleanup logic.
     */
    public Exit(): void {
        this.worldObjects.Clear();
        this.uiObjects.Clear();
    }

    /**
     * Update all managed objects.
     */
    public Update(delta: number): void {
        if (!this.initialized) return;

        // Update world objects
        this.worldObjects.Update(delta);

        // Update UI objects
        this.uiObjects.Update(delta);
    }

    /**
     * Draw all managed objects with proper layering.
     * World objects are drawn with camera transform, UI objects are drawn without.
     */
    public Draw(renderer: Renderer): void {
        const canvasRenderer = renderer as Canvas2DRenderer;
        const ctx = canvasRenderer.context;

        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const domCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        if (!domCanvas) return;

        const rect = domCanvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const logicalWidth = rect.width;
        const logicalHeight = rect.height;

        // Initialize on first draw
        if (!this.initialized) {
            this.camera.Initialize(canvasRenderer.width, canvasRenderer.height);
            this.OnInitialize(canvasRenderer);
            this.initialized = true;
        }

        // Handle canvas resize
        const expectedWidth = Math.floor(logicalWidth * dpr);
        const expectedHeight = Math.floor(logicalHeight * dpr);
        if (ctx.canvas.width !== expectedWidth || ctx.canvas.height !== expectedHeight) {
            ctx.canvas.width = expectedWidth;
            ctx.canvas.height = expectedHeight;
            if (domCanvas.width !== expectedWidth || domCanvas.height !== expectedHeight) {
                domCanvas.width = expectedWidth;
                domCanvas.height = expectedHeight;
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            this.camera.Resize(logicalWidth, logicalHeight);
        }

        // Clear canvas
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);

        // Draw background (override in subclass)
        this.OnDrawBackground(canvasRenderer);

        // Draw world objects (with camera - z-order managed by DrawableManager)
        this.worldObjects.Draw(renderer, this.camera);

        // Draw game-specific elements (override in subclass)
        this.OnDrawWorld(canvasRenderer);

        // Reset transform for UI layer
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        // Draw UI objects (no camera transform)
        this.uiObjects.Draw(renderer, this.camera);

        // Draw game-specific UI elements (override in subclass)
        this.OnDrawUI(canvasRenderer);
    }

    /**
     * Checks if the scene needs to change.
     * @param context The scene context.
     */
    public CheckForChange(context: GameSceneContext): void { }

    /**
     * Called once when scene is first initialized.
     * Override to perform one-time setup.
     */
    protected OnInitialize(renderer: Canvas2DRenderer): void {
        // Override in subclass
    }

    /**
     * Called during draw for background rendering.
     * Override to draw background images behind world objects.
     */
    protected OnDrawBackground(renderer: Canvas2DRenderer): void {
        // Override in subclass
    }

    /**
     * Called during draw for game-specific world rendering.
     * Override to add custom world drawing (ghost previews, etc).
     */
    protected OnDrawWorld(renderer: Canvas2DRenderer): void {
        // Override in subclass
    }

    /**
     * Called during draw for game-specific UI rendering.
     * Override to add custom UI drawing.
     */
    protected OnDrawUI(renderer: Canvas2DRenderer): void {
        // Override in subclass
    }

    /**
     * Register a world object with the drawable manager.
     */
    public AddWorldObject(obj: any): void {
        this.worldObjects.Add(obj);
    }

    /**
     * Remove a world object from the drawable manager.
     */
    public RemoveWorldObject(obj: any): void {
        this.worldObjects.Remove(obj);
    }

    /**
     * Register a UI object with the drawable manager.
     */
    public AddUIObject(obj: any): void {
        this.uiObjects.Add(obj);
    }

    /**
     * Remove a UI object from the drawable manager.
     */
    public RemoveUIObject(obj: any): void {
        this.uiObjects.Remove(obj);
    }

    /**
     * Mark drawable managers as needing re-sort.
     */
    public MarkUnsorted(): void {
        this.worldObjects.Unsorted = true;
        this.uiObjects.Unsorted = true;
    }
}
