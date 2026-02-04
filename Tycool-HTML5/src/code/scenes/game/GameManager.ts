import { GameObject } from '@/engine/object/gameObject';
import { CloudClient } from '@/code/CloudClient';
import { Tree as Tree } from '@/code/scenes/game/entity/Tree';
import { Landfill } from '@/code/scenes/game/entity/Landfill';
import { Building } from '@/code/scenes/game/entity/Building';
import { Tile } from '@/code/scenes/game/entity/Tile';
import { Hero } from '@/code/scenes/game/entity/Hero';
import { Villager } from '@/code/scenes/game/entity/Villager';
import { CONFIG, BUILDINGS_DB, QUESTS_DB, HERO_CLASSES, Cost, HeroRecruitData } from '@/code/Options';

export interface ActiveQuest {
    heroId: number;
    questId: number;
    endTime: number;
}

export interface GameSceneData {
    resources: { gold: number, wood: number, stone: number, fame: number, pop: number };
    time: { day: number, tick: number };
    map: Tile[][];
    // New: Map Objects layer
    objectMap: (GameObject | null)[][];
    buildings: { x: number, y: number, type: string }[];
    heroes: Hero[];
    villagers: Villager[];
    activeQuests: ActiveQuest[];
    market: { woodPrice: number, stonePrice: number, trend: number };
    selection: { mode: string | null, buildingId: string | null };
    stats: { visitors: number };
}

export class GameManager extends GameObject {
    public scene: GameSceneData;
    public recruitList: HeroRecruitData[] = [];
    private interval: ReturnType<typeof setInterval> | null = null;
    public cloud: CloudClient;

    // Callbacks for UI updates (to keep decoupled)
    public onNotify: (msg: string, type: 'info' | 'error' | 'success') => void = () => { };
    public needsSync: boolean = false;


    constructor() {
        super(0, 0);
        this.cloud = new CloudClient();

        this.scene = {
            resources: { gold: 500, wood: 100, stone: 50, fame: 0, pop: 0 },
            time: { day: 1, tick: 0 },
            map: [],
            objectMap: [],
            buildings: [],
            heroes: [],
            villagers: [],
            activeQuests: [],
            market: { woodPrice: 10, stonePrice: 20, trend: 0 },
            selection: { mode: null, buildingId: null },
            stats: { visitors: 0 }
        };
    }

