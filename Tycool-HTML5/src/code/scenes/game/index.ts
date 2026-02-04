import { GameScene } from '@/engine/scene/gameScene';
import { Renderer } from '@/engine/renderer/renderer';
import { Canvas2DRenderer } from '@/engine/renderer/canvas2dRenderer';
import { MouseInput } from '@/engine/input/mouseInput';
import { instance as game } from '@/code/scenes/game/GameManager';
import { CONFIG, BUILDINGS_DB, FONTS, SPRITE_CONFIG, BACKGROUND_CONFIG } from '@/code/Options';
import { UIManager } from '@/code/scenes/game/UIManager';
import { Header } from '@/code/scenes/game/ui/Header';
import { Tooltip } from '@/code/objects/Tooltip';
import { Button } from '@/code/objects/Button';
import { ConfirmDialog } from '@/code/objects/ConfirmDialog';
import { Building } from '@/code/scenes/game/entity/Building';
import { AssetLoader } from '@/code/AssetLoader';

export class SceneGame extends GameScene {
    private ui!: UIManager;
    private tooltip!: Tooltip;
    private header!: Header;
    private btnCancelBuild!: Button;
    private btnCancelMove!: Button;
    private wasMouseDown: boolean = false;

    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private mouseGridX: number = -1;
    private mouseGridY: number = -1;

    private selectedBuilding: { x: number, y: number } | null = null;
    private guiButtons: Button[] = [];
    private activeDialog: ConfirmDialog | null = null;
    private isMovingBuilding: boolean = false;

    // Harvest action button (replaces dialog)
    private pendingHarvest: { x: number, y: number, info: { type: 'tree' | 'water', title: string, desc: string, cost: number, time: number } } | null = null;
    private btnHarvest: Button | null = null;
    private btnCancelHarvest: Button | null = null;

    private timeAccumulator: number = 0;

    constructor() {
        super();
    }

    public Enter(): void {
        super.Enter();

        AssetLoader.LoadImage('entities', SPRITE_CONFIG.path);
        AssetLoader.LoadImage('background', '/images/background.jpg');

        // Apply config to camera
        this.camera.tileWidth = CONFIG.tileWidth;
        this.camera.tileHeight = CONFIG.tileHeight;
        this.camera.worldWidth = BACKGROUND_CONFIG.width;
        this.camera.worldHeight = BACKGROUND_CONFIG.height;
        this.camera.mapCenterX = BACKGROUND_CONFIG.mapCenterX;
        this.camera.mapCenterY = BACKGROUND_CONFIG.mapCenterY;

        // Center camera initially
        this.camera.Initialize(
            this.camera['screenWidth'] || window.innerWidth, // Fallback if not init yet
            this.camera['screenHeight'] || window.innerHeight
        );

        // Debug Offset Adjustment (Active on all modes for now to fix alignment)
        window.addEventListener('keydown', (e) => {
            // if (!Header.debugOccupied) return; // Enabled temporarily for user fix

            const step = e.shiftKey ? 10 : 1;
            let changed = false;

            if (e.key === 'ArrowUp') { this.camera.mapCenterY -= step; changed = true; }
            if (e.key === 'ArrowDown') { this.camera.mapCenterY += step; changed = true; }
            if (e.key === 'ArrowLeft') { this.camera.mapCenterX -= step; changed = true; }
            if (e.key === 'ArrowRight') { this.camera.mapCenterX += step; changed = true; }

            if (changed) {
                this.ui.Notify(`Offset: ${this.camera.mapCenterX}, ${this.camera.mapCenterY}`, 'info');
                console.log(`NEW OFFSET: mapCenterX: ${this.camera.mapCenterX}, mapCenterY: ${this.camera.mapCenterY}`);
            }
        });

        this.ui = new UIManager();
        this.ui.Init();
        (window as any).ui = this.ui;

        setTimeout(() => {
            this.ui.Notify("Dùng các phím Mũi tên để chỉnh vị trí Map!", "info");
        }, 1000);

        this.tooltip = new Tooltip();
        this.tooltip.SetCamera(this.camera);
        this.header = new Header();

        this.AddUIObject(this.header);
        this.AddUIObject(this.ui);
        this.AddUIObject(this.tooltip);

        // Buttons
        this.btnCancelBuild = new Button(0, 0, 120, 40, "Hủy");
        this.btnCancelBuild.bgColor = "#dc2626";
        this.btnCancelBuild.onClick = () => {
            game.scene.selection.mode = null;
            game.scene.selection.buildingId = null;
            this.ClearSelection();
        };

        this.btnCancelMove = new Button(0, 0, 120, 40, "Hủy");
        this.btnCancelMove.bgColor = "#dc2626";
        this.btnCancelMove.onClick = () => {
            if (this.selectedBuilding) {
                // Determine obj from selectedBuilding coordinates
                // Note: selectedBuilding is {x, y}
                const obj = game.scene.objectMap[this.selectedBuilding.y][this.selectedBuilding.x];
                if (obj instanceof Building) obj.moving = false;
            }
            this.isMovingBuilding = false;
            this.ClearSelection();
        };

        this.guiButtons.push(this.btnCancelBuild);
        this.guiButtons.push(this.btnCancelMove);
    }

