import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { ProgressBar } from "@/code/objects/ProgressBar";
import { SPRITE_CONFIG, SPRITE_MAP } from "@/code/Options";
import { AssetLoader } from "@/code/AssetLoader";

export class Tree extends GameObject {
    public isHarvested: boolean = false;
    public chopping: boolean = false;
    public chopTime: number = 0;
    public maxChopTime: number = 0;

    private progressBar: ProgressBar;

    constructor(x: number, y: number) {
        super(x, y);
        this.Layer = 1; // Object layer
        this.zOrderOffset = 0.3; // Trees draw above tiles
        this.UpdateZOrder();

        this.progressBar = new ProgressBar(x, y);
        this.progressBar.yOffset = -50;
    }

    public Update(delta: number): void {
        super.Update(delta);
        if (this.chopping) {
            this.chopTime -= delta;
            this.progressBar.progress = 1 - (this.chopTime / this.maxChopTime);

            if (this.chopTime <= 0) {
                this.chopping = false;
                this.progressBar.progress = 0;
                const game = (window as any).game;
                if (game) game.FinishHarvest(this.x, this.y, 'tree');
            }
        }
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (!this.visible) return;

        const zoom = camera.zoom;
        const isoPos = camera.GridToScreen(this.x + 0.5, this.y + 0.5);
        const drawX = Math.floor(isoPos.x);
        const drawY = Math.floor(isoPos.y);

        // Shake if chopping
        let offX = 0;
        if (this.chopping) {
            offX = (Math.random() - 0.5) * 4;
        }

        // Draw Tree Sprite
        const img = AssetLoader.GetImage('entities');
        if (img) {
            const cellSize = SPRITE_CONFIG.cellSize;
            // Use a stable random index based on coordinates
            const treeIndices = SPRITE_MAP.tree;
            const spriteIndex = treeIndices[(this.x + this.y) % treeIndices.length];

            const sx = (spriteIndex % SPRITE_CONFIG.gridSize) * cellSize;
            const sy = Math.floor(spriteIndex / SPRITE_CONFIG.gridSize) * cellSize;

            const scale = 1.0 * zoom;
            const drawW = cellSize * scale;
            const drawH = cellSize * scale;

            renderer.DrawImage(img,
                drawX - drawW / 2 + offX,
                drawY - drawH / 4 * 3,
                drawW, drawH,
                sx, sy, cellSize, cellSize
            );
        }

        // Draw Progress Bar if chopping
        if (this.chopping) {
            this.progressBar.Draw(renderer, camera);
        }
    }
}
