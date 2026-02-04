import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { BUILDINGS_DB, FONTS, CONFIG, SPRITE_CONFIG } from "@/code/Options";
import { AssetLoader } from "@/code/AssetLoader";

export class Building extends GameObject {
    public type: string;
    public data: any;
    public moving: boolean = false;

    constructor(x: number, y: number, type: string) {
        super(x, y);
        this.type = type;
        this.data = BUILDINGS_DB[type];
        this.Layer = 1; // Object layer
        // Buildings render slightly above tiles at same position
        this.zOrderOffset = 0.5;

        // For multi-tile buildings, calculate ZOrder based on bottom-most point
        const size = this.data.size || 1;
        this.UpdateZOrderForSize(size);
    }

    private UpdateZOrderForSize(size: number) {
        // We use the bottom-right corner of the building for sorting
        const sortX = this.x + size - 1;
        const sortY = this.y + size - 1;
        const mapSize = CONFIG.mapSize;
        this.ZOrder = ((sortX + sortY) * mapSize + sortX) + this.zOrderOffset;
    }

    public override SetPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        const size = this.data?.size || 1;
        this.UpdateZOrderForSize(size);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (!this.visible) return;
        if (!this.data) return;

        const size = this.data.size || 1;
        const isoPos = camera.GridToScreen(this.x, this.y);
        const dims = camera.GetTileDimensions();
        const w = dims.width * size;
        const h = dims.height * size;

        // Bounce Effect
        const bounce = this.moving ? Math.abs(Math.sin(Date.now() / 150)) * 10 : 0;


        // Draw Icon at the center of the building footprint
        const centerPos = camera.GridToScreen(this.x + size / 2, this.y + size / 2);

        const img = AssetLoader.GetImage('entities');
        const spriteIndex = this.data.spriteIndex;

        if (spriteIndex !== undefined && img) {
            const cellSize = SPRITE_CONFIG.cellSize;
            const sx = (spriteIndex % SPRITE_CONFIG.gridSize) * cellSize;
            const sy = Math.floor(spriteIndex / SPRITE_CONFIG.gridSize) * cellSize;

            // Scaled size of the sprite to fit isometric footprint
            const scale = size * camera.zoom;
            const drawW = cellSize * scale;
            const drawH = cellSize * scale;

            // Align bottom-center of sprite to geometric center of tile
            renderer.DrawImage(img,
                centerPos.x - drawW / 2,
                centerPos.y - drawH / 4 * 3 - bounce,
                drawW, drawH,
                sx, sy, cellSize, cellSize
            );
        } else {
            // Fallback to Emoji
            const fontSize = Math.floor((size === 1 ? 36 : 42) * camera.zoom);
            renderer.SetFont(`${fontSize}px ${FONTS.emoji}`);
            renderer.SetTextAlign("center");
            renderer.SetTextBaseline("bottom");
            renderer.SetFillStyle("white");

            const drawY = centerPos.y - bounce;
            renderer.DrawText(this.data.icon, centerPos.x, Math.floor(drawY));
        }
    }
}
