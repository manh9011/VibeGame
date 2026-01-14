/**
 * Interface for all renderer implementations.
 */
export interface Renderer {
    DrawImage(image: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width?: number, height?: number, sx?: number, sy?: number, sWidth?: number, sHeight?: number): void;
    FillRect(x: number, y: number, width: number, height: number, color: string): void;
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
    SetFillStyle(color: string): void;
    flush?(): void;
}