    public Update(delta: number): void {
        if (!this.initialized) return;

        // Custom game logic
        this.timeAccumulator += delta;
        if (this.timeAccumulator >= 1.0) {
            game.Tick();
            this.timeAccumulator -= 1.0;
        }

        // Handle Modal Dialog
        if (this.activeDialog) {
            this.activeDialog.Update(delta);
        }

        // Handle Context Menu Buttons (Sell/Move)
        let uiHovered = false;
        this.guiButtons.forEach(b => {
            b.Update(delta);
            if (b.isHovered) uiHovered = true;
        });

        // Handle Cancel Build Button
        if (game.scene.selection.mode === 'build' && this.btnCancelBuild) {
            this.btnCancelBuild.x = (window.innerWidth / 2) - 60;
            this.btnCancelBuild.y = window.innerHeight - 80;
            this.btnCancelBuild.Update(delta);
            if (this.btnCancelBuild.isHovered) uiHovered = true;
        }

        // Handle Cancel Move Button
        if (this.isMovingBuilding && this.btnCancelMove) {
            this.btnCancelMove.x = (window.innerWidth / 2) - 60;
            this.btnCancelMove.y = window.innerHeight - 80;
            this.btnCancelMove.Update(delta);
            if (this.btnCancelMove.isHovered) uiHovered = true;
        }

        // Handle Harvest Buttons
        if (this.pendingHarvest) {
            if (this.btnHarvest) {
                this.btnHarvest.x = (window.innerWidth / 2) - 130;
                this.btnHarvest.y = window.innerHeight - 80;
                this.btnHarvest.Update(delta);
                if (this.btnHarvest.isHovered) uiHovered = true;
            }
            if (this.btnCancelHarvest) {
                this.btnCancelHarvest.x = (window.innerWidth / 2) + 10;
                this.btnCancelHarvest.y = window.innerHeight - 80;
                this.btnCancelHarvest.Update(delta);
                if (this.btnCancelHarvest.isHovered) uiHovered = true;
            }
        }

        // Standard Enjine Update (Updates managers)
        // This updates this.ui, this.header, etc.
        super.Update(delta);

        // Blocking Input Logic
        // If any blocking UI is active, we skip the map input handling below
        if (this.activeDialog || this.ui.HasActivePanel() || uiHovered || this.pendingHarvest) {
            MouseInput.Reset();
            return;
        }

        // Skip if clicking in header area
        if (MouseInput.Y < this.header.height) {
            return;
        }

        // Input & Camera handling
        const domCanvas = document.getElementById('game-canvas');
        if (domCanvas) {
            const rect = domCanvas.getBoundingClientRect();
            const mx = MouseInput.X - rect.left;
            const my = MouseInput.Y - rect.top;

            // Zoom
            if (MouseInput.WheelDelta !== 0) {
                this.camera.ProcessZoom(MouseInput.WheelDelta, mx, my);
            }

            // Pan
            const isLeftDown = MouseInput.IsButtonDown(0);
            if (isLeftDown && !this.wasMouseDown) {
                this.dragStartX = mx;
                this.dragStartY = my;
                this.isDragging = false;
            }

            if (isLeftDown) {
                if (Math.abs(mx - this.dragStartX) > 5 || Math.abs(my - this.dragStartY) > 5) {
                    this.isDragging = true;
                }
                if (this.isDragging) {
                    this.camera.Pan(MouseInput.DeltaX, MouseInput.DeltaY);
                }
            } else {
                this.isDragging = false;
            }

            // Grid Interaction
            const grid = this.camera.ScreenToGrid(mx, my);
            this.mouseGridX = grid.x;
            this.mouseGridY = grid.y;

            // Update tile highlight
            if (grid.x >= 0 && grid.x < CONFIG.mapSize && grid.y >= 0 && grid.y < CONFIG.mapSize) {
                game.scene.map.forEach(row => row.forEach(t => t.isHighlighted = false));
                if (game.scene.map[grid.y] && game.scene.map[grid.y][grid.x]) {
                    game.scene.map[grid.y][grid.x].isHighlighted = true;
                }
            }

            // Tooltip
            if (!this.isMovingBuilding) {
                this.tooltip.UpdateLogic(this.isDragging);
            }

            // Click handling
            if (!isLeftDown && this.wasMouseDown) {
                if (!this.isDragging) {
                    this.HandleClick(mx, my, grid);
                }
            }

            this.wasMouseDown = isLeftDown;
        }

        MouseInput.Reset();
    }

