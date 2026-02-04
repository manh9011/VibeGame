import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";

/**
 * Reusable Progress Bar object for world entities.
 */
export class ProgressBar extends GameObject {
    public progress: number = 0;
    public color: string = "#eab308";
    public barWidth: number = 40;
    public barHeight: number = 6;
    public yOffset: number = 0; // Vertical offset in pixels

    constructor(x: number, y: number) {
        super(x, y);
        this.visible = true;
        this.Layer = 0; // World layer
        this.zOrderOffset = 1; // On top of the parent object
        this.UpdateZOrder();
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (!this.visible || this.progress <= 0) return;


        const isoPos = camera.GridToScreen(this.x, this.y);
        const zoom = camera.zoom;

        const barW = this.barWidth * zoom;
        const barH = this.barHeight * zoom;
        const px = Math.floor(isoPos.x - barW / 2);
        const py = Math.floor(isoPos.y + (this.yOffset * zoom));

        // Background
        renderer.FillRect(px, py, barW, barH, "rgba(0,0,0,0.5)");

        // Progress Fill
        const fillW = (barW - 2) * Math.max(0, Math.min(1, this.progress));
        if (fillW > 0) {
            renderer.FillRect(px + 1, py + 1, fillW, barH - 2, this.color);
        }
    }

}
