import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { Button } from "@/code/objects/Button";
import { Label } from "@/code/objects/Label";
import { FONTS, SPRITE_CONFIG } from "@/code/Options";
import { AssetLoader } from "@/code/AssetLoader";
import { instance as game } from "@/code/scenes/game/GameManager";

export class BuildItem extends GameObject {
    public width: number = 130;
    public height: number = 110;

    private btn: Button;
    // private costLbl: ObjLabel; // Removed, drawing manually
    private buildingData: any;

    constructor(buildingData: any, onClick: () => void) {
        super(0, 0);
        this.buildingData = buildingData;

        // Button background only
        this.btn = new Button(0, 0, 130, 110, "", "");
        this.btn.onClick = onClick;
    }

    private CanAfford(): boolean {
        const cost = this.buildingData.levels[0].cost;
        const res = game.scene.resources;

        if (cost.gold && res.gold < cost.gold) return false;
        if (cost.wood && res.wood < cost.wood) return false;
        if (cost.stone && res.stone < cost.stone) return false;

        return true;
    }

    public Update(delta: number): void {
        this.btn.x = this.x;
        this.btn.y = this.y;
        this.btn.disabled = !this.CanAfford();
        this.btn.Update(delta);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        this.btn.Draw(renderer, camera);

        // 1. Large Icon (Sprite or Emoji)
        const img = AssetLoader.GetImage('entities');
        const levelData = this.buildingData.levels[0];
        const spriteIndex = levelData.spriteIndex;

        if (spriteIndex !== undefined && img) {
            const cellSize = SPRITE_CONFIG.cellSize;
            const sx = (spriteIndex % SPRITE_CONFIG.gridSize) * cellSize;
            const sy = Math.floor(spriteIndex / SPRITE_CONFIG.gridSize) * cellSize;

            // Scaled size for UI slot
            const drawSize = 48;
            renderer.DrawImage(img,
                this.x + (this.width - drawSize) / 2,
                this.y + 15,
                drawSize, drawSize,
                sx, sy, cellSize, cellSize
            );
        } else {
            renderer.SetFont(`40px ${FONTS.emoji}`);
            renderer.SetTextAlign("center");
            renderer.SetTextBaseline("middle");
            renderer.SetFillStyle("white");
            // Fallback to name first char if no sprite (icon removed)
            renderer.DrawText(this.buildingData.name.substring(0, 1), this.x + this.width / 2, this.y + 40);
        }

        // 2. Name
        renderer.SetFont(`bold 14px ${FONTS.ui}`);
        renderer.SetFillStyle("#facc15");
        renderer.DrawText(this.buildingData.name, this.x + this.width / 2, this.y + 75);

        // 3. Detailed Cost
        const cost = levelData.cost;
        const costs: string[] = [];
        if (cost.gold) costs.push(`$${cost.gold}`);
        if (cost.wood) costs.push(`🪵${cost.wood}`);
        if (cost.stone) costs.push(`🪨${cost.stone}`);
        const costStr = costs.join(' ');

        renderer.SetFont(`11px ${FONTS.ui}`);
        renderer.SetFillStyle("#ffffff"); // White text for cost
        renderer.SetTextAlign("left");
        renderer.DrawText(costStr, this.x + 8, this.y + 98);
    }
}