    protected OnInitialize(canvasRenderer: Canvas2DRenderer): void {
        game.Init();
        this.SyncObjects();
    }

    public Draw(renderer: Renderer): void {
        if (this.initialized) {
            // Need to periodically sync objects (if buildings added/removed)
            if (game.needsSync) {
                this.SyncObjects();
                game.needsSync = false;
            }
        }
        super.Draw(renderer);
    }

    /**
     * Synchronize flat DrawableManager list with Game Manager's structured data.
     */
    private SyncObjects() {
        this.worldObjects.Objects = [];

        // Add Tiles
        for (let y = 0; y < CONFIG.mapSize; y++) {
            for (let x = 0; x < CONFIG.mapSize; x++) {
                this.AddWorldObject(game.scene.map[y][x]);
            }
        }

        // Add Buildings/Trees/etc
        for (let y = 0; y < CONFIG.mapSize; y++) {
            for (let x = 0; x < CONFIG.mapSize; x++) {
                const obj = game.scene.objectMap[y][x];
                if (obj) {
                    // Only add if we are at the object's origin
                    if (obj.x === x && obj.y === y) {
                        this.AddWorldObject(obj);
                    }
                }
            }
        }

        // Add Characters
        game.scene.heroes.forEach(h => this.AddWorldObject(h));
        game.scene.villagers.forEach(v => this.AddWorldObject(v));

        this.MarkUnsorted();
    }

    protected OnDrawBackground(ctx: Canvas2DRenderer): void {
        const bgImg = AssetLoader.GetImage('background');
        if (!bgImg) return;

        const zoom = this.camera.zoom;
        const scaledW = this.camera.worldWidth * zoom;
        const scaledH = this.camera.worldHeight * zoom;

        // Calculate where the background's map center should be on screen
        // The map center in background coords is (mapCenterX, mapCenterY)
        // This should align with the camera's origin (baseX + X, baseY + Y)
        const bgCenterX = this.camera.mapCenterX * zoom;
        const bgCenterY = this.camera.mapCenterY * zoom;

        const screenCenterX = this.camera.baseX + this.camera.X;
        const screenCenterY = this.camera.baseY + this.camera.Y;

        const bgX = screenCenterX - bgCenterX;
        const bgY = screenCenterY - bgCenterY;

        ctx.DrawImage(bgImg, bgX, bgY, scaledW, scaledH);
    }

