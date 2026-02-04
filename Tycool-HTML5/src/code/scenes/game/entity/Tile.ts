import { GameObject } from '@/engine/object/gameObject';
import { Renderer } from '@/engine/renderer/renderer';
import { Camera } from '@/engine/scene/camera';
import { COLORS } from '@/code/Options';

export class Tile extends GameObject {
    public type: number; // 0: ground, 1: tree(ground), 2: water
    public building: string | null = null;
    public gridX: number;
    public gridY: number;
    public isHighlighted: boolean = false;

    constructor(x: number, y: number, type: number) {
        super(x, y);
        this.gridX = x;
        this.gridY = y;
        this.type = type;
        this.Layer = 0; // Ground layer
        // Set ZOrder based on grid position (back-to-front)
        this.UpdateZOrder();
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        let top = COLORS.grass.top;
        let side = COLORS.grass.right;
        let height = 10;

        if (this.type === 2) { // Water
            top = COLORS.water.top;
            side = COLORS.water.right;
            height = 5;
        }

        const pos = camera.GridToScreen(this.gridX, this.gridY);
        const dims = camera.GetTileDimensions();
        const { width: w, height: h } = dims;

        renderer.SetFillStyle(top);
        renderer.BeginPath();
        renderer.MoveTo(pos.x, pos.y);
        renderer.LineTo(pos.x + w / 2, pos.y + h / 2);
        renderer.LineTo(pos.x, pos.y + h);
        renderer.LineTo(pos.x - w / 2, pos.y + h / 2);
        renderer.ClosePath();
        renderer.Fill();

        // Stroke for grid lines or highlighting
        if (this.isHighlighted) {
            renderer.SetStrokeStyle(COLORS.highlight.border);
            renderer.SetLineWidth(2);
            renderer.Stroke();
        } else {
            renderer.SetStrokeStyle("rgba(0,0,0,0.1)");
            renderer.SetLineWidth(0.5);
            renderer.Stroke();
        }
    }
}
