import { GameObject } from '@/engine/object/gameObject';
import { Renderer } from '@/engine/renderer/renderer';
import { Camera } from '@/engine/scene/camera';
import { Canvas2DRenderer } from '@/engine/renderer/canvas2dRenderer';
import { CONFIG, VILLAGER_ICONS, FONTS, SPRITE_CONFIG, SPRITE_MAP } from '@/code/Options';
import { instance as game } from '@/code/scenes/game/GameManager';
import { AssetLoader } from '@/code/AssetLoader';

export class Villager extends GameObject {
    public icon: string;
    public gridX: number;
    public gridY: number;

    private scene: 'IDLE' | 'MOVING' | 'WORKING' = 'IDLE';
    private sceneTimer: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private moveSpeed: number = 2.0;

    private effectTimer: number = 0;
    private workEffectTrigger: boolean = false;
    private workType: string = 'wood';

    constructor(id: number) {
        super(0, 0);
        this.icon = VILLAGER_ICONS[id % VILLAGER_ICONS.length];
        this.gridX = Math.floor(Math.random() * CONFIG.mapSize);
        this.gridY = Math.floor(Math.random() * CONFIG.mapSize);
        this.SetSceneIDLE();
        this.Layer = 1; // Object layer
        this.zOrderOffset = 0.6; // Characters in front of buildings
        this.UpdateZOrder();
    }

    private SetSceneIDLE() {
        this.scene = 'IDLE';
        this.sceneTimer = 1 + Math.random() * 3;
    }

    private SetSceneMOVING(x: number, y: number) {
        this.scene = 'MOVING';
        this.targetX = x;
        this.targetY = y;
    }

    private SetSceneWORKING(type: string = 'wood') {
        this.scene = 'WORKING';
        this.sceneTimer = 3 + Math.random() * 5;
        this.workType = type;
        this.effectTimer = 0.5;
    }

    public Update(delta: number): void {
        if (this.scene === 'IDLE') {
            this.sceneTimer -= delta;
            if (this.sceneTimer <= 0) {
                this.DecideNextAction();
            }
        } else if (this.scene === 'MOVING') {
            const dx = this.targetX - this.gridX;
            const dy = this.targetY - this.gridY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.1) {
                this.gridX = this.targetX;
                this.gridY = this.targetY;
                const obj = game.scene.objectMap[this.targetY] ? game.scene.objectMap[this.targetY][this.targetX] : null;

                if (obj && obj.constructor.name === 'ObjTree') {
                    this.SetSceneWORKING('wood');
                } else if (obj && obj.constructor.name === 'ObjBuilding' && (obj as any).data?.id === 'quarry') {
                    this.SetSceneWORKING('stone');
                } else {
                    this.SetSceneIDLE();
                }
            } else {
                const moveDist = this.moveSpeed * delta;
                this.gridX += (dx / dist) * moveDist;
                this.gridY += (dy / dist) * moveDist;
            }
        } else if (this.scene === 'WORKING') {
            this.sceneTimer -= delta;
            this.effectTimer -= delta;

            if (this.effectTimer <= 0) {
                this.effectTimer = 1.5;
                this.workEffectTrigger = true;
            }

            if (this.sceneTimer <= 0) {
                this.SetSceneIDLE();
            }
        }