    protected OnDrawWorld(ctx: Canvas2DRenderer): void {
        // Ghost Preview
        if (game.scene.selection.mode === 'build' && game.scene.selection.buildingId) {
            const gx = this.mouseGridX;
            const gy = this.mouseGridY;

            if (gx >= 0 && gx < CONFIG.mapSize && gy >= 0 && gy < CONFIG.mapSize) {
                const bId = game.scene.selection.buildingId;
                const bDef = BUILDINGS_DB[bId];
                if (bDef) {
                    ctx.Save();

                    const size = bDef.size || 1;
                    const pos = this.camera.GridToScreen(gx, gy);
                    const dims = this.camera.GetTileDimensions();
                    const w = dims.width * size;
                    const h = dims.height * size;

                    // Draw placement indicator outline only
                    ctx.SetGlobalAlpha(0.5);
                    ctx.SetStrokeStyle("white");
                    ctx.SetLineWidth(2);
                    ctx.BeginPath();
                    ctx.MoveTo(pos.x, pos.y);
                    ctx.LineTo(pos.x + w / 2, pos.y + h / 2);
                    ctx.LineTo(pos.x, pos.y + h);
                    ctx.LineTo(pos.x - w / 2, pos.y + h / 2);
                    ctx.ClosePath();
                    ctx.Stroke();

                    ctx.SetGlobalAlpha(1.0);

                    // Center icon on the footprint
                    const centerPos = this.camera.GridToScreen(gx + size / 2, gy + size / 2);
                    const fontSize = Math.floor((size === 1 ? 36 : 42) * this.camera.zoom);

                    const img = AssetLoader.GetImage('entities');
                    if (bDef.spriteIndex !== undefined && img) {
                        const cellSize = SPRITE_CONFIG.cellSize;
                        const spriteIndex = bDef.spriteIndex;
                        const sx = (spriteIndex % SPRITE_CONFIG.gridSize) * cellSize;
                        const sy = Math.floor(spriteIndex / SPRITE_CONFIG.gridSize) * cellSize;
                        const scale = (size === 1 ? 0.5 : 0.8) * this.camera.zoom;
                        const drawW = cellSize * scale;
                        const drawH = cellSize * scale;

                        ctx.SetGlobalAlpha(0.8);
                        ctx.DrawImage(img,
                            centerPos.x - drawW / 2,
                            centerPos.y - drawH * 3 / 4,
                            drawW, drawH,
                            sx, sy, cellSize, cellSize
                        );
                        ctx.SetGlobalAlpha(1.0);
                    } else {
                        ctx.SetFont(`${fontSize}px ${FONTS.emoji}`);
                        ctx.SetTextAlign("center");
                        ctx.SetTextBaseline("bottom");
                        ctx.SetFillStyle("white");
                        ctx.DrawText(bDef.icon, Math.floor(centerPos.x), Math.floor(centerPos.y));
                    }

                    ctx.Restore();
                }
            }
        }

        // Debug: Show occupied cells
        if (Header.debugOccupied) {
            const dims = this.camera.GetTileDimensions();
            const w = dims.width;
            const h = dims.height;

            for (let y = 0; y < CONFIG.mapSize; y++) {
                for (let x = 0; x < CONFIG.mapSize; x++) {
                    const tile = game.scene.map[y][x];
                    const obj = game.scene.objectMap[y]?.[x];

                    // Red = has object in objectMap
                    // Yellow = has building ref in tile but no object
                    let color: string | null = null;
                    if (obj) {
                        color = "rgba(255, 0, 0, 0.4)"; // Red for objectMap
                    } else if (tile.building) {
                        color = "rgba(255, 255, 0, 0.5)"; // Yellow for tile.building only
                    }

                    if (color) {
                        const pos = this.camera.GridToScreen(x, y);
                        ctx.SetFillStyle(color);
                        ctx.BeginPath();
                        ctx.MoveTo(pos.x, pos.y);
                        ctx.LineTo(pos.x + w / 2, pos.y + h / 2);
                        ctx.LineTo(pos.x, pos.y + h);
                        ctx.LineTo(pos.x - w / 2, pos.y + h / 2);
                        ctx.ClosePath();
                        ctx.Fill();
                    }
                }
            }
        }
    }

