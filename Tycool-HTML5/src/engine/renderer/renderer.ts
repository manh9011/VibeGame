/**
 * Interface for all renderer implementations.
 */
export interface Renderer {
    DrawImage(image: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width?: number, height?: number, sx?: number, sy?: number, sWidth?: number, sHeight?: number): void;
    width: number;
    height: number;
    FillRect(x: number, y: number, width: number, height: number, color?: string): void;
    Clear(color?: string): void;
    Save(): void;
    Restore(): void;
    Scale(x: number, y: number): void;
    Translate(x: number, y: number): void;
    BeginPath(): void;
    MoveTo(x: number, y: number): void;
    LineTo(x: number, y: number): void;
    ClosePath(): void;
    Fill(): void;

    // Text
    DrawText(text: string, x: number, y: number): void;
    MeasureText(text: string): TextMetrics;
    SetFont(font: string): void;
    SetTextAlign(align: CanvasTextAlign): void;
    SetTextBaseline(baseline: CanvasTextBaseline): void;

    // Path & Shapes
    StrokeRect(x: number, y: number, width: number, height: number): void;
    RoundRect(x: number, y: number, width: number, height: number, radius: number | number[]): void;
    QuadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    Arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    Stroke(): void;

    // Styling
    SetLineWidth(width: number): void;
    SetStrokeStyle(style: string | CanvasGradient | CanvasPattern): void;
    SetLineJoin(join: CanvasLineJoin): void;
    SetGlobalAlpha(alpha: number): void;
    CreateLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;

    // Updates
    // Utils
    ClipRect(x: number, y: number, width: number, height: number): void;
    SetFillStyle(style: string | CanvasGradient | CanvasPattern): void;
    flush?(): void;
}