        // Update Position and ZOrder
        this.x = Math.floor(this.gridX);
        this.y = Math.floor(this.gridY);
        this.UpdateZOrder();
    }

    /**
     * Check if a cell is blocked (has building, tree, or water)
     */
    private IsCellBlocked(tx: number, ty: number): boolean {
        if (tx < 0 || tx >= CONFIG.mapSize || ty < 0 || ty >= CONFIG.mapSize) return true;

        // Check objectMap for trees/environment
        const obj = game.scene.objectMap[ty]?.[tx];
        if (obj) return true;

        // Check buildings
        for (const b of game.scene.buildings) {
            const size = b.type === 'house' || b.type === 'decoration' ? 1 : 2;
            if (tx >= b.x && tx < b.x + size && ty >= b.y && ty < b.y + size) {
                return true;
            }
        }

        return false;
    }

    private DecideNextAction() {
        if (Math.random() < 0.4) {
            let nearest: { x: number, y: number, dist: number } | null = null;
            for (let i = 0; i < 10; i++) {
                const tx = Math.floor(Math.random() * CONFIG.mapSize);
                const ty = Math.floor(Math.random() * CONFIG.mapSize);
                const obj = game.scene.objectMap[ty][tx];
                let isValidTarget = false;
                if (obj) {
                    if (obj.constructor.name === 'ObjTree') isValidTarget = true;
                    else if (obj.constructor.name === 'ObjBuilding' && (obj as any).data?.id === 'quarry') isValidTarget = true;
                }

                if (isValidTarget) {
                    const d = Math.abs(tx - this.gridX) + Math.abs(ty - this.gridY);
                    if (!nearest || d < nearest.dist) {
                        nearest = { x: tx, y: ty, dist: d };
                    }
                }
            }

            if (nearest) {
                this.SetSceneMOVING(nearest.x, nearest.y);
                return;
            }
        }

        // Random wander - find an empty cell
        for (let attempts = 0; attempts < 20; attempts++) {
            const tx = Math.max(0, Math.min(CONFIG.mapSize - 1, Math.floor(this.gridX + (Math.random() - 0.5) * 10)));
            const ty = Math.max(0, Math.min(CONFIG.mapSize - 1, Math.floor(this.gridY + (Math.random() - 0.5) * 10)));

            if (!this.IsCellBlocked(tx, ty)) {
                this.SetSceneMOVING(tx, ty);
                return;
            }
        }

        // If no valid cell found, just stay idle longer
        this.SetSceneIDLE();
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (this.gridX < 0 || this.gridX >= CONFIG.mapSize || this.gridY < 0 || this.gridY >= CONFIG.mapSize) return;

        const screenPos = camera.GridToScreen(this.gridX + 0.5, this.gridY + 0.5);
        const zoom = camera.zoom;

        if (this.workEffectTrigger) {
            this.workEffectTrigger = false;
            const ui = (window as any).ui;
            if (ui) {
                const fxX = screenPos.x;
                const fxY = screenPos.y - (20 * zoom);
                const icon = this.workType === 'wood' ? 'gỗ' : 'đá';
                ui.FloatText(`+1 ${icon}`, fxX, fxY);
            }
        }

        let bounce = 0;
        if (this.scene === 'WORKING') {
            bounce = Math.abs(Math.sin(Date.now() / 150)) * 5 * zoom;
        } else if (this.scene === 'MOVING') {
            bounce = Math.abs(Math.sin(Date.now() / 100)) * 2 * zoom;
        }

        const img = AssetLoader.GetImage('entities');
        if (img) {
            const cellSize = SPRITE_CONFIG.cellSize;
            const villagerIndices = SPRITE_MAP.villager;
            const spriteIndex = villagerIndices[1]; // Person sprite
            const sx = (spriteIndex % SPRITE_CONFIG.gridSize) * cellSize;
            const sy = Math.floor(spriteIndex / SPRITE_CONFIG.gridSize) * cellSize;
            const scale = 0.7 * zoom;
            const drawW = cellSize * scale;
            const drawH = cellSize * scale;

            renderer.DrawImage(img,
                screenPos.x - drawW / 2,
                screenPos.y - drawH - bounce,
                drawW, drawH,
                sx, sy, cellSize, cellSize
            );
        } else {
            renderer.SetFont(`${Math.floor(20 * zoom)}px ${FONTS.emoji}`);
            renderer.SetTextAlign("center");
            renderer.SetTextBaseline("bottom");
            renderer.SetFillStyle("white");
            renderer.DrawText(this.icon, screenPos.x, screenPos.y - bounce);
        }
    }
}