    protected OnDrawUI(ctx: Canvas2DRenderer): void {
        // Cancel Build Button (Static UI)
        if (game.scene.selection.mode === 'build') {
            if (!this.btnCancelBuild) {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight - 80;
                this.btnCancelBuild = new Button(cx - 60, cy, 120, 40, "Hủy Xây", "❌");
                this.btnCancelBuild.bgColor = "#ef4444";
                this.btnCancelBuild.onClick = () => {
                    this.ClearSelection();
                    game.scene.selection.mode = null;
                    game.scene.selection.buildingId = null;
                };
            }
            this.btnCancelBuild.Draw(ctx, this.camera);
        }

        // Cancel Move Button
        if (this.isMovingBuilding) {
            if (!this.btnCancelMove) {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight - 80;
                this.btnCancelMove = new Button(cx - 60, cy, 120, 40, "Hủy Di chuyển", "❌");
                this.btnCancelMove.bgColor = "#ef4444";
                this.btnCancelMove.onClick = () => {
                    if (this.selectedBuilding) {
                        const obj = game.scene.objectMap[this.selectedBuilding.y][this.selectedBuilding.x];
                        if (obj instanceof Building) obj.moving = false;
                    }
                    this.isMovingBuilding = false;
                    this.ClearSelection();
                };
            }
            this.btnCancelMove.Draw(ctx, this.camera);
        }

        // Harvest Action Buttons
        if (this.pendingHarvest) {
            if (this.btnHarvest) this.btnHarvest.Draw(ctx, this.camera);
            if (this.btnCancelHarvest) this.btnCancelHarvest.Draw(ctx, this.camera);
        }

        // Selection Menu (Follows camera but drawn in UI space)
        // Only draw if no blocking UI is active and not currently moving/building
        if (!this.ui.HasActivePanel() && !this.activeDialog && !this.isMovingBuilding && game.scene.selection.mode !== 'build') {
            this.guiButtons.forEach(b => {
                // Buttons calculate their own world->screen internally via SelectBuilding
                // Actually, SelectBuilding calculates position ONCE. 
                // We need to update their position every frame if they are world-attached.
                if (this.selectedBuilding) {
                    const pos = this.camera.GridToScreen(this.selectedBuilding.x, this.selectedBuilding.y);
                    const btnW = 80;
                    const sx = pos.x - btnW / 2;
                    const sy = pos.y - (40 * this.camera.zoom);

                    // Update positions of buttons in list
                    const sellBtn = this.guiButtons.find(btn => btn.label === "Bán");
                    const moveBtn = this.guiButtons.find(btn => btn.label === "Di chuyển");

                    if (sellBtn) { sellBtn.x = sx; sellBtn.y = sy; }
                    if (moveBtn) { moveBtn.x = sx; moveBtn.y = sy - 35; }
                }
                b.Draw(ctx, this.camera);
            });
        }

        // Modal Dialogs
        if (this.activeDialog) {
            this.activeDialog.Draw(ctx, this.camera);
        }
    }

    private HandleClick(mx: number, my: number, grid: { x: number, y: number }) {
        if (grid.x < 0 || grid.x >= CONFIG.mapSize || grid.y < 0 || grid.y >= CONFIG.mapSize) return;

        if (this.isMovingBuilding && this.selectedBuilding) {
            if (game.MoveBuilding(this.selectedBuilding.x, this.selectedBuilding.y, grid.x, grid.y)) {
                const obj = game.scene.objectMap[grid.y][grid.x];
                if (obj instanceof Building) obj.moving = false;
                this.ClearSelection();
                (game as any).needsSync = true;
            }
            return;
        }

        if (game.scene.selection.mode === 'build' && game.scene.selection.buildingId) {
            if (game.Build(grid.x, grid.y, game.scene.selection.buildingId)) {
                this.ClearSelection();
                game.scene.selection.mode = null;
                game.scene.selection.buildingId = null;
                (game as any).needsSync = true;
            }
            return;
        }

        const tile = game.scene.map[grid.y][grid.x];

        const harvestInfo = game.AttemptHarvest(grid.x, grid.y);
        if (harvestInfo) {
            this.ShowHarvestButtons(grid.x, grid.y, harvestInfo);
            return;
        }

        if (tile.building) {
            this.SelectBuilding(grid.x, grid.y);
        } else {
            this.ClearSelection();
        }
    }

