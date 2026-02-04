import { Renderer } from "@/engine/renderer/renderer";

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
    FillRect(x: number, y: number, width: number, height: number, color?: string): void {
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

    SetFillStyle(color: string | CanvasGradient | CanvasPattern): void {
        this.context.fillStyle = color;
    }
    // --- Text Rendering ---

    /**
     * Draws filled text.
     */
    DrawText(text: string, x: number, y: number): void {
        this.context.fillText(text, x, y);
    }

    /**
     * Measures text width.
     */
    MeasureText(text: string): TextMetrics {
        return this.context.measureText(text);
    }

    SetFont(font: string): void {
        this.context.font = font;
    }

    SetTextAlign(align: CanvasTextAlign): void {
        this.context.textAlign = align;
    }

    SetTextBaseline(baseline: CanvasTextBaseline): void {
        this.context.textBaseline = baseline;
    }

    // --- Path & Shapes ---

    StrokeRect(x: number, y: number, width: number, height: number): void {
        this.context.strokeRect(x, y, width, height);
    }

    QuadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.context.quadraticCurveTo(cpx, cpy, x, y);
    }

    Arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.context.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }

    Stroke(): void {
        this.context.stroke();
    }

    // --- Styling ---

    SetLineWidth(width: number): void {
        this.context.lineWidth = width;
    }

    SetStrokeStyle(style: string | CanvasGradient | CanvasPattern): void {
        this.context.strokeStyle = style;
    }

    SetLineJoin(join: CanvasLineJoin): void {
        this.context.lineJoin = join;
    }

    SetGlobalAlpha(alpha: number): void {
        this.context.globalAlpha = alpha;
    }

    // --- Transform ---

    SetTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        this.context.setTransform(a, b, c, d, e, f);
    }

    // --- New Interface Methods ---

    RoundRect(x: number, y: number, width: number, height: number, radius: number | number[]): void {
        if (typeof this.context.roundRect === 'function') {
            this.context.roundRect(x, y, width, height, radius);
        } else {
            // Fallback for older browsers if needed, though most modern ones support it.
            // Simplified fallback if radius is number
            if (typeof radius === 'number') {
                this.context.moveTo(x + radius, y);
                this.context.lineTo(x + width - radius, y);
                this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
                this.context.lineTo(x + width, y + height - radius);
                this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                this.context.lineTo(x + radius, y + height);
                this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
                this.context.lineTo(x, y + radius);
                this.context.quadraticCurveTo(x, y, x + radius, y);
            }
        }
    }

    CreateLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
        return this.context.createLinearGradient(x0, y0, x1, y1);
    }

    ClipRect(x: number, y: number, width: number, height: number): void {
        this.context.beginPath();
        this.context.rect(x, y, width, height);
        this.context.clip();
    }


}
