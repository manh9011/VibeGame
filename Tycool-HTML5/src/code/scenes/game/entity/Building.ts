import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { BUILDINGS_DB, FONTS, CONFIG, SPRITE_CONFIG } from "@/code/Options";
import { AssetLoader } from "@/code/AssetLoader";
import { ProgressBar } from "@/code/objects/ProgressBar";

export class Building extends GameObject {
    public type: string;
    public data: any; // Ideally typed as BuildingConfig
    public moving: boolean = false;
    public level: number = 1;
    public upgradeEndTime: number = 0; // 0 means not upgrading
    public upgradeDuration: number = 0; // Total duration for progress calc

    private progressBar: ProgressBar;

    constructor(x: number, y: number, type: string, level: number = 1) {
        super(x, y);
        this.type = type;
        this.level = level;
        this.data = BUILDINGS_DB[type];
        this.Layer = 1; // Object layer
        // Buildings render slightly above tiles at same position
        this.zOrderOffset = 0.5;

        // For multi-tile buildings, calculate ZOrder based on bottom-most point
        const size = this.data.size || 1;
        this.UpdateZOrderForSize(size);

        this.progressBar = new ProgressBar(x, y);
        this.progressBar.yOffset = -60; // Slightly higher than tree
    }

    public get CurrentLevelData() {
        return this.data.levels[this.level - 1];
    }

    public get NextLevelData() {
        return this.data.levels[this.level];
    }

    public CanUpgrade(): boolean {
        return !!this.NextLevelData && this.upgradeEndTime === 0;
    }

    public StartUpgrade() {
        if (!this.CanUpgrade()) return;
        // Cost deduction logic should be in GameManager, checking CanUpgrade first.
        const nextData = this.NextLevelData;
        if (nextData.upgradeTime > 0) {
            this.upgradeDuration = nextData.upgradeTime;
            this.upgradeEndTime = Date.now() / 1000 + nextData.upgradeTime;
        } else {
            this.CompleteUpgrade();
        }
    }

    public CompleteUpgrade() {
        this.level++;
        this.upgradeEndTime = 0;
        this.upgradeDuration = 0;
        // Play effect?
    }

    public Update(dt: number) {
        if (this.upgradeEndTime > 0) {
            const now = Date.now() / 1000;
            if (now >= this.upgradeEndTime) {
                this.CompleteUpgrade();
            } else {
                const remaining = this.upgradeEndTime - now;
                this.progressBar.progress = 1 - (remaining / this.upgradeDuration);
                // Clamp 0-1
                this.progressBar.progress = Math.max(0, Math.min(1, this.progressBar.progress));
            }
        }
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
        // Also update progress bar pos if needed (it uses x,y from constructor? check ProgressBar implementation)
        // ProgressBar usually takes x,y in constructor but might need updating if building moves?
        // Checking Tree.ts, it doesn't align progressBar in Update.
        // Let's assume ProgressBar uses absolute position or we need to update it.
        // If ProgressBar extends GameObject, it has internal x,y.
        // Assuming we need to sync it.
        if (this.progressBar) {
            this.progressBar.x = x;
            this.progressBar.y = y;
        }
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
        const levelData = this.CurrentLevelData;
        const spriteIndex = levelData ? levelData.spriteIndex : undefined;

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
            renderer.DrawText(this.data.name.substring(0, 1), centerPos.x, Math.floor(drawY));
        }

        // Draw Progress Bar if upgrading
        if (this.upgradeEndTime > 0) {
            // Center the progress bar
            // ProgressBar usually draws at its x/y with offset.
            // We need to ensure it's centered on the building.
            // If ProgressBar takes grid coords, it handles GridToScreen internally?
            // Checking Tree.ts: this.progressBar.Draw(renderer, camera);
            // It seems providing grid x,y is enough.
            // Just need to ensure ZOrder is correct (UI on top).
            // But ProgressBar might draw in world space.
            this.progressBar.Draw(renderer, camera);
        }
    }
}
