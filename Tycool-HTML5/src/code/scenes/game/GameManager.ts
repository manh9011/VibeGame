import { GameObject } from '@/engine/object/gameObject';
import { CloudClient } from '@/code/CloudClient';
import { Tree } from '@/code/scenes/game/entity/Tree';
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
    buildings: { x: number, y: number, type: string, level: number, upgradeEndTime?: number }[];
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

        // Sync and Update Buildings
        this.scene.buildings.forEach(b => {
            const obj = this.scene.objectMap[b.y][b.x];
            if (obj && obj instanceof Building) {
                // Sync data from Object to Scene Data (for saving)
                b.level = obj.level;
                b.upgradeEndTime = obj.upgradeEndTime;
            }

            const def = BUILDINGS_DB[b.type];
            const level = b.level || 1;
            const data = def.levels[level - 1];

            if (def.type === 'resource' && data.resource) this.AddResource(data.resource as any, data.amount || 0);
            if (def.type === 'economy' && data.income) this.AddResource('gold', data.income);
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

        // Check Limit
        if (building.maxCount) {
            const currentCount = this.scene.buildings.filter(b => b.type === buildingId).length;
            if (currentCount >= building.maxCount) {
                this.onNotify(`Đã đạt giới hạn ${building.name} (${currentCount}/${building.maxCount})`, "error");
                return false;
            }
        }

        const level1 = building.levels[0];

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

        if (this.SpendResource(level1.cost)) {
            // Occupy all tiles
            for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                    this.scene.map[y + dy][x + dx].building = buildingId;
                }
            }

            // Create Object (Shared reference)
            const bObj = new Building(x, y, buildingId, 1);
            for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                    if (!this.scene.objectMap[y + dy]) this.scene.objectMap[y + dy] = [];
                    this.scene.objectMap[y + dy][x + dx] = bObj;
                }
            }

            this.scene.buildings.push({ x, y, type: buildingId, level: 1 });

            if (level1.fame) this.scene.resources.fame += level1.fame;
            if (level1.capacity) this.scene.resources.pop += level1.capacity;

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
                const obj = this.scene.objectMap[y][x];
                if (obj instanceof Tree) {
                    obj.StartChopping(info.time / 1000);
                    this.onNotify("Bắt đầu chặt cây...", "info");
                }
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

        // Find building entry to get level
        const size = buildingDef.size || 1;
        const bEntry = this.scene.buildings.find(b => b.x <= x && b.x + size > x && b.y <= y && b.y + size > y);
        let level = 1;
        let originX = x;
        let originY = y;

        if (bEntry) {
            level = bEntry.level || 1;
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

    public UpgradeBuilding(x: number, y: number): boolean {
        const obj = this.scene.objectMap[y][x];
        if (!obj || !(obj instanceof Building)) return false;

        if (!obj.CanUpgrade()) {
            this.onNotify("Không thể nâng cấp (Max level hoặc đang nâng)!", "error");
            return false;
        }

        const nextData = obj.NextLevelData;
        if (!nextData) return false;

        if (this.SpendResource(nextData.cost)) {
            obj.StartUpgrade();
            this.onNotify(`Bắt đầu nâng cấp lên cấp ${obj.level + 1}`, "success");
            this.needsSync = true;
            return true;
        } else {
            this.onNotify("Không đủ tài nguyên!", "error");
            return false;
        }
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
        if (this.scene.heroes.length >= 30) {
            this.onNotify("Đã đạt giới hạn 30 Hero!", "error");
            return;
        }
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
                    const level = b.level || 1;
                    const bObj = new Building(b.x, b.y, b.type, level);
                    if (b.upgradeEndTime) {
                        bObj.upgradeEndTime = b.upgradeEndTime;
                        // Recalculate duration if needed? Building.StartUpgrade sets it.
                        // But here we might just need it for the bar.
                        // Ideally we should save duration too or look it up.
                        // Building.ts: upgradeDuration is used for progress bar.
                        // We can look up next level data to get duration.
                        const nextData = bObj.NextLevelData;
                        if (nextData) bObj.upgradeDuration = nextData.upgradeTime;
                    }
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