    public Init(isLoaded = false) {
        if (!isLoaded) this.initMap();
        this.updateMarketPrices(); // Just to set initial prices if needed, though they are in scene

        // Start Auto-Save (every 5 seconds)
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.cloud.save(true);
        }, 5000);
    }

    /**
     * Reset the entire game state and start fresh.
     */
    public Reset() {
        // Clear saved data
        localStorage.removeItem('gameState');

        // Reset scene to initial values
        this.scene = {
            resources: { gold: 500, wood: 100, stone: 50, fame: 0, pop: 0 },
            time: { day: 1, tick: 0 },
            map: [],
            objectMap: [],
            buildings: [],
            heroes: [],
            villagers: [],
            activeQuests: [],
            market: { woodPrice: 10, stonePrice: 20, trend: 0 },
            selection: { mode: null, buildingId: null },
            stats: { visitors: 0 }
        };

        // Reinitialize the map with fresh tiles and trees
        this.initMap();

        // Trigger UI sync
        this.needsSync = true;
        this.onNotify("🔄 Đã reset game! Bắt đầu lại từ đầu.", "success");
    }

    private initMap() {
        this.scene.map = [];
        this.scene.objectMap = [];
        for (let y = 0; y < CONFIG.mapSize; y++) {
            let row: Tile[] = [];
            let objRow: (GameObject | null)[] = [];
            for (let x = 0; x < CONFIG.mapSize; x++) {
                let tileType = Math.random() > 0.9 ? 1 : 0;
                if (Math.random() > 0.98) tileType = 2;
                row.push(new Tile(x, y, tileType));

                if (tileType === 1) {
                    objRow.push(new Tree(x, y));
                } else {
                    objRow.push(null);
                }
            }
            this.scene.map.push(row);
            this.scene.objectMap.push(objRow);
        }
    }

    public Tick() {
        this.scene.time.tick++;
        if (this.scene.time.tick >= CONFIG.dayLength) {
            this.scene.time.day++;
            this.scene.time.tick = 0;
            this.DailyReset();
        }

        this.scene.buildings.forEach(b => {
            const data = BUILDINGS_DB[b.type];
            if (data.type === 'resource' && data.resource) this.AddResource(data.resource as any, data.amount || 0);
            if (data.type === 'economy' && data.income) this.AddResource('gold', data.income);
        });

        this.UpdateQuests();
        this.scene.stats.visitors = Math.floor(this.scene.resources.fame / 5) + this.scene.buildings.filter(b => b.type === 'house').length * 2;

        // Sync villagers count
        while (this.scene.villagers.length < this.scene.stats.visitors) {
            this.scene.villagers.push(new Villager(this.scene.villagers.length));
        }
        while (this.scene.villagers.length > this.scene.stats.visitors) {
            this.scene.villagers.pop();
        }
    }

    // Logic updates moved to individual object Update methods
    // Character and environment objects are managed by the DrawableManager in the current scene.

    public DailyReset() {
        this.FluctuateMarket();
        this.onNotify(`Ngày thứ ${this.scene.time.day} bắt đầu!`, "info");
        this.GenerateRecruits();

        // Respawn trees
        if (Math.random() > 0.5) {
            const x = Math.floor(Math.random() * CONFIG.mapSize);
            const y = Math.floor(Math.random() * CONFIG.mapSize);
            if (this.scene.map[y][x].type === 0 && !this.scene.map[y][x].building) {
                this.scene.map[y][x].type = 1;
                this.scene.objectMap[y][x] = new Tree(x, y);
            }
        }
    }

    // ... Resources ...
    public AddResource(type: keyof GameSceneData['resources'], amount: number) {
        this.scene.resources[type] += amount;
    }

    public SpendResource(cost: Cost): boolean {
        if (this.scene.resources.gold < (cost.gold || 0)) return false;
        if (this.scene.resources.wood < (cost.wood || 0)) return false;
        if (this.scene.resources.stone < (cost.stone || 0)) return false;

        this.scene.resources.gold -= (cost.gold || 0);
        this.scene.resources.wood -= (cost.wood || 0);
        this.scene.resources.stone -= (cost.stone || 0);
        return true;
    }

    // ... Build/Harvest ...
    public Build(x: number, y: number, buildingId: string) {
        const tile = this.scene.map[y][x];
        if (tile.building) {
            this.onNotify("Đã có công trình ở đây!", "error");
            return;
        }
        if (tile.type === 2) {
            this.onNotify("Không thể xây trên nước!", "error");
            return false;
        }
        if (tile.type === 1) {
            this.onNotify("Cần dọn cây trước khi xây!", "error");
            return false;
        }

        const building = BUILDINGS_DB[buildingId];
        const size = building.size || 1;

        // Validation for all tiles
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (x + dx >= CONFIG.mapSize || y + dy >= CONFIG.mapSize) {
                    this.onNotify("Không thể xây ngoài bản đồ!", "error");
                    return false;
                }
                const t = this.scene.map[y + dy][x + dx];
                if (t.building || t.type === 2) {
                    this.onNotify("Vị trí không hợp lệ!", "error");
                    return false;
                }
                if (t.type === 1) {
                    this.onNotify("Cần dọn cây trước khi xây!", "error");
                    return false;
                }
            }
        }

        if (this.SpendResource(building.cost)) {
            // Occupy all tiles
            for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                    this.scene.map[y + dy][x + dx].building = buildingId;
                    // Only create one building object at origin (or reference? for now just null/reference logic if needed)
                    // But our objectMap logic expects objects.
                    // Option: Create ONE building object at (x,y), other cells have reference or null?
                    // Previous logic: tile.building = id. objectMap has Building object.

                    // Let's put the Building object only at the top-left coordinate in objectMap
                    // The other cells in objectMap can be null (since tile.building denotes occupation)
                    // Or we can put references. For now, let's just put the main building at x,y.
                }
            }
            // this.scene.buildings.push({ x, y, type: buildingId }); -> This is fine, listing unique buildings

            // Add to Object Map (Only at origin)
            if (!this.scene.objectMap[y]) this.scene.objectMap[y] = [];
            this.scene.objectMap[y][x] = new Building(x, y, buildingId);

            // Allow clicking other parts? 
            // HandleClick in GameScene checks tile.building. If tile.building exists but objectMap is null (for parts),
            // we need to find the origin. 
            // Actually, simple solution: Store a reference or special "Part" object?
            // Or just search? Searching is slow.
            // Let's store the SAME Building instance in all cells?
            // Yes, sharing the reference is cleaner for interaction.
            const bObj = new Building(x, y, buildingId);
            for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                    if (!this.scene.objectMap[y + dy]) this.scene.objectMap[y + dy] = [];
                    this.scene.objectMap[y + dy][x + dx] = bObj;
                }
            }

            this.scene.buildings.push({ x, y, type: buildingId });

            if (building.fame) this.scene.resources.fame += building.fame;
            if (buildingId === 'house') this.scene.resources.pop += (building.capacity || 0);
            this.onNotify(`Đã xây dựng ${building.name}`, "success");
            this.needsSync = true;
            return true;
        } else {
            this.onNotify("Không đủ tài nguyên!", "error");
            return false;
        }
    }

    public AttemptHarvest(x: number, y: number): { type: 'tree' | 'water', title: string, desc: string, cost: number, time: number } | null {
        const tile = this.scene.map[y][x];
        const obj = this.scene.objectMap[y][x];

        // Tree
        if (tile.type === 1 && obj instanceof Tree && !obj.chopping) {
            return {
                type: 'tree',
                title: "Chặt Cây",
                desc: `Cần 10 Gold và 3s?\n(Nhận ~10 Gỗ)`,
                cost: 10,
                time: 3000
            };
        }

        // Water
        if (tile.type === 2 && !obj) {
            return {
                type: 'water',
                title: "Lấp Hồ",
                desc: `Cần 50 Gold và 5s?\n(Biến thành đất)`,
                cost: 50,
                time: 5000
            };
        }

        return null;
    }

    public StartHarvest(x: number, y: number) {
        const info = this.AttemptHarvest(x, y);
        if (!info) return;

        if (this.SpendResource({ gold: info.cost })) {
            if (info.type === 'tree') {
                const obj = this.scene.objectMap[y][x] as Tree;
                obj.chopping = true;
                obj.maxChopTime = info.time / 1000; // Store as seconds?
                // Wait, previous logic used seconds in some places.
                // ObjTree: chopTime is number. 
                // Let's stick to using seconds for internal update
                obj.chopTime = info.time / 1000;
                obj.maxChopTime = info.time / 1000;
                this.onNotify("Bắt đầu chặt cây...", "info");
            } else if (info.type === 'water') {
                // Spawn Landfill
                const timeSec = info.time / 1000;
                this.scene.objectMap[y][x] = new Landfill(x, y, timeSec);
                this.onNotify("Bắt đầu lấp hồ...", "info");
            }
            this.needsSync = true;
        } else {
            this.onNotify("Thiếu vàng!", "error");
        }
    }

    // Work logic (Chopping/Landfill) moved to individual object Update methods

    public FinishHarvest(x: number, y: number, type: 'tree' | 'water') {
        const tile = this.scene.map[y][x];

        if (type === 'tree') {
            tile.type = 0; // Grass
            this.scene.objectMap[y][x] = null;
            this.AddResource('wood', 10);
            this.onNotify("Đã chặt xong! +10 gỗ", "success");
            this.needsSync = true;
        } else if (type === 'water') {
            tile.type = 0; // Grass
            this.scene.objectMap[y][x] = null;
            this.onNotify("Đã lấp hồ xong!", "success");
            this.needsSync = true;
        }
    }

    public RemoveBuilding(x: number, y: number) {
        const tile = this.scene.map[y][x];
        if (!tile.building) return;

        const buildingId = tile.building;
        const buildingDef = BUILDINGS_DB[buildingId];

        // Refund 50%
        if (buildingDef.cost.gold) this.AddResource('gold', Math.floor(buildingDef.cost.gold * 0.5));
        if (buildingDef.cost.wood) this.AddResource('wood', Math.floor(buildingDef.cost.wood * 0.5));
        if (buildingDef.cost.stone) this.AddResource('stone', Math.floor(buildingDef.cost.stone * 0.5));

        // Remove fame/pop effects
        if (buildingDef.fame) this.scene.resources.fame = Math.max(0, this.scene.resources.fame - buildingDef.fame);
        if (buildingId === 'house') this.scene.resources.pop = Math.max(0, this.scene.resources.pop - (buildingDef.capacity || 0));

        // Clear Scene
        // Clear Scene covering all tiles
        const size = buildingDef.size || 1;
        // Find origin if current x,y is not origin? 
        // We assume RemoveBuilding is called with x,y passed from somewhere.
        // If it's called with arbitrary tile, we need to find origin.
        // But buildings list stores origin.
        const bEntry = this.scene.buildings.find(b => b.x <= x && b.x + size > x && b.y <= y && b.y + size > y);
        let originX = x;
        let originY = y;

        if (bEntry) {
            originX = bEntry.x;
            originY = bEntry.y;
        }

        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (this.scene.map[originY + dy] && this.scene.map[originY + dy][originX + dx]) {
                    this.scene.map[originY + dy][originX + dx].building = null;
                    this.scene.objectMap[originY + dy][originX + dx] = null;
                }
            }
        }
        tile.building = null; // Just to be safe for the passed tile logic if loop missed it (shouldn't)
        const bIndex = this.scene.buildings.findIndex(b => b.x === x && b.y === y);
        if (bIndex !== -1) this.scene.buildings.splice(bIndex, 1);

        this.onNotify(`Đã bán ${buildingDef.name}`, "info");
        this.needsSync = true;
    }

    public MoveBuilding(oldX: number, oldY: number, newX: number, newY: number): boolean {
        // Validation
        if (newX < 0 || newX >= CONFIG.mapSize || newY < 0 || newY >= CONFIG.mapSize) return false;

        const targetTile = this.scene.map[newY][newX];
        if (targetTile.building || targetTile.type === 2) {
            this.onNotify("Vị trí không hợp lệ!", "error");
            return false;
        }

        const oldTile = this.scene.map[oldY][oldX];
        if (!oldTile.building) return false;

        const buildingId = oldTile.building;
        const obj = this.scene.objectMap[oldY][oldX];

        if (!obj || !(obj instanceof Building)) return false;

        const buildingDef = BUILDINGS_DB[buildingId];
        const size = buildingDef.size || 1;

        // Validation based on size
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                if (newX + dx >= CONFIG.mapSize || newY + dy >= CONFIG.mapSize) return false;

                const t = this.scene.map[newY + dy][newX + dx];
                // Check if occupied. Note: We must allow "self" overlap if we are just shifting?
                // But usually we pick up and place. 
                // If moving to overlapping position, the "old" position is still marked.
                // We should probably check if t.building exists AND it is NOT part of the current building being moved.
                // But simplifying: assume we pick up first?
                // The prompt for logic: if (targetTile.building...)

                // Let's check collision, ignoring our own current footprint
                // Current footprint: oldX to oldX+size, oldY to oldY+size
                const isSelf = (newX + dx >= oldX && newX + dx < oldX + size && newY + dy >= oldY && newY + dy < oldY + size);

                if (!isSelf && (t.building || t.type === 2)) {
                    this.onNotify("Vị trí không hợp lệ!", "error");
                    return false;
                }
            }
        }

        // Execute Move
        // 1. Clear Old Map Tiles
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                this.scene.map[oldY + dy][oldX + dx].building = null;
                this.scene.objectMap[oldY + dy][oldX + dx] = null;
            }
        }

        // 2. Set New
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                this.scene.map[newY + dy][newX + dx].building = buildingId;
                this.scene.objectMap[newY + dy][newX + dx] = obj;
            }
        }

        // 3. Update Object Instance
        obj.SetPosition(newX, newY);

        // 4. Update Buildings List
        const bEntry = this.scene.buildings.find(b => b.x === oldX && b.y === oldY);
        if (bEntry) {
            bEntry.x = newX;
            bEntry.y = newY;
        }

        this.onNotify("Đã di chuyển!", "success");
        this.needsSync = true;
        return true;
    }

    // ... Market ...
    public updateMarketPrices() {
        // Kept for consistency
    }

    public GetPrice(res: 'wood' | 'stone') {
        return res === 'wood' ? this.scene.market.woodPrice : this.scene.market.stonePrice;
    }

    public FluctuateMarket() {
        const supplyFactor = Math.random() > 0.5 ? 1 : -1;
        this.scene.market.trend = supplyFactor;
        this.scene.market.woodPrice = Math.max(5, Math.min(50, this.scene.market.woodPrice + Math.floor(Math.random() * 5 * supplyFactor)));
        this.scene.market.stonePrice = Math.max(10, Math.min(80, this.scene.market.stonePrice + Math.floor(Math.random() * 8 * supplyFactor)));
    }

    public Trade(res: 'wood' | 'stone', action: 'buy' | 'sell') {
        const price = this.GetPrice(res);
        if (action === 'buy') {
            if (this.SpendResource({ gold: price * 10 })) {
                this.AddResource(res, 10);
                if (res === 'wood') this.scene.market.woodPrice++;
                if (res === 'stone') this.scene.market.stonePrice++;
                this.onNotify(`Mua 10 ${res}`, "success");
            } else this.onNotify("Thiếu vàng!", "error");
        } else {
            if (this.scene.resources[res] >= 10) {
                this.scene.resources[res] -= 10;
                this.AddResource('gold', Math.floor(price * 10 * 0.9));
                if (res === 'wood') this.scene.market.woodPrice = Math.max(1, this.scene.market.woodPrice - 1);
                if (res === 'stone') this.scene.market.stonePrice = Math.max(1, this.scene.market.stonePrice - 1);
                this.onNotify(`Bán 10 ${res}`, "success");
            } else this.onNotify(`Thiếu ${res}!`, "error");
        }
    }

    public GenerateRecruits() {
        this.recruitList = [];
        const tavernCount = this.scene.buildings.filter(b => b.type === 'tavern').length;
        if (tavernCount === 0) return;

        for (let i = 0; i < 1 + tavernCount; i++) {
            const type = HERO_CLASSES[Math.floor(Math.random() * HERO_CLASSES.length)];
            this.recruitList.push({
                id: Date.now() + i,
                name: ["Arthur", "Lancelot", "Merlin", "Geralt", "Yennefer", "Zelda", "Link", "Cloud", "Tifa", "Hưng", "Long", "Vân"][Math.floor(Math.random() * 12)],
                class: type.name,
                icon: type.icon,
                level: 1,
                str: type.baseStr + Math.floor(Math.random() * 5),
                int: type.baseInt + Math.floor(Math.random() * 5),
                cost: (type.baseStr + type.baseInt + 10) * 10,
                status: 'idle'
            });
        }
    }

    public Hire(index: number) {
        if (index < 0 || index >= this.recruitList.length) return;
        const recruit = this.recruitList[index];
        if (recruit.cost && this.SpendResource({ gold: recruit.cost })) {
            this.scene.heroes.push(new Hero(recruit));
            this.recruitList.splice(index, 1);
            this.onNotify(`Đã thuê ${recruit.name}!`, "success");
            this.needsSync = true;
        } else {
            this.onNotify("Không đủ tiền!", "error");
        }
    }

    // --- Quests ---
    public StartQuest(heroId: number, questId: number) {
        const hero = this.scene.heroes.find(h => h.id === heroId);
        const quest = QUESTS_DB.find(q => q.id === questId);
        if (!hero || !quest) return;

        if (hero.str < (quest.req.str || 0) && hero.int < (quest.req.int || 0)) {
            this.onNotify("Anh hùng quá yếu!", "error");
            return;
        }
        hero.status = 'questing';
        this.scene.activeQuests.push({
            heroId, questId,
            endTime: this.scene.time.tick + (this.scene.time.day * CONFIG.dayLength) + quest.duration
        });
        this.onNotify(`${hero.name} đã đi làm nhiệm vụ!`, "info");
    }

    public UpdateQuests() {
        const now = this.scene.time.tick + (this.scene.time.day * CONFIG.dayLength);
        for (let i = this.scene.activeQuests.length - 1; i >= 0; i--) {
            if (now >= this.scene.activeQuests[i].endTime) {
                this.CompleteQuest(this.scene.activeQuests[i], i);
            }
        }
    }

    private CompleteQuest(aq: ActiveQuest, index: number) {
        const hero = this.scene.heroes.find(h => h.id === aq.heroId);
        const quest = QUESTS_DB.find(q => q.id === aq.questId);
        if (!hero || !quest) return;

        let risk = quest.risk;
        if (hero.str > (quest.req.str || 0)) risk -= 0.1;
        if (hero.int > (quest.req.int || 0)) risk -= 0.1;

        if (Math.random() > Math.max(0, risk)) {
            if (quest.reward.gold) this.AddResource('gold', quest.reward.gold);
            if (quest.reward.wood) this.AddResource('wood', quest.reward.wood);
            if (quest.reward.stone) this.AddResource('stone', quest.reward.stone);
            if (quest.reward.fame) this.AddResource('fame', quest.reward.fame);
            hero.level++;
            hero.str += Math.random() > 0.5 ? 1 : 0;
            this.onNotify(`${hero.name} hoàn thành NV!`, "success");
        } else {
            this.onNotify(`${hero.name} thất bại NV...`, "error");
        }
        hero.status = 'idle';
        this.scene.activeQuests.splice(index, 1);
    }


    public HydrateScene(loadedScene: any) {
        if (!loadedScene) return;

        // Restore Primitives First
        if (loadedScene.resources) this.scene.resources = loadedScene.resources;
        if (loadedScene.time) this.scene.time = loadedScene.time;
        if (loadedScene.buildings) this.scene.buildings = loadedScene.buildings;
        if (loadedScene.activeQuests) this.scene.activeQuests = loadedScene.activeQuests;
        if (loadedScene.market) this.scene.market = loadedScene.market;
        if (loadedScene.stats) this.scene.stats = loadedScene.stats;

        // Restore Map (ObjTile)
        if (loadedScene.map) {
            this.scene.map = loadedScene.map.map((row: any[], y: number) =>
                row.map((tileData: any, x: number) => {
                    const tile = new Tile(x, y, tileData.type);
                    tile.building = tileData.building;
                    return tile;
                })
            );

            // Rebuild ObjectMap from loaded map/buildings
            this.scene.objectMap = [];
            for (let y = 0; y < CONFIG.mapSize; y++) {
                let row: (GameObject | null)[] = [];
                for (let x = 0; x < CONFIG.mapSize; x++) {
                    row.push(null);
                }
                this.scene.objectMap.push(row);
            }

            // First pass: Trees and single tile logic (if any)
            for (let y = 0; y < CONFIG.mapSize; y++) {
                for (let x = 0; x < CONFIG.mapSize; x++) {
                    const tile = this.scene.map[y][x];
                    if (tile.type === 1) {
                        this.scene.objectMap[y][x] = new Tree(x, y);
                    }
                }
            }

            // Second pass: Buildings from scene.buildings list (authoritative)
            if (this.scene.buildings) {
                this.scene.buildings.forEach(b => {
                    const bObj = new Building(b.x, b.y, b.type);
                    const def = BUILDINGS_DB[b.type];
                    const size = def ? (def.size || 1) : 1;

                    for (let dy = 0; dy < size; dy++) {
                        for (let dx = 0; dx < size; dx++) {
                            if (b.y + dy < CONFIG.mapSize && b.x + dx < CONFIG.mapSize) {
                                this.scene.objectMap[b.y + dy][b.x + dx] = bObj;
                            }
                        }
                    }
                });
            }
        }

        // Restore Heroes (ObjHero)
        if (loadedScene.heroes) {
            this.scene.heroes = loadedScene.heroes.map((hData: any) => new Hero(hData));
        }

        // Restore Villagers (ObjVillager)
        if (loadedScene.villagers) {
            this.scene.villagers = loadedScene.villagers.map((vData: any, idx: number) => new Villager(idx));
        }

        this.onNotify("Dữ liệu đã được tải lại!", "success");
        this.needsSync = true;
    }
}

export const instance = new GameManager();
