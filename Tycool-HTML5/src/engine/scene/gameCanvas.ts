import { Canvas2DRenderer } from '@/engine/renderer/canvas2dRenderer';
import { WebGLRenderer } from '@/engine/renderer/webglRenderer';
import { Renderer } from '@/engine/renderer/renderer';
import { MouseInput } from '@/engine/input/mouseInput';

/**
 * Manages the HTML Canvas element and rendering context.
 */
export class GameCanvas {
    Canvas: HTMLCanvasElement | null;
    Context2D: CanvasRenderingContext2D | null;
    BackBuffer: HTMLCanvasElement | null;
    BackBufferContext2D: CanvasRenderingContext2D | null;
    Renderer!: Renderer;

    constructor() {
        this.Canvas = null;
        this.Context2D = null;
        this.BackBuffer = null;
        this.BackBufferContext2D = null;
    }

    /**
     * Initializes the canvas and renderer.
     * @param canvasId The ID of the canvas element.
     * @param resWidth Resolution width.
     * @param resHeight Resolution height.
     * @param renderMode Rendering mode ('webgl' or '2d').
     */
    Initialize(canvasId: string, resWidth: number, resHeight: number, renderMode: string): void {
        this.Canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.Canvas.width = resWidth;
        this.Canvas.height = resHeight;
        MouseInput.Initialize(this.Canvas);
        this.Context2D = this.Canvas.getContext("2d");
        this.configureContext(this.Context2D!);

        this.BackBuffer = document.createElement("canvas");
        this.BackBuffer.width = resWidth;
        this.BackBuffer.height = resHeight;

        if (renderMode === 'webgl') {
            try {
                this.Renderer = new WebGLRenderer(this.BackBuffer, resWidth, resHeight);
            } catch (e) {
                console.warn("WebGL failed, falling back to Canvas2D", e);
                // Recreate the canvas in case it was partially initialized with WebGL
                this.BackBuffer = document.createElement("canvas");
                this.BackBuffer.width = resWidth;
                this.BackBuffer.height = resHeight;

                this.BackBufferContext2D = this.BackBuffer.getContext("2d");
                this.configureContext(this.BackBufferContext2D!);
                this.Renderer = new Canvas2DRenderer(this.BackBufferContext2D!, resWidth, resHeight);
            }
        } else {
            this.BackBufferContext2D = this.BackBuffer.getContext("2d");
            this.configureContext(this.BackBufferContext2D!);
            this.Renderer = new Canvas2DRenderer(this.BackBufferContext2D!, resWidth, resHeight);
        }
    }

    /**
     * Configures the 2D context for pixel art rendering.
     */
    configureContext(ctx: CanvasRenderingContext2D): void {
        // @ts-ignore
        ctx.imageSmoothingEnabled = false;
        // @ts-ignore
        ctx.webkitImageSmoothingEnabled = false;
        // @ts-ignore
        ctx.mozImageSmoothingEnabled = false;
        // @ts-ignore
        ctx.msImageSmoothingEnabled = false;
    }

    /**
     * Prepares the canvas for drawing (clears buffers).
     */
    BeginDraw(): void {
        if (this.BackBufferContext2D) {
            this.BackBufferContext2D.clearRect(0, 0, this.BackBuffer!.width, this.BackBuffer!.height);
        } else {
            this.Renderer.Clear();
        }
        this.Context2D!.clearRect(0, 0, this.Canvas!.width, this.Canvas!.height);
    }

    /**
     * Finalizes drawing (flushes backbuffer to canvas).
     */
    EndDraw(): void {
        this.Context2D!.drawImage(this.BackBuffer!, 0, 0, this.BackBuffer!.width, this.BackBuffer!.height, 0, 0, this.Canvas!.width, this.Canvas!.height);
    }
}
