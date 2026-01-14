import { Renderer } from "./renderer";

/**
 * Renderer implementation using HTML5 Canvas 2D context.
 */
export class Canvas2DRenderer implements Renderer {
    context: CanvasRenderingContext2D;
    width: number;
    height: number;

    constructor(context: CanvasRenderingContext2D, width: number, height: number) {
        this.context = context;
        this.width = width;
        this.height = height;
    }

    /**
     * Draws an image to the canvas.
     */
    DrawImage(image: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width?: number, height?: number, sx?: number, sy?: number, sWidth?: number, sHeight?: number): void {
        if (sx !== undefined && sy !== undefined && sWidth !== undefined && sHeight !== undefined) {
            this.context.drawImage(image, sx, sy, sWidth, sHeight, x, y, width!, height!);
        } else if (width !== undefined && height !== undefined) {
            this.context.drawImage(image, x, y, width, height);
        } else {
            this.context.drawImage(image, x, y);
        }
    }

    /**
     * Fills a rectangle with a color.
     */
    FillRect(x: number, y: number, width: number, height: number, color: string): void {
        if (color) {
            this.context.fillStyle = color;
        }
        this.context.fillRect(x, y, width, height);
    }

    /**
     * Clears the canvas.
     */
    Clear(color?: string): void {
        if (color) {
            this.context.fillStyle = color;
            this.context.fillRect(0, 0, this.width, this.height);
        } else {
            this.context.clearRect(0, 0, this.width, this.height);
        }
    }

    Save(): void {
        this.context.save();
    }

    Restore(): void {
        this.context.restore();
    }

    /**
     * Scales the current context.
     */
    Scale(x: number, y: number): void {
        this.context.scale(x, y);
    }

    /**
     * Translates the current context.
     */
    Translate(x: number, y: number): void {
        this.context.translate(x, y);
    }

    BeginPath(): void {
        this.context.beginPath();
    }

    MoveTo(x: number, y: number): void {
        this.context.moveTo(x, y);
    }

    LineTo(x: number, y: number): void {
        this.context.lineTo(x, y);
    }

    ClosePath(): void {
        this.context.closePath();
    }

    Fill(): void {
        this.context.fill();
    }

    SetFillStyle(color: string): void {
        this.context.fillStyle = color;
    }
}
