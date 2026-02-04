import { GameObject } from '@/engine/object/gameObject';
import { Renderer } from '@/engine/renderer/renderer';
import { Camera } from '@/engine/scene/camera';
import { Canvas2DRenderer } from '@/engine/renderer/canvas2dRenderer';
import { CONFIG, FONTS, SPRITE_CONFIG, SPRITE_MAP } from '@/code/Options';
import { instance as game } from '@/code/scenes/game/GameManager';
import { AssetLoader } from '@/code/AssetLoader';

export class Hero extends GameObject {
    public id: number;
    public name: string;
    public class: string;
    public icon: string;
    public level: number;
    public str: number;
    public int: number;
    public status: 'idle' | 'questing' = 'idle';

    public gridX: number = 0;
    public gridY: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private moveSpeed: number = 0.05;

    constructor(data: any) {
        super(0, 0);
        this.id = data.id;
        this.name = data.name;
        this.class = data.class;
        this.icon = data.icon;
        this.level = data.level;
        this.str = data.str;
        this.int = data.int;
        this.status = data.status || 'idle';

        this.gridX = Math.floor(Math.random() * CONFIG.mapSize);
        this.gridY = Math.floor(Math.random() * CONFIG.mapSize);
        this.SetTarget();

        this.Layer = 1; // Object layer
        this.zOrderOffset = 0.6; // Characters in front of buildings
        this.UpdateZOrder();
    }

    public Update(delta: number): void {
        if (this.status === 'questing') return;

        const dx = this.targetX - this.gridX;
        const dy = this.targetY - this.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.1) {
            this.SetTarget();
        } else {
            const moveDist = this.moveSpeed * delta;
            if (moveDist >= dist) {
                this.gridX = this.targetX;
                this.gridY = this.targetY;
                this.SetTarget();
            } else {
                this.gridX += (dx / dist) * moveDist;
                this.gridY += (dy / dist) * moveDist;
            }
        }

        // Update Position and ZOrder
        this.x = Math.floor(this.gridX);
        this.y = Math.floor(this.gridY);
        this.UpdateZOrder();
    }

    private SetTarget() {
        if (this.status === 'questing') return;

        const taverns = game.scene.buildings.filter((b: any) => b.type === 'tavern');

        if (taverns.length > 0) {
            const tavern = taverns[Math.floor(Math.random() * taverns.length)];
            let tx, ty;
            let tries = 0;
            do {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 5;
                tx = Math.floor(tavern.x + Math.cos(angle) * dist);
                ty = Math.floor(tavern.y + Math.sin(angle) * dist);
                tries++;
            } while ((tx < 0 || tx >= CONFIG.mapSize || ty < 0 || ty >= CONFIG.mapSize) && tries < 10);

            this.targetX = Math.max(0, Math.min(CONFIG.mapSize - 1, tx));
            this.targetY = Math.max(0, Math.min(CONFIG.mapSize - 1, ty));
        } else {
            this.targetX = Math.floor(Math.random() * CONFIG.mapSize);
            this.targetY = Math.floor(Math.random() * CONFIG.mapSize);
        }
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (this.status === 'questing') return;

        const screenPos = camera.GridToScreen(this.gridX + 0.5, this.gridY + 0.5);
        const zoom = camera.zoom;

        const img = AssetLoader.GetImage('entities');
        if (img) {
            const cellSize = SPRITE_CONFIG.cellSize;
            const spriteIndex = SPRITE_MAP.hero;
            const sx = (spriteIndex % SPRITE_CONFIG.gridSize) * cellSize;
            const sy = Math.floor(spriteIndex / SPRITE_CONFIG.gridSize) * cellSize;
            const scale = 0.8 * zoom;
            const drawW = cellSize * scale;
            const drawH = cellSize * scale;

            renderer.DrawImage(img,
                screenPos.x - drawW / 2,
                screenPos.y - drawH / 4 * 3,
                drawW, drawH,
                sx, sy, cellSize, cellSize
            );
        } else {
            renderer.SetFont(`${Math.floor(20 * zoom)}px ${FONTS.emoji}`);
            renderer.SetTextAlign("center");
            renderer.SetTextBaseline("bottom");
            renderer.SetFillStyle("white");
            renderer.DrawText(this.icon, screenPos.x, screenPos.y);
        }
    }
}