    private SelectBuilding(x: number, y: number) {
        this.ClearSelection();

        // Get actual building origin from the object (for multi-tile buildings)
        const obj = game.scene.objectMap[y]?.[x];
        if (obj && obj instanceof Building) {
            // Use the building's actual origin position
            this.selectedBuilding = { x: obj.x, y: obj.y };
        } else {
            this.selectedBuilding = { x, y };
        }

        const pos = this.camera.GridToScreen(x, y);
        const btnW = 80;
        const sx = pos.x - btnW / 2;
        const sy = pos.y - (40 * this.camera.zoom);

        const btnSell = new Button(sx, sy, 80, 30, "Bán");
        btnSell.bgColor = "#ef4444";
        btnSell.onClick = () => this.AskSell();
        this.guiButtons.push(btnSell);

        const btnMove = new Button(sx, sy - 35, 80, 30, "Di chuyển");
        btnMove.bgColor = "#3b82f6";
        btnMove.onClick = () => this.StartMove();
        this.guiButtons.push(btnMove);
    }

    private ClearSelection() {
        if (this.selectedBuilding) {
            const obj = game.scene.objectMap[this.selectedBuilding.y][this.selectedBuilding.x];
            if (obj && obj instanceof Building) obj.moving = false;
        }
        this.selectedBuilding = null;
        this.guiButtons = [];
        this.isMovingBuilding = false;
    }

    private AskSell() {
        if (!this.selectedBuilding) return;
        const bId = game.scene.map[this.selectedBuilding.y][this.selectedBuilding.x].building;
        const name = bId ? BUILDINGS_DB[bId].name : "Nhà";

        this.activeDialog = new ConfirmDialog(
            "Xác nhận bán",
            `Bạn có muốn bán ${name}?`,
            () => {
                if (this.selectedBuilding) {
                    game.RemoveBuilding(this.selectedBuilding.x, this.selectedBuilding.y);
                    this.ClearSelection();
                    (game as any).needsSync = true;
                }
                this.activeDialog = null;
            },
            () => {
                this.activeDialog = null;
            }
        );
    }

    private StartMove() {
        if (!this.selectedBuilding) return;
        this.isMovingBuilding = true;
        this.guiButtons = [];
        this.ui.Notify("Chọn vị trí mới để di chuyển", "info");

        const obj = game.scene.objectMap[this.selectedBuilding.y][this.selectedBuilding.x];
        if (obj && obj instanceof Building) obj.moving = true;
    }

    private ShowHarvestButtons(x: number, y: number, info: { type: 'tree' | 'water', title: string, desc: string, cost: number, time: number }) {
        this.ClearHarvest();
        this.pendingHarvest = { x, y, info };

        const actionLabel = info.type === 'tree' ? '🪓 Chặt cây' : '🪣 Lấy nước';

        this.btnHarvest = new Button(0, 0, 120, 40, actionLabel);
        this.btnHarvest.bgColor = "#16a34a";
        this.btnHarvest.onClick = () => {
            if (this.pendingHarvest) {
                game.StartHarvest(this.pendingHarvest.x, this.pendingHarvest.y);
            }
            this.ClearHarvest();
        };

        this.btnCancelHarvest = new Button(0, 0, 120, 40, "❌ Hủy");
        this.btnCancelHarvest.bgColor = "#dc2626";
        this.btnCancelHarvest.onClick = () => {
            this.ClearHarvest();
        };
    }

    private ClearHarvest() {
        this.pendingHarvest = null;
        this.btnHarvest = null;
        this.btnCancelHarvest = null;
    }
}
