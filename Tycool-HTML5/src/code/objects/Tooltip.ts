import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { CONFIG, BUILDINGS_DB, FONTS } from "@/code/Options";
import { instance as game } from "@/code/scenes/game/GameManager";
import { MouseInput } from "@/engine/input/mouseInput";

export class Tooltip extends GameObject {
    private targetPos: { x: number, y: number } = { x: 0, y: 0 };
    private title: string = '';
    private desc: string = '';
    private isVisible: boolean = false;
    private camera: Camera | null = null;

    constructor() {
        super(0, 0);
        this.Layer = 1; // UI layer
        this.ZOrder = 9999; // Tooltip is always on top
    }

    public SetCamera(camera: Camera) {
        this.camera = camera;
    }

    public Update(delta: number): void { }

    public UpdateLogic(isDragging: boolean) {
        if (isDragging || !this.camera) {
            this.isVisible = false;
            return;
        }

        const domCanvas = document.getElementById('game-canvas');
        if (!domCanvas) return;
        const rect = domCanvas.getBoundingClientRect();

        const mx = MouseInput.X - rect.left;
        const my = MouseInput.Y - rect.top;

        const grid = this.camera.ScreenToGrid(mx, my);

        this.isVisible = false;

        if (grid.x >= 0 && grid.x < CONFIG.mapSize && grid.y >= 0 && grid.y < CONFIG.mapSize) {
            const tile = game.scene.map[grid.y][grid.x];
            if (tile.building) {
                const b = BUILDINGS_DB[tile.building];
                this.title = b.name;

                // Try to find the actual building object to get level info
                const obj = game.scene.objectMap[grid.y][grid.x];
                let desc = "";
                if (obj && (obj as any).CurrentLevelData) {
                    // Assume it's a Building
                    const bObj = obj as any;
                    const data = bObj.CurrentLevelData;
                    desc = data.desc || "";
                    // Optionally show level?
                    this.title = `${b.name} (Lv.${bObj.level})`;
                } else {
                    desc = b.levels[0].desc || "";
                }

                this.desc = desc;
                this.isVisible = true;

                const isoPos = this.camera.GridToScreen(grid.x, grid.y);
                const objectHeight = 30 * this.camera.zoom;

                this.targetPos = {
                    x: isoPos.x,
                    y: isoPos.y - objectHeight - 10
                };

            } else if (tile.type === 1) {
                this.title = "Cây rừng";
                this.desc = "Click để thu hoạch (+5 Gỗ)";
                this.isVisible = true;

                const isoPos = this.camera.GridToScreen(grid.x, grid.y);
                const objectHeight = 10 * this.camera.zoom;

                this.targetPos = {
                    x: isoPos.x,
                    y: isoPos.y - objectHeight - 5
                };
            }
        }
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (!this.isVisible) return;

        const padding = 10;
        const radius = 6;

        renderer.SetFont(`bold 14px ${FONTS.main}`);
        const titleMetrics = renderer.MeasureText(this.title);
        renderer.SetFont(`12px ${FONTS.main}`);
        const descMetrics = renderer.MeasureText(this.desc);

        const width = Math.max(titleMetrics.width, descMetrics.width) + padding * 2;
        const height = (this.desc ? 14 + 18 : 14) + padding * 2;

        let x = this.targetPos.x - width / 2;
        let y = this.targetPos.y - height - 8;

        this.DrawBubble(renderer, x, y, width, height, radius, this.targetPos.x);

        renderer.SetFillStyle("rgba(0, 0, 0, 0.85)");
        renderer.Fill();
        renderer.SetStrokeStyle("rgba(255, 255, 255, 0.4)");
        renderer.SetLineWidth(1);
        renderer.Stroke();

        renderer.SetFillStyle("#fbbf24");
        renderer.SetFont(`bold 14px ${FONTS.main}`);
        renderer.SetTextAlign("left");
        renderer.SetTextBaseline("top");
        renderer.DrawText(this.title, x + padding, y + padding);

        if (this.desc) {
            renderer.SetFillStyle("#d1d5db");
            renderer.SetFont(`12px ${FONTS.main}`);
            renderer.DrawText(this.desc, x + padding, y + padding + 18);
        }
    }

    private DrawBubble(renderer: Renderer, x: number, y: number, w: number, h: number, r: number, arrowX: number) {
        const ah = 8;

        renderer.BeginPath();
        renderer.MoveTo(x + r, y);
        renderer.LineTo(x + w - r, y);
        renderer.QuadraticCurveTo(x + w, y, x + w, y + r);
        renderer.LineTo(x + w, y + h - r);
        renderer.QuadraticCurveTo(x + w, y + h, x + w - r, y + h);

        renderer.LineTo(arrowX + 8, y + h);
        renderer.LineTo(arrowX, y + h + ah);
        renderer.LineTo(arrowX - 8, y + h);

        renderer.LineTo(x + r, y + h);
        renderer.QuadraticCurveTo(x, y + h, x, y + h - r);
        renderer.LineTo(x, y + r);
        renderer.QuadraticCurveTo(x, y, x + r, y);
        renderer.ClosePath();
    }

    public Hide() {
        this.isVisible = false;
    }
}
