/**
 * --- TOWER DEFENSE PLAY STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, CLASS_TYPES } from '../context.js';
import { drawGlobalHeader, drawText, drawRect, drawRoundedRect, drawCircle, drawButton, drawBadge, addToast, drawToasts } from '../utils/uiHelpers.js';
import { TowerDefenseStageSelectState } from './TowerDefenseStageSelectState.js';

export var TowerDefenseState = new Enjine.GameState();
TowerDefenseState.level = 1;

const BONUS_MULT = [1, 1.2, 1.3, 1.4];
const TOWER_SHAPES = ["🏚️", "🏠", "🏯", "🏰", "🗼", "🏙️"];
const BOSS_EVERY_LEVELS = 20;
const MAP_PATTERN_COUNT = 50;
const NORMAL_ENEMY_MULT = 10;
const MUTANT_ENEMY_MULT = 100;
const BOSS_ENEMY_MULT = 10000;
const MUTANT_CHANCE = 0.2;
const BOMBER_CHANCE = 0.05;
const FAST_MUTANT_CHANCE = 0.1;
const FAST_MUTANT_SPEED_MULT = 10;
const MUTANT_SCALE = 2.2;
const BOSS_SCALE = MUTANT_SCALE * 2;

const MAP_BASE_PATTERNS = [
    {
        riverX: 10,
        bridgeY: 6,
        points: [
            { x: 0, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 3 }, { x: 8, y: 3 }, { x: 8, y: 6 },
            { x: 10, y: 6 }, { x: 14, y: 6 }, { x: 14, y: 4 }, { x: 18, y: 4 }, { x: 18, y: 6 },
            { x: 19, y: 6 }
        ]
    },
    {
        riverX: 9,
        bridgeY: 5,
        points: [
            { x: 0, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 6 }, { x: 2, y: 6 }, { x: 2, y: 9 },
            { x: 8, y: 9 }, { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 13, y: 5 }, { x: 13, y: 8 },
            { x: 19, y: 8 }, { x: 19, y: 9 }
        ]
    },
    {
        riverX: 11,
        bridgeY: 7,
        points: [
            { x: 0, y: 9 }, { x: 5, y: 9 }, { x: 5, y: 3 }, { x: 9, y: 3 }, { x: 9, y: 7 },
            { x: 11, y: 7 }, { x: 15, y: 7 }, { x: 15, y: 2 }, { x: 19, y: 2 }
        ]
    },
    {
        riverX: 10,
        bridgeY: 4,
        points: [
            { x: 0, y: 4 }, { x: 3, y: 4 }, { x: 3, y: 8 }, { x: 7, y: 8 }, { x: 7, y: 2 },
            { x: 9, y: 2 }, { x: 9, y: 4 }, { x: 10, y: 4 }, { x: 13, y: 4 }, { x: 13, y: 9 },
            { x: 16, y: 9 }, { x: 16, y: 10 }, { x: 19, y: 10 }
        ]
    },
    {
        riverX: 8,
        bridgeY: 6,
        points: [
            { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 4, y: 5 }, { x: 1, y: 5 }, { x: 1, y: 10 },
            { x: 7, y: 10 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 12, y: 6 }, { x: 12, y: 2 },
            { x: 16, y: 2 }, { x: 16, y: 6 }, { x: 19, y: 6 }
        ]
    },
    {
        riverX: 12,
        bridgeY: 3,
        points: [
            { x: 0, y: 10 }, { x: 6, y: 10 }, { x: 6, y: 6 }, { x: 2, y: 6 }, { x: 2, y: 3 },
            { x: 12, y: 3 }, { x: 15, y: 3 }, { x: 15, y: 7 }, { x: 19, y: 7 }, { x: 19, y: 3 }
        ]
    },
    {
        riverX: 9,
        bridgeY: 8,
        points: [
            { x: 0, y: 7 }, { x: 4, y: 7 }, { x: 4, y: 10 }, { x: 8, y: 10 }, { x: 8, y: 8 },
            { x: 9, y: 8 }, { x: 13, y: 8 }, { x: 13, y: 4 }, { x: 19, y: 4 }
        ]
    },
    {
        riverX: 10,
        bridgeY: 2,
        points: [
            { x: 0, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 2 }, { x: 10, y: 2 }, { x: 14, y: 2 },
            { x: 14, y: 6 }, { x: 17, y: 6 }, { x: 17, y: 1 }, { x: 19, y: 1 }
        ]
    },
    {
        riverX: 11,
        bridgeY: 9,
        points: [
            { x: 0, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 9 }, { x: 11, y: 9 }, { x: 15, y: 9 },
            { x: 15, y: 5 }, { x: 19, y: 5 }, { x: 19, y: 9 }
        ]
    },
    {
        riverX: 8,
        bridgeY: 4,
        points: [
            { x: 0, y: 8 }, { x: 3, y: 8 }, { x: 3, y: 4 }, { x: 8, y: 4 }, { x: 12, y: 4 },
            { x: 12, y: 7 }, { x: 16, y: 7 }, { x: 16, y: 4 }, { x: 19, y: 4 }
        ]
    }
];

const MAP_PATTERN_VARIANTS = [
    { flipX: false, flipY: false, reverse: false },
    { flipX: false, flipY: true, reverse: false },
    { flipX: true, flipY: false, reverse: false },
    { flipX: true, flipY: true, reverse: false },
    { flipX: false, flipY: false, reverse: true }
];

const makeRng = (seed) => {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000;
    };
};

const shuffleInPlace = (arr, rng) => {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(rng() * (i + 1));
        let tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
};

TowerDefenseState.Enter = function () {
    this.resetState();
    this.keyHandler = this.handleKeyPress.bind(this);
    window.addEventListener('keydown', this.keyHandler);
};

TowerDefenseState.resetState = function () {
    BackgroundSystem.setTheme(this.level);

    this.ui = { bottomH: 140, topMargin: 50 };
    this.map = this.generateMap();
    this.lastCanvasSize = null;
    this.updateMapLayout();

    this.projectiles = [];
    this.particles = [];
    this.animTime = 0;

    this.enemies = [];
    this.towers = [];
    this.heroes = this.spawnHeroes();

    this.base = {
        x: this.map.baseWorld.x,
        y: this.map.baseWorld.y,
        hp: 3000 + DB.data.baseStats.hpLvl * 500,
        maxHp: 3000 + DB.data.baseStats.hpLvl * 500
    };

    let buffs = DB.getBuffs ? DB.getBuffs() : [];
    this.maxMineral = 300 + DB.data.baseStats.minMaxLvl * 100;
    this.mineral = 0;
    let baseRate = 1 + DB.data.baseStats.minRateLvl * 0.1 + (buffs[2] ? buffs[2] / 100 : 0);
    this.mineralRate = baseRate / 10;

    this.goldEarned = 0;
    this.kills = 0;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.win = false;
    this.timeLeft = this.getLevelTimeLimit();

    this.missileCD = 0;
    this.enemyMissileInterval = this.getEnemyMissileInterval();
    this.enemyMissileCD = this.enemyMissileInterval;
    this.meteorCharges = 1;
    this.meteorActive = false;
    this.meteorTimer = 0;
    this.meteorWaveCount = 0;

    this.selectedHeroId = null;
    this.selectedTowerId = null;
    this.selectedTowerInstance = null;
    this.builtTowerIds = new Set();
    this.sellMode = false;

    this.showStartDialog = true;
    this.tempTowerTeam = [...DB.data.towerTeam];
    this.bonusPacks = { atk: false, spd: false, meteor: false };
    this.bonusBuff = { towerAtk: 1, heroAtk: 1, towerSpd: 1, heroSpd: 1 };
    this.prepSelectedSlot = 0;
    this.prepTowerPage = 0;
    this.damagePopups = [];
    this.hitParticles = [];
    this.trailParticles = [];
    // compute star buff multiplier from saved bonuses (TowerDefense-only bonuses)
    let bonusRows = (DB.data && DB.data.tdStarBonuses) ? DB.data.tdStarBonuses : 0;
    this.tdStarBuff = 1 + (0.05 * bonusRows); // 5% per full 5-star row
    // moving scenery: clouds, birds, butterflies
    this.scenery = { clouds: [], birds: [], butterflies: [] };
    // initialize scenery using current map bounds
    if (this.map && this.map.bounds) {
        let b = this.map.bounds;
        for (let i = 0; i < 6; i++) {
            this.scenery.clouds.push({ x: b.x + Math.random() * (b.w + 400) - 200, y: b.y + Math.random() * (b.h * 0.25) + 10, speed: 10 + Math.random() * 30, size: 30 + Math.random() * 60, alpha: 0.5 + Math.random() * 0.45 });
        }
        const birdIcons = ["🐦", "🦅", "🐧"];
        for (let i = 0; i < 5; i++) {
            this.scenery.birds.push({ x: b.x + Math.random() * b.w, y: b.y + Math.random() * (b.h * 0.5), speed: 60 + Math.random() * 120, dir: Math.random() > 0.5 ? 1 : -1, icon: birdIcons[Math.floor(Math.random() * birdIcons.length)], amp: 6 + Math.random() * 12, phase: Math.random() * Math.PI * 2 });
        }
        for (let i = 0; i < 8; i++) {
            this.scenery.butterflies.push({ x: b.x + Math.random() * b.w, y: b.y + Math.random() * b.h, speed: 30 + Math.random() * 50, phase: Math.random() * Math.PI * 2, amp: 8 + Math.random() * 12, icon: "🦋" });
        }
    }
    // Level-based enemy count (clear waves). Start 10, +3 enemies per 5 levels. Boss added every 20 levels.
    let baseEnemyCount = 10 + Math.floor(Math.max(0, (this.level - 1)) / 5) * 3;
    this.isBossLevel = (this.level % BOSS_EVERY_LEVELS) === 0;
    this.levelTotalEnemies = baseEnemyCount + (this.isBossLevel ? 1 : 0);
    this.spawnedEnemies = 0;
};

TowerDefenseState.getLevelTimeLimit = function () {
    let maxTime = 180 - this.level * 0.1;
    if (maxTime < 60) maxTime = 60;
    return Math.floor(maxTime);
};

TowerDefenseState.generateMap = function () {
    let width = 20;
    let height = 12;
    let grid = Array.from({ length: height }, () => Array(width).fill("grass"));
    let patternIndex = Math.floor(Math.max(0, (this.level - 1)) / BOSS_EVERY_LEVELS);
    let patternId = patternIndex % MAP_PATTERN_COUNT;
    let basePattern = MAP_BASE_PATTERNS[patternId % MAP_BASE_PATTERNS.length];
    let variant = MAP_PATTERN_VARIANTS[Math.floor(patternId / MAP_BASE_PATTERNS.length) % MAP_PATTERN_VARIANTS.length];

    const mapPoint = (p, flipX, flipY) => ({
        x: flipX ? (width - 1 - p.x) : p.x,
        y: flipY ? (height - 1 - p.y) : p.y
    });

    const applyPatternVariant = (base, variantCfg) => {
        let flipX = !!variantCfg.flipX;
        let flipY = !!variantCfg.flipY;
        let points = base.points.map(p => mapPoint(p, flipX, flipY));
        if (variantCfg.reverse) points = points.slice().reverse();
        let riverX = base.riverX;
        let bridgeY = base.bridgeY;
        if (flipX) riverX = width - 1 - riverX;
        if (flipY) bridgeY = height - 1 - bridgeY;
        return {
            points,
            spawn: points[0],
            base: points[points.length - 1],
            riverX,
            bridgeY
        };
    };

    let pattern = applyPatternVariant(basePattern, variant);
    let spawn = pattern.spawn;
    let base = pattern.base;

    // River with a single bridge
    for (let y = 0; y < height; y++) grid[y][pattern.riverX] = "river";
    grid[pattern.bridgeY][pattern.riverX] = "bridge";

    const markPath = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        if (grid[y][x] === "river") return;
        grid[y][x] = "path";
    };

    const markLine = (x1, y1, x2, y2) => {
        if (x1 === x2) {
            let ys = Math.min(y1, y2), ye = Math.max(y1, y2);
            for (let y = ys; y <= ye; y++) markPath(x1, y);
        } else if (y1 === y2) {
            let xs = Math.min(x1, x2), xe = Math.max(x1, x2);
            for (let x = xs; x <= xe; x++) markPath(x, y1);
        }
    };

    // Path layout per pattern (fixed waypoints)
    for (let i = 0; i < pattern.points.length - 1; i++) {
        let a = pattern.points[i];
        let b = pattern.points[i + 1];
        markLine(a.x, a.y, b.x, b.y);
    }

    grid[spawn.y][spawn.x] = "path";
    grid[base.y][base.x] = "path";
    grid[pattern.bridgeY][pattern.riverX] = "bridge";

    const isPathCell = (x, y) => {
        let cell = grid[y][x];
        return cell === "path" || cell === "bridge";
    };

    const gatherTowerSlots = () => {
        let rng = makeRng(7000 + patternId * 131);
        let candidates = [];
        let fallback = [];
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (grid[y][x] !== "grass") continue;
                if ((x === spawn.x && y === spawn.y) || (x === base.x && y === base.y)) continue;
                fallback.push({ x, y });
                let near = isPathCell(x - 1, y) || isPathCell(x + 1, y) || isPathCell(x, y - 1) || isPathCell(x, y + 1);
                if (near) candidates.push({ x, y });
            }
        }
        if (candidates.length < 10) candidates = candidates.concat(fallback);
        shuffleInPlace(candidates, rng);
        return candidates.slice(0, 10);
    };

    let towerSlots = gatherTowerSlots();

    let blocked = new Set();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] !== "grass") blocked.add(`${x},${y}`);
        }
    }
    towerSlots.forEach(s => blocked.add(`${s.x},${s.y}`));
    blocked.add(`${spawn.x},${spawn.y}`);
    blocked.add(`${base.x},${base.y}`);

    const placeRandom = (count) => {
        let out = [];
        let tries = 0;
        while (out.length < count && tries < 500) {
            tries++;
            let x = Math.floor(Math.random() * width);
            let y = Math.floor(Math.random() * height);
            let key = `${x},${y}`;
            if (blocked.has(key)) continue;
            blocked.add(key);
            out.push({ x, y });
        }
        return out;
    };

    let trees = placeRandom(22);
    let rocks = placeRandom(25);
    let mountains = placeRandom(6);
    let bushes = placeRandom(16);
    let flowers = placeRandom(50);
    let grassPatches = placeRandom(60);

    let paths = this.buildPaths(grid, spawn, base);

    return {
        width,
        height,
        grid,
        spawn,
        base,
        towerSlots,
        trees,
        rocks,
        mountains,
        bushes,
        flowers,
        grassPatches,
        paths
    };
};

TowerDefenseState.buildPaths = function (grid, start, end) {
    let paths = [];
    let h = grid.length;
    let w = grid[0].length;

    const isWalkable = (x, y) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return false;
        let cell = grid[y][x];
        return cell === "path" || cell === "bridge";
    };

    const key = (x, y) => `${x},${y}`;
    const visited = new Set();

    const dfs = (x, y, current) => {
        if (x === end.x && y === end.y) {
            paths.push([...current]);
            return;
        }
        let dirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1]
        ];
        for (let d of dirs) {
            let nx = x + d[0], ny = y + d[1];
            if (!isWalkable(nx, ny)) continue;
            let k = key(nx, ny);
            if (visited.has(k)) continue;
            visited.add(k);
            current.push({ x: nx, y: ny });
            dfs(nx, ny, current);
            current.pop();
            visited.delete(k);
        }
    };

    visited.add(key(start.x, start.y));
    dfs(start.x, start.y, [{ x: start.x, y: start.y }]);
    return paths.length > 0 ? paths : [[{ x: start.x, y: start.y }, { x: end.x, y: end.y }]];
};

TowerDefenseState.findNearestPathPoint = function (x, y) {
    if (!this.map || !this.map.pathsWorld) return null;
    let best = null;
    let bestDist = Infinity;
    for (let path of this.map.pathsWorld) {
        for (let i = 0; i < path.length; i++) {
            let p = path[i];
            let d = Math.hypot(p.x - x, p.y - y);
            if (d < bestDist) {
                bestDist = d;
                best = { path, index: i, point: p };
            }
        }
    }
    return best;
};

TowerDefenseState.findNearestPointOnPath = function (path, x, y) {
    if (!path || path.length === 0) return null;
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < path.length; i++) {
        let p = path[i];
        let d = Math.hypot(p.x - x, p.y - y);
        if (d < bestDist) {
            bestDist = d;
            best = { index: i, point: p };
        }
    }
    return best;
};

TowerDefenseState.snapHeroToPath = function (hero) {
    let nearest = this.findNearestPathPoint(hero.x, hero.y);
    if (!nearest) return;
    hero.path = nearest.path;
    hero.pathIndex = nearest.index;
    hero.targetPathIndex = nearest.index;
    hero.x = nearest.point.x;
    hero.y = nearest.point.y;
};

TowerDefenseState.setHeroTargetByClick = function (hero, worldX, worldY) {
    let nearest = this.findNearestPathPoint(worldX, worldY);
    if (!nearest) return;
    if (!hero.path || hero.path !== nearest.path) {
        let snap = this.findNearestPointOnPath(nearest.path, hero.x, hero.y);
        if (snap) {
            hero.path = nearest.path;
            hero.pathIndex = snap.index;
            hero.x = snap.point.x;
            hero.y = snap.point.y;
        }
    }
    hero.targetPathIndex = nearest.index;
};

TowerDefenseState.updateMapLayout = function () {
    let availableW = GAME.Canvas.Width - 20;
    let availableH = GAME.Canvas.Height - this.ui.topMargin - 10;
    let tileSize = Math.floor(Math.min(availableW / this.map.width, availableH / this.map.height));
    if (tileSize < 32) tileSize = 32;

    this.map.tileSize = tileSize;
    this.map.originX = Math.floor((GAME.Canvas.Width - this.map.width * tileSize) / 2);
    this.map.originY = this.ui.topMargin + Math.floor((availableH - this.map.height * tileSize) / 2);

    const toWorld = (p) => ({
        x: this.map.originX + (p.x + 0.5) * tileSize,
        y: this.map.originY + (p.y + 0.5) * tileSize
    });

    this.map.spawnWorld = toWorld(this.map.spawn);
    this.map.baseWorld = toWorld(this.map.base);
    this.map.towerSlotsWorld = this.map.towerSlots.map(p => ({ ...toWorld(p), grid: p }));
    this.map.pathsWorld = this.map.paths.map(path => path.map(p => toWorld(p)));
    this.map.bounds = {
        x: this.map.originX,
        y: this.map.originY,
        w: this.map.width * tileSize,
        h: this.map.height * tileSize
    };

    if (this.base) {
        this.base.x = this.map.baseWorld.x;
        this.base.y = this.map.baseWorld.y;
    }
};

TowerDefenseState.spawnHeroes = function () {
    let heroes = [];
    let base = this.map.baseWorld;
    for (let i = 0; i < 4; i++) {
        let hId = DB.data.team[i];
        if (!hId) continue;
        let hero = DB.data.heroes.find(h => h.id === hId);
        if (!hero) continue;

        let bonusAtk = 0, bonusDef = 0, bonusSpd = 0, bonusAtkSpd = 0;
        if (hero.equipments) {
            Object.values(hero.equipments).forEach(itemId => {
                if (itemId) {
                    let item = DB.data.inventory.find(it => it.id === itemId);
                    if (item) {
                        if (item.mainStat.type === 'atk') bonusAtk += item.mainStat.val;
                        if (item.mainStat.type === 'def') bonusDef += item.mainStat.val;
                        if (item.mainStat.type === 'spd') bonusSpd += item.mainStat.val;
                        if (item.mainStat.type === 'atkSpd') bonusAtkSpd += item.mainStat.val;

                        if (item.subStat.type === 'atk') bonusAtk += item.subStat.val;
                        if (item.subStat.type === 'def') bonusDef += item.subStat.val;
                        if (item.subStat.type === 'spd') bonusSpd += item.subStat.val;
                        if (item.subStat.type === 'atkSpd') bonusAtkSpd += item.subStat.val;
                    }
                }
            });
        }

        let typeInfo = Object.values(CLASS_TYPES).find(t => t.id === hero.type);
        let unit = {
            id: hero.id,
            slotIndex: i,
            team: 0,
            type: hero.type,
            icon: typeInfo ? typeInfo.icon : "🧙",
            isHero: true,
            x: base.x + (i - 1.5) * 12,
            y: base.y + 10,
            hp: hero.hp,
            maxHp: hero.hp,
            atk: (hero.atk + bonusAtk),
            def: hero.def + bonusDef,
            spd: hero.spd + bonusSpd,
            range: hero.range,
            atkSpd: hero.atkSpd + bonusAtkSpd,
            crit: hero.crit,
            eva: hero.eva,
            regen: hero.regen,
            atkType: hero.atkType,
            projType: hero.projType,
            cd: 0,
            dead: false,
            respawnTimer: 0,
            reviveCost: Math.max(80, Math.floor(hero.cost * 1.2)),
            path: null,
            pathIndex: 0,
            targetPathIndex: 0
        };
        heroes.push(unit);
        this.snapHeroToPath(unit);
    }
    return heroes;
};

TowerDefenseState.spawnEnemy = function (opts) {
    let allTypes = Object.values(CLASS_TYPES);
    let availableCount = Math.min(allTypes.length, 5 + Math.floor(this.level / 5));
    let type = allTypes[Math.floor(Math.random() * availableCount)];
    let base = type.baseStats;

    let scale = 1 + Math.pow(this.level, 0.7) / 10;
    // per-level +1% stat increase
    let levelPct = 1 + 0.01 * Math.max(0, this.level - 1);
    let hp = Math.round(base.hp * 0.6 * scale * levelPct);
    let atk = Math.round(base.atk * 0.5 * scale * levelPct);
    let def = Math.round(base.def * 0.5 * scale * levelPct);
    let atkSpd = Math.max(0.5, base.atkSpd) * (1 + this.level * 0.002);

    let moveSpeed = (base.spd + 1) * 8 * (1 + this.level * 0.002);
    let range = type.combat.type === "range" ? 110 : 60;

    let isBoss = !!(opts && opts.isBoss);
    let isMutant = false;
    let isFastMutant = false;
    let isBomber = false;
    if (!isBoss) {
        let roll = Math.random();
        if (roll < BOMBER_CHANCE) {
            isBomber = true;
        } else if (roll < BOMBER_CHANCE + FAST_MUTANT_CHANCE) {
            isFastMutant = true;
            isMutant = true;
        } else if (roll < BOMBER_CHANCE + MUTANT_CHANCE) {
            isMutant = true;
        }
    }
    let statMult = isBoss ? BOSS_ENEMY_MULT : (isMutant ? MUTANT_ENEMY_MULT : NORMAL_ENEMY_MULT);
    hp = Math.round(hp * statMult);
    atk = Math.round(atk * statMult);
    def = Math.round(def * statMult);
    let sizeScale = isBoss ? BOSS_SCALE : (isMutant ? MUTANT_SCALE : 1);
    if (isFastMutant) moveSpeed *= FAST_MUTANT_SPEED_MULT;

    let path = this.map.pathsWorld[Math.floor(Math.random() * this.map.pathsWorld.length)];
    let start = path[0];

    this.enemies.push({
        id: Date.now() + Math.random(),
        team: 1,
        type: type.id,
        icon: type.icon,
        x: start.x,
        y: start.y,
        hp: hp,
        maxHp: hp,
        atk: atk,
        def: def,
        spd: moveSpeed,
        range: range,
        atkSpd: atkSpd,
        scale: sizeScale,
        isMutant: isMutant,
        isFastMutant: isFastMutant,
        isBomber: isBomber,
        isBoss: isBoss,
        cd: 0,
        dead: false,
        path: path,
        pathIndex: 0,
        target: null
    });
};

TowerDefenseState.getSpawnInterval = function () {
    let base = 2.6 - Math.log10(this.level + 1) * 0.7;
    if (base < 0.4) base = 0.4;
    return base;
};

TowerDefenseState.getEnemyMissileInterval = function () {
    let steps = Math.floor(Math.max(0, (this.level - 1)) / BOSS_EVERY_LEVELS);
    let interval = 15 - steps * 3;
    if (interval < 3) interval = 3;
    return interval;
};

TowerDefenseState.Exit = function () {
    if (this.keyHandler) {
        window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
    }
};

TowerDefenseState.handleKeyPress = function (e) {
    if (this.showStartDialog || this.gameOver) return;

    if (['q', 'Q', 'w', 'W', 'b', 'B', 'Escape'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (e.key === 'q' || e.key === 'Q') this.fireBaseMissile();
    if (e.key === 'w' || e.key === 'W') this.fireMeteor();
    if (e.key === 'b' || e.key === 'B') {
        this.sellMode = !this.sellMode;
        if (this.sellMode) this.selectedTowerInstance = null;
    }
    if (e.key === 'Escape') GAME.ChangeState(TowerDefenseStageSelectState);
};

TowerDefenseState.Update = function (dt) {
    this.animTime += dt;
    if (this.showStartDialog || this.gameOver) return;

    // Update moving scenery
    if (this.scenery) {
        let b = this.map.bounds;
        // clouds
        for (let c of this.scenery.clouds) {
            c.x += c.speed * 0.03 * dt; // gentle drift
            if (c.x > b.x + b.w + 220) c.x = b.x - 220 - Math.random() * 120;
            if (c.x < b.x - 260) c.x = b.x + b.w + 260 + Math.random() * 120;
        }
        // birds
        for (let br of this.scenery.birds) {
            br.x += br.speed * 0.02 * br.dir * dt;
            br.y += Math.sin(this.animTime * 6 + br.phase) * (br.amp * 0.02);
            if (br.dir > 0 && br.x > b.x + b.w + 60) { br.x = b.x - 60; br.y = b.y + Math.random() * (b.h * 0.5); }
            if (br.dir < 0 && br.x < b.x - 60) { br.x = b.x + b.w + 60; br.y = b.y + Math.random() * (b.h * 0.5); }
        }
        // butterflies
        for (let bf of this.scenery.butterflies) {
            bf.phase += dt * (1 + Math.random() * 1.5);
            bf.x += Math.cos(bf.phase * 1.2) * (bf.speed * 0.02) * dt;
            bf.y += Math.sin(bf.phase * 1.8) * (bf.amp * 0.02) * dt;
            if (bf.x < b.x - 40) bf.x = b.x + b.w + 40;
            if (bf.x > b.x + b.w + 40) bf.x = b.x - 40;
            if (bf.y < b.y) bf.y = b.y + Math.random() * (b.h * 0.5);
            if (bf.y > b.y + b.h) bf.y = b.y + Math.random() * (b.h * 0.5);
        }
    }

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
        this.endGame(true);
        return;
    }

    if (this.missileCD > 0) {
        this.missileCD -= dt;
        if (this.missileCD < 0) this.missileCD = 0;
    }
    if (this.enemyMissileCD > 0) {
        this.enemyMissileCD -= dt;
        if (this.enemyMissileCD < 0) this.enemyMissileCD = 0;
    } else {
        if (this.fireEnemyMissile()) {
            this.enemyMissileInterval = this.getEnemyMissileInterval();
            this.enemyMissileCD = this.enemyMissileInterval;
        }
    }

    if (this.meteorActive) {
        this.meteorTimer += dt;
        if (this.meteorWaveCount === 0 && this.meteorTimer >= 0) {
            this.spawnMeteorWave();
            this.meteorWaveCount++;
        } else if (this.meteorWaveCount === 1 && this.meteorTimer >= 1.0) {
            this.spawnMeteorWave();
            this.meteorWaveCount++;
        } else if (this.meteorWaveCount === 2 && this.meteorTimer >= 2.0) {
            this.spawnMeteorWave();
            this.meteorWaveCount++;
        }

        if (this.meteorTimer >= 3.0) {
            this.meteorActive = false;
        }
    }

    if (this.mineral < this.maxMineral) {
        this.mineral += this.mineralRate * dt;
        if (this.mineral > this.maxMineral) this.mineral = this.maxMineral;
    }

    if (!this.selectedTowerId) {
        let first = DB.data.towerTeam.find(id => id);
        if (first) this.selectedTowerId = first;
    }

    this.spawnTimer += dt;
    let interval = this.getSpawnInterval();
    if (this.spawnedEnemies < this.levelTotalEnemies && this.spawnTimer >= interval) {
        let isBossSpawn = this.isBossLevel && this.spawnedEnemies === (this.levelTotalEnemies - 1);
        this.spawnEnemy({ isBoss: isBossSpawn });
        this.spawnTimer = 0;
        this.spawnedEnemies++;
    }
    // if all enemies for this level have been spawned and none remain, win the level
    if (this.spawnedEnemies >= this.levelTotalEnemies && this.enemies.length === 0) {
        this.endGame(true);
        return;
    }

    this.heroes.forEach(h => this.updateHero(h, dt));
    this.towers.forEach(t => this.updateTower(t, dt));

    for (let i = this.towers.length - 1; i >= 0; i--) {
        let t = this.towers[i];
        if (t.dead) {
            if (this.selectedTowerInstance === t) this.selectedTowerInstance = null;
            this.builtTowerIds.delete(t.id);
            this.towers.splice(i, 1);
        }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
        let e = this.enemies[i];
        this.updateEnemy(e, dt);
        if (e.dead) this.enemies.splice(i, 1);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        let p = this.projectiles[i];
        if (p.type === 'meteor') {
            p.timer += dt * p.speed;
            if (p.timer >= 1) {
                this.applyAreaDamage(p.targetX, p.targetY, p.radius, p.dmg, p.source);
                this.projectiles.splice(i, 1);
                continue;
            }
            p.x = p.startX + (p.targetX - p.startX) * p.timer;
            p.y = p.startY + (p.targetY - p.startY) * p.timer;
            // spawn smoke trail for meteor (wider, grayer)
            if (this.trailParticles) {
                this.trailParticles.push({
                    x: p.x + (Math.random() - 0.5) * 18,
                    y: p.y + (Math.random() - 0.5) * 12,
                    life: 0.8 + Math.random() * 0.8,
                    vy: -20 - Math.random() * 40,
                    vx: (Math.random() - 0.5) * 40,
                    size: 6 + Math.random() * 8,
                    color: "rgba(180,180,180,0.9)"
                });
            }
            continue;
        }

        if (p.type === 'missile') {
            // If projectile was created with a bezier path, follow it with uniform speed
            if (p.pathType === 'bezier' && p.p0 && p.p1 && p.p2) {
                // compute approximate curve length once (sampled)
                if (!p.curveLen) {
                    let samples = 30;
                    let prev = { x: p.p0.x, y: p.p0.y };
                    let lenSum = 0;
                    for (let s = 1; s <= samples; s++) {
                        let tt = s / samples;
                        let u = 1 - tt;
                        let x = u * u * p.p0.x + 2 * u * tt * p.p1.x + tt * tt * p.p2.x;
                        let y = u * u * p.p0.y + 2 * u * tt * p.p1.y + tt * tt * p.p2.y;
                        lenSum += Math.hypot(x - prev.x, y - prev.y);
                        prev.x = x; prev.y = y;
                    }
                    p.curveLen = Math.max(1, lenSum);
                }

                // advance parameter t so that movement speed along curve is approximately p.speed
                let deltaT = (p.speed * dt) / p.curveLen;
                p.t = (p.t || 0) + deltaT;
                if (p.t >= 1) p.t = 1;

                let u = 1 - p.t;
                p.x = u * u * p.p0.x + 2 * u * p.t * p.p1.x + p.t * p.t * p.p2.x;
                p.y = u * u * p.p0.y + 2 * u * p.t * p.p1.y + p.t * p.t * p.p2.y;

                // spawn trail while flying (wider spread, gray smoke)
                if (this.trailParticles) this.trailParticles.push({
                    x: p.x + (Math.random() - 0.5) * 12,
                    y: p.y + (Math.random() - 0.5) * 10,
                    life: 0.6 + Math.random() * 0.5,
                    vy: -18 - Math.random() * 32,
                    vx: (Math.random() - 0.5) * 30,
                    size: 5 + Math.random() * 6,
                    color: "rgba(170,170,170,0.9)"
                });

                if (p.t >= 1) {
                    this.applyMissileDamage(p);
                    this.projectiles.splice(i, 1);
                }
                continue;
            }

            // fallback: legacy homing behavior (if any)
            let dx = p.targetX - p.x;
            let dy = p.targetY - p.y;
            let dist = Math.hypot(dx, dy);
            let step = p.speed * dt;
            if (dist <= step || dist < 8) {
                this.applyMissileDamage(p);
                this.projectiles.splice(i, 1);
                continue;
            }
            p.x += (dx / dist) * step;
            p.y += (dy / dist) * step;
            // spawn smoke trail for missile (wider spread, gray)
            if (this.trailParticles) {
                this.trailParticles.push({
                    x: p.x + (Math.random() - 0.5) * 14,
                    y: p.y + (Math.random() - 0.5) * 10,
                    life: 0.5 + Math.random() * 0.6,
                    vy: -16 - Math.random() * 36,
                    vx: (Math.random() - 0.5) * 28,
                    size: 4 + Math.random() * 6,
                    color: "rgba(180,180,180,0.85)"
                });
            }
            continue;
        }
        // short visual effects that move toward a fixed point
        if (p.type === 'effect') {
            let dx = p.targetX - p.x;
            let dy = p.targetY - p.y;
            let dist = Math.hypot(dx, dy);
            let step = p.speed * dt;
            if (dist <= step || dist < 6) {
                this.projectiles.splice(i, 1);
                continue;
            }
            p.x += (dx / dist) * step;
            p.y += (dy / dist) * step;
            p.life -= dt;
            if (p.life <= 0) this.projectiles.splice(i, 1);
            continue;
        }

        if (p.target && p.target.dead) { this.projectiles.splice(i, 1); continue; }

        let dx = p.target.x - p.x;
        let dy = p.target.y - p.y;
        let dist = Math.hypot(dx, dy);
        let step = p.speed * dt;

        if (dist <= step || dist < 8) {
            this.applyDamage(p.target, p.dmg, p.source);
            this.projectiles.splice(i, 1);
            continue;
        }
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
        p.life -= dt;
        if (p.life <= 0) this.projectiles.splice(i, 1);
    }

    // Update hit particles
    for (let i = this.hitParticles.length - 1; i >= 0; i--) {
        let p = this.hitParticles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // gravity
        if (p.life <= 0) this.hitParticles.splice(i, 1);
    }

    // Update damage popups
    for (let i = this.damagePopups.length - 1; i >= 0; i--) {
        let pop = this.damagePopups[i];
        pop.life -= dt;
        pop.y += pop.vy * dt;
        pop.vy += 30 * dt;
        if (pop.life <= 0) this.damagePopups.splice(i, 1);
    }

    // Update trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
        let tp = this.trailParticles[i];
        tp.life -= dt;
        tp.x += (tp.vx || 0) * dt;
        tp.y += tp.vy * dt;
        tp.vy += 10 * dt; // slight upward deceleration
        tp.vx = (tp.vx || 0) * 0.98;
        tp.size = (tp.size || 3) + 1.2 * dt; // subtle expansion as smoke drifts
        if (tp.life <= 0) this.trailParticles.splice(i, 1);
    }

    if (this.base.hp <= 0) this.endGame(false);
};

TowerDefenseState.updateEnemy = function (u, dt) {
    if (u.dead) return;
    if (u.hp <= 0) { u.dead = true; this.onEnemyKilled(u); return; }

    if (u.isBomber) {
        this.updateBomber(u, dt);
        return;
    }

    if (!u.isFastMutant) {
        if (!u.target || u.target.dead || this.getDistance(u, u.target) > u.range + 10) {
            u.target = this.findEnemyTarget(u);
        }

        if (u.target) {
            if (u.cd <= 0) {
                u.cd = 1 / u.atkSpd;
                this.applyDamage(u.target, u.atk, u);
            } else {
                u.cd -= dt;
            }
            return;
        }
    } else {
        u.target = null;
    }

    let nextIdx = Math.min(u.pathIndex + 1, u.path.length - 1);
    let targetPoint = u.path[nextIdx];
    let dx = targetPoint.x - u.x;
    let dy = targetPoint.y - u.y;
    let dist = Math.hypot(dx, dy);
    let step = u.spd * dt;

    if (dist <= step) {
        u.x = targetPoint.x;
        u.y = targetPoint.y;
        u.pathIndex = nextIdx;
        if (u.pathIndex >= u.path.length - 1) {
            this.base.hp -= u.atk * 2;
            u.dead = true;
        }
    } else {
        u.x += (dx / dist) * step;
        u.y += (dy / dist) * step;
    }
};

TowerDefenseState.updateBomber = function (u, dt) {
    let target = null;
    let targetType = "";
    let sx = u.x;
    let sy = u.y;

    if (this.heroes.length > 0) {
        let best = null;
        let bestDist = Infinity;
        for (let h of this.heroes) {
            if (h.dead) continue;
            let d = Math.hypot(h.x - sx, h.y - sy);
            if (d < bestDist) { bestDist = d; best = h; }
        }
        if (best) { target = best; targetType = "hero"; }
    }

    if (!target && this.towers.length > 0) {
        let best = null;
        let bestDist = Infinity;
        for (let t of this.towers) {
            if (t.dead) continue;
            let d = Math.hypot(t.x - sx, t.y - sy);
            if (d < bestDist) { bestDist = d; best = t; }
        }
        if (best) { target = best; targetType = "tower"; }
    }

    if (!target && this.base) {
        target = this.base;
        targetType = "base";
    }

    if (!target) return;

    let tx = target.x;
    let ty = target.y;
    let dx = tx - u.x;
    let dy = ty - u.y;
    let dist = Math.hypot(dx, dy);
    let step = u.spd * dt;
    let hitThreshold = 16;

    if (dist <= step || dist <= hitThreshold) {
        if (targetType === "hero") {
            target.dead = true;
            target.hp = 0;
            target.respawnTimer = 8;
        } else if (targetType === "tower") {
            let dmg = target.maxHp * 0.5;
            target.hp -= dmg;
            if (target.hp <= 0) {
                target.hp = 0;
                target.dead = true;
            }
        } else if (targetType === "base" && this.base) {
            let dmg = this.base.maxHp * 0.1;
            this.base.hp -= dmg;
            if (this.base.hp < 0) this.base.hp = 0;
        }
        u.dead = true;
        return;
    }

    u.x += (dx / dist) * step;
    u.y += (dy / dist) * step;
};

TowerDefenseState.updateHero = function (u, dt) {
    if (u.dead) {
        if (u.respawnTimer > 0) u.respawnTimer -= dt;
        return;
    }

    if (u.cd > 0) u.cd = Math.max(0, u.cd - dt);

    if (u.regen > 0 && u.hp < u.maxHp) {
        u.hp = Math.min(u.maxHp, u.hp + u.regen * dt);
    }

    let target = this.findEnemyInRange(u);
    if (target) {
        this.tryAttack(u, target, dt);
        return;
    }

    if (u.path && u.targetPathIndex != null && u.pathIndex != null && u.pathIndex !== u.targetPathIndex) {
        let dir = u.targetPathIndex > u.pathIndex ? 1 : -1;
        let nextIdx = u.pathIndex + dir;
        let targetPoint = u.path[nextIdx];
        if (!targetPoint) {
            u.targetPathIndex = u.pathIndex;
            return;
        }
        let dx = targetPoint.x - u.x;
        let dy = targetPoint.y - u.y;
        let dist = Math.hypot(dx, dy);
        let step = (u.spd + 1) * 20 * dt;
        if (dist <= step) {
            u.x = targetPoint.x;
            u.y = targetPoint.y;
            u.pathIndex = nextIdx;
        } else {
            u.x += (dx / dist) * step;
            u.y += (dy / dist) * step;
        }
    }
};

TowerDefenseState.updateTower = function (t, dt) {
    if (t.dead) return;
    if (t.hp <= 0) { t.dead = true; return; }

    if (t.cd > 0) t.cd = Math.max(0, t.cd - dt);

    let target = this.findEnemyInRange(t);
    if (target) this.tryAttack(t, target, dt);
};

TowerDefenseState.findEnemyInRange = function (u) {
    let nearest = null;
    let dist = 99999;
    for (let e of this.enemies) {
        if (e.dead) continue;
        let d = this.getDistance(u, e);
        if (d <= u.range && d < dist) {
            dist = d;
            nearest = e;
        }
    }
    return nearest;
};

TowerDefenseState.findEnemyTarget = function (enemy) {
    let targets = [];
    this.towers.forEach(t => { if (!t.dead) targets.push(t); });
    this.heroes.forEach(h => { if (!h.dead) targets.push(h); });

    let nearest = null;
    let dist = 99999;
    targets.forEach(t => {
        let d = this.getDistance(enemy, t);
        if (d <= enemy.range && d < dist) {
            dist = d;
            nearest = t;
        }
    });
    return nearest;
};

TowerDefenseState.tryAttack = function (attacker, target, dt) {
    if (attacker.cd > 0) return;

    let atkSpd = attacker.atkSpd * (attacker.isHero ? this.bonusBuff.heroSpd : this.bonusBuff.towerSpd);
    attacker.cd = 1 / atkSpd;
    let dmg = attacker.atk;
    if (attacker.isTower) dmg *= BONUS_MULT[attacker.bonusLevel || 0];
    if (attacker.isHero && Math.random() * 100 < (attacker.crit || 0)) dmg *= 2;
    // apply prep-time bonus packs and TowerDefense star-bonus multiplier
    let starMul = this.tdStarBuff || 1;
    dmg *= (attacker.isHero ? this.bonusBuff.heroAtk : this.bonusBuff.towerAtk) * starMul;

    // determine projectile glyph: towers use projType, heroes/units may use CLASS_TYPES effects
    let effGlyph = null;
    if (attacker.isTower) {
        let ptype = attacker.projType || (attacker.towerData ? DB.getTowerStats(attacker.towerData).projType : 1);
        switch (ptype) {
            case 0: effGlyph = "➰"; break;
            case 1: effGlyph = "🏹"; break;
            case 2: effGlyph = "⚡"; break;
            case 4: effGlyph = "🔥"; break;
            case 5: effGlyph = "✨"; break;
            default: effGlyph = "🔸"; break;
        }
    } else {
        if (attacker.type != null) {
            let ct = Object.values(CLASS_TYPES).find(t => t.id === attacker.type);
            if (ct && ct.effect) effGlyph = ct.effect;
        }
    }

    if (attacker.range > 80) {
        this.projectiles.push({
            x: attacker.x,
            y: attacker.y - 10,
            target: target,
            dmg: dmg,
            speed: 350,
            life: 2,
            source: attacker,
            glyph: effGlyph
        });
    } else {
        // spawn a short visual effect projectile for melee hits
        this.projectiles.push({
            type: 'effect',
            x: attacker.x,
            y: attacker.y - 10,
            targetX: target.x,
            targetY: target.y,
            speed: 600,
            life: 0.18,
            source: attacker,
            glyph: effGlyph || '💥'
        });
        this.applyDamage(target, dmg, attacker);
    }
};

TowerDefenseState.applyDamage = function (target, dmg, source) {
    if (target.dead) return;
    if (target.eva && Math.random() * 100 < target.eva) return;
    if (target.isBomber && source && (source.isTower || source.isHero)) return;

    let realDmg = dmg * (100 / (100 + (target.def || 0)));
    target.hp -= realDmg;
    target.lastHitBy = source;

    // Spawn hit effects and damage popup for heroes and enemies
    if (target.isHero || target.team === 1) {
        if (!this.damagePopups) this.damagePopups = [];
        if (!this.hitParticles) this.hitParticles = [];
        // show positive damage number (no leading '-')
        let dmgText = `${Math.max(1, Math.round(realDmg))}`;
        let color = target.isHero ? "#FF5252" : "#FF7043";
        this.damagePopups.push({ x: target.x, y: target.y - 10, text: dmgText, color: color, life: 0.9, vy: -40 });
        // spawn a few small hit particles
        let count = target.isHero ? 5 : 6;
        for (let i = 0; i < count; i++) {
            let ang = Math.random() * Math.PI * 2;
            let speed = (target.isHero ? 40 : 50) + Math.random() * (target.isHero ? 80 : 60);
            this.hitParticles.push({ x: target.x + (Math.random() - 0.5) * 10, y: target.y + (Math.random() - 0.5) * 10, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 0.35 + Math.random() * 0.45, color: "#D32F2F" });
        }
    }

    if (target.hp <= 0) {
        target.dead = true;
        if (target.isHero) {
            target.respawnTimer = 8;
            target.hp = 0;
        } else if (target.isTower) {
            target.hp = 0;
        }
        if (target.team === 1) this.onEnemyKilled(target);
    }
};

TowerDefenseState.applyAreaDamage = function (x, y, radius, dmg, source) {
    for (let e of this.enemies) {
        if (e.dead) continue;
        let d = Math.hypot(e.x - x, e.y - y);
        if (d <= radius) this.applyDamage(e, dmg, source);
    }
};

TowerDefenseState.applyAreaDamageToDefenders = function (x, y, radius, dmg, source) {
    for (let t of this.towers) {
        if (t.dead) continue;
        let d = Math.hypot(t.x - x, t.y - y);
        if (d <= radius) this.applyDamage(t, dmg, source);
    }
    for (let h of this.heroes) {
        if (h.dead) continue;
        let d = Math.hypot(h.x - x, h.y - y);
        if (d <= radius) this.applyDamage(h, dmg, source);
    }
    if (this.base) {
        let dBase = Math.hypot(this.base.x - x, this.base.y - y);
        if (dBase <= radius) {
            this.base.hp -= dmg;
            if (this.base.hp < 0) this.base.hp = 0;
        }
    }
};

TowerDefenseState.applyMissileDamage = function (projectile) {
    if (projectile && projectile.source && projectile.source.isEnemyBase) {
        this.applyAreaDamageToDefenders(projectile.targetX, projectile.targetY, projectile.radius, projectile.dmg, projectile.source);
    } else {
        this.applyAreaDamage(projectile.targetX, projectile.targetY, projectile.radius, projectile.dmg, projectile.source);
    }
};

TowerDefenseState.fireBaseMissile = function () {
    if (this.missileCD > 0) return;
    if (this.enemies.length === 0) return;

    let target = null;
    let dist = 99999;
    this.enemies.forEach(e => {
        let d = Math.hypot(e.x - this.base.x, e.y - this.base.y);
        if (d < dist) { dist = d; target = e; }
    });
    if (!target) return;

    this.missileCD = 8;
    // missile starts, flies outward toward map center while spiraling, then homes to target
    let startX = this.base.x;
    let startY = this.base.y - 40;
    // map center as spiral target
    let mapCenterX = this.map.originX + this.map.bounds.w / 2;
    let mapCenterY = this.map.originY + this.map.bounds.h / 2;
    // orbit radius ~ quarter of smaller map dimension
    let orbitR = Math.min(this.map.bounds.w, this.map.bounds.h) * 0.28 + Math.random() * 30;
    // longer spiral so it makes several revolutions in middle
    let spiralDur = 1.2 + Math.random() * 0.8;
    let ang = Math.random() * Math.PI * 2;
    this.projectiles.push({
        type: 'missile',
        x: startX,
        y: startY,
        startX: startX,
        startY: startY,
        targetX: target.x,
        targetY: target.y,
        speed: 700,
        dmg: 250 + this.level * 20,
        radius: 90,
        source: { isBaseSkill: true },
        // use a quadratic Bézier path from start -> control -> target
        pathType: 'bezier',
        // control point will be computed below to create a looping/arched trajectory
        p0: { x: startX, y: startY },
        p1: null,
        p2: { x: target.x, y: target.y },
        t: 0,
        curveLen: null
    });
    // set initial distance for scaling effect
    let created = this.projectiles[this.projectiles.length - 1];
    created.initDist = Math.max(40, Math.hypot(created.targetX - created.startX, created.targetY - created.startY));
    // compute a nice control point to create an arcing/looping path
    // midpoint between start and target
    let midX = (created.startX + created.targetX) / 2;
    let midY = (created.startY + created.targetY) / 2;
    // perpendicular offset based on vector from start->target
    let vx = created.targetX - created.startX;
    let vy = created.targetY - created.startY;
    let len = Math.hypot(vx, vy) || 1;
    let px = -vy / len; // perp
    let py = vx / len;
    // magnitude scaled to map size and some randomness
    let mapScale = Math.min(this.map.bounds.w, this.map.bounds.h);
    let offsetMag = mapScale * (0.18 + Math.random() * 0.18);
    // randomize direction so trajectories vary
    if (Math.random() > 0.5) { px = -px; py = -py; }
    created.p1 = { x: midX + px * offsetMag, y: midY + py * offsetMag };
    
};

TowerDefenseState.fireEnemyMissile = function () {
    if (!this.map || !this.map.spawnWorld) return false;

    let targets = [];
    this.towers.forEach(t => { if (!t.dead) targets.push(t); });
    this.heroes.forEach(h => { if (!h.dead) targets.push(h); });

    let startX = this.map.spawnWorld.x;
    let startY = this.map.spawnWorld.y - 20;
    let target = null;
    let dist = 99999;
    for (let t of targets) {
        let d = Math.hypot(t.x - startX, t.y - startY);
        if (d < dist) { dist = d; target = t; }
    }

    let targetX = target ? target.x : this.base.x;
    let targetY = target ? target.y : this.base.y;

    this.projectiles.push({
        type: 'missile',
        x: startX,
        y: startY,
        startX: startX,
        startY: startY,
        targetX: targetX,
        targetY: targetY,
        speed: 600,
        dmg: 140 + this.level * 12,
        radius: 90,
        source: { isEnemyBase: true },
        pathType: 'bezier',
        p0: { x: startX, y: startY },
        p1: null,
        p2: { x: targetX, y: targetY },
        t: 0,
        curveLen: null
    });
    let created = this.projectiles[this.projectiles.length - 1];
    created.initDist = Math.max(40, Math.hypot(created.targetX - created.startX, created.targetY - created.startY));

    let midX = (created.startX + created.targetX) / 2;
    let midY = (created.startY + created.targetY) / 2;
    let vx = created.targetX - created.startX;
    let vy = created.targetY - created.startY;
    let len = Math.hypot(vx, vy) || 1;
    let px = -vy / len;
    let py = vx / len;
    let mapScale = Math.min(this.map.bounds.w, this.map.bounds.h);
    let offsetMag = mapScale * 0.16;
    if (Math.random() > 0.5) { px = -px; py = -py; }
    created.p1 = { x: midX + px * offsetMag, y: midY + py * offsetMag };
    return true;
};

TowerDefenseState.fireMeteor = function () {
    if (this.meteorCharges <= 0) return;
    this.meteorCharges--;
    this.meteorActive = true;
    this.meteorTimer = 0;
    this.meteorWaveCount = 0;
    addToast("MƯA THIÊN THẠCH!", "#E91E63");
};

TowerDefenseState.spawnMeteorWave = function () {
    let targets = this.enemies.filter(e => !e.dead);
    if (targets.length === 0) return;

    let maxTargets = Math.min(6, targets.length);
    for (let i = 0; i < maxTargets; i++) {
        let t = targets[Math.floor(Math.random() * targets.length)];
        // spawn meteor starting from top-right area and target the enemy position
        let startX = this.map.originX + this.map.bounds.w + 120 + Math.random() * 160;
        let startY = this.map.originY - 120 - Math.random() * 200;
        let speed = 1.0 + Math.random() * 0.6;
        this.projectiles.push({
            type: 'meteor',
            startX: startX,
            startY: startY,
            targetX: t.x,
            targetY: t.y,
            x: startX,
            y: startY,
            timer: 0,
            speed: speed,
            dmg: 200 + this.level * 15,
            radius: 100,
            source: { isBaseSkill: true }
        });
    }
};

TowerDefenseState.onEnemyKilled = function (enemy) {
    this.kills++;
    // Increase rewards: stronger scaling with enemy hp and level
    // Base gain + percent of enemy maxHp. Also scale slightly with current level.
    let levelScale = 1 + (this.level - 1) * 0.06; // +6% per level
    let gain = Math.floor((40 + enemy.maxHp * 0.12) * levelScale);
    this.mineral = Math.min(this.maxMineral, this.mineral + gain);
    // convert gold reward into diamonds: diamonds = ceil(gold * level / 50)
    let goldEquivalent = Math.floor((50 + enemy.maxHp * 0.04) * levelScale);
    let diamondsGain = Math.ceil((goldEquivalent * (this.level || 1)) / 2500);
    if (!DB.data.diamonds) DB.data.diamonds = 0;
    DB.data.diamonds += diamondsGain;
    addToast(`+${diamondsGain} 💎`, "#29B6F6");

    if (enemy.lastHitBy && enemy.lastHitBy.isTower && enemy.lastHitBy.towerData) {
        let expGain = Math.floor(10 + enemy.maxHp * 0.1);
        let leveledUp = DB.addTowerExp(enemy.lastHitBy.towerData, expGain);
        if (leveledUp) {
            let stats = DB.getTowerStats(enemy.lastHitBy.towerData);
            if (stats) {
                enemy.lastHitBy.atk = stats.atk;
                enemy.lastHitBy.range = stats.range;
                enemy.lastHitBy.atkSpd = stats.atkSpd;
                enemy.lastHitBy.maxHp = stats.hp;
                enemy.lastHitBy.hp = Math.min(enemy.lastHitBy.maxHp, enemy.lastHitBy.hp + stats.hp * 0.2);
            }
        }
    }
};

TowerDefenseState.getDistance = function (a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
};

TowerDefenseState.handleMapClick = function () {
    if (!Enjine.Mouse.Clicked) return;
    if (this.showStartDialog || this.gameOver) return;

    let mx = Enjine.Mouse.X;
    let my = Enjine.Mouse.Y;
    let bounds = this.map.bounds;

    // if click is outside vertical map area (top header or bottom UI), ignore
    if (my < this.ui.topMargin || my > GAME.Canvas.Height - this.ui.bottomH) return;
    // if click is within the vertical map band but outside the map bounds, clear selections
    if (mx < bounds.x || mx > bounds.x + bounds.w || my < bounds.y || my > bounds.y + bounds.h) {
        this.selectedTowerId = null;
        this.selectedTowerInstance = null;
        this.selectedHeroId = null;
        Enjine.Mouse.Clicked = false;
        return;
    }

    for (let h of this.heroes) {
        if (h.dead) continue;
        if (this.getDistance({ x: mx, y: my }, h) < 24) {
            this.selectedHeroId = h.id;
            this.selectedTowerInstance = null;
            Enjine.Mouse.Clicked = false;
            return;
        }
    }

    for (let slot of this.map.towerSlotsWorld) {
        if (this.getDistance({ x: mx, y: my }, slot) < 22) {
            let existing = this.towers.find(t => t.gridPos && t.gridPos.x === slot.grid.x && t.gridPos.y === slot.grid.y);
            if (existing) {
                if (this.sellMode) {
                    let refund = Math.floor((existing.totalCost || 0) * 0.7);
                    this.mineral = Math.min(this.maxMineral, this.mineral + refund);
                    existing.dead = true;
                    // clear embedded heroes from DB for this tower so they return to hero pool
                    let dbTower = DB.data.towers.find(t => t.id === existing.id);
                    if (dbTower && dbTower.embeddedHeroes && dbTower.embeddedHeroes.length > 0) {
                        for (let hid of dbTower.embeddedHeroes) {
                            let hh = DB.data.heroes.find(h => h.id === hid);
                            if (hh) delete hh.embeddedIn;
                        }
                        dbTower.embeddedHeroes = [];
                        DB.save();
                    }
                    addToast(`Đã bán +${refund} mineral`, "#4CAF50");
                } else {
                    this.selectedTowerInstance = existing;
                    this.selectedHeroId = null;
                }
                Enjine.Mouse.Clicked = false;
                return;
            }
            if (!this.selectedTowerId) { addToast("Chọn chòi canh trước!", "#FF9800"); Enjine.Mouse.Clicked = false; return; }
            if (this.sellMode) { Enjine.Mouse.Clicked = false; return; }
            if (this.builtTowerIds.has(this.selectedTowerId)) { addToast("Chòi đã xuất chiến!", "#FF9800"); Enjine.Mouse.Clicked = false; return; }

            let towerData = DB.data.towers.find(t => t.id === this.selectedTowerId);
            if (!towerData) { Enjine.Mouse.Clicked = false; return; }

            let stats = DB.getTowerStats(towerData);
            // apply embedded hero star bonus: each hero star = +1% to all tower stats
            let embedded = towerData.embeddedHeroes || [];
            let totalHeroStars = 0;
            for (let hid of embedded) {
                let hh = DB.data.heroes.find(h => h.id === hid);
                if (hh) totalHeroStars += (hh.stars || 1);
            }
            let heroStarMul = 1 + (totalHeroStars * 0.01);
            if (heroStarMul !== 1) {
                stats = { ...stats };
                stats.atk = Math.round(stats.atk * heroStarMul);
                stats.hp = Math.round(stats.hp * heroStarMul);
                stats.range = Math.round(stats.range * heroStarMul);
                stats.atkSpd = parseFloat((stats.atkSpd * heroStarMul).toFixed(2));
            }
            let cost = Math.max(80, Math.floor(stats.atk * 1.5));
            if (this.mineral < cost) { addToast("Không đủ mineral!", "#F44336"); Enjine.Mouse.Clicked = false; return; }

            this.mineral -= cost;
            this.towers.push({
                id: towerData.id,
                towerData: towerData,
                type: towerData.type,
                projType: stats.projType,
                isTower: true,
                team: 0,
                x: slot.x,
                y: slot.y,
                gridPos: { x: slot.grid.x, y: slot.grid.y },
                hp: stats.hp,
                maxHp: stats.hp,
                atk: stats.atk,
                range: stats.range,
                atkSpd: stats.atkSpd,
                cd: 0,
                bonusLevel: 0,
                totalCost: cost,
                dead: false
            });
            // spawn dust particles to show tower placement (small ground puffs)
            let createdTower = this.towers[this.towers.length - 1];
            if (this.trailParticles) {
                for (let pi = 0; pi < 10; pi++) {
                    this.trailParticles.push({
                        x: createdTower.x + (Math.random() - 0.5) * 18,
                        y: createdTower.y + (Math.random() - 0.5) * 8 + 6,
                        life: 0.6 + Math.random() * 0.6,
                        vy: -8 - Math.random() * 12,
                        size: 6 + Math.random() * 8,
                        color: "rgba(120,100,60,0.9)"
                    });
                }
            }
            this.builtTowerIds.add(this.selectedTowerId);
            this.selectedTowerInstance = null;
            Enjine.Mouse.Clicked = false;
            return;
        }
    }

    // clicked on map but not on any slot or hero -> if a tower was selected for placement, hide its menu
    if (this.selectedTowerId) {
        this.selectedTowerId = null;
        // do not `return` here so click can still be used to move a selected hero
    }

    if (this.selectedHeroId) {
        let hero = this.heroes.find(h => h.id === this.selectedHeroId);
        if (hero && !hero.dead) this.setHeroTargetByClick(hero, mx, my);
        Enjine.Mouse.Clicked = false;
    }
};

TowerDefenseState.endGame = function (win) {
    this.gameOver = true;
    this.win = win;

    if (win) {
        let baseGold = Math.floor(this.level * 800);
        DB.data.gold += baseGold + this.goldEarned;
        if (this.level >= DB.data.tdMaxStage) DB.data.tdMaxStage++;

        let medal = 1;
        if (this.base.hp / this.base.maxHp > 0.8) medal = 3;
        else if (this.base.hp / this.base.maxHp > 0.4) medal = 2;
        if (medal > DB.data.tdMedals[this.level - 1]) DB.data.tdMedals[this.level - 1] = medal;

        // Award random stars (0-3) for Tower Defense with ratchet effect
        if (!DB.data.tdStars) DB.data.tdStars = [];
        if (!DB.data.tdStarHistory) DB.data.tdStarHistory = []; // track all stars earned
        
        let prevStars = DB.data.tdStars[this.level - 1] || 0;
        let starsRandom = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
        let starsAward = Math.max(prevStars, starsRandom); // ratchet: only increase or stay same
        
        // update level best and record in history
        if (starsAward !== prevStars) {
            DB.data.tdStars[this.level - 1] = starsAward;
        }
        DB.data.tdStarHistory.push({ level: this.level, stars: starsRandom, finalStars: starsAward });
        
        // tdStarBonuses = total of ALL stars ever earned (sum of history)
        let totalStarsEarned = 0;
        if (DB.data.tdStarHistory && Array.isArray(DB.data.tdStarHistory)) {
            totalStarsEarned = DB.data.tdStarHistory.reduce((sum, record) => sum + (record.stars || 0), 0);
        }
        DB.data.tdStarBonuses = totalStarsEarned;
        
        // notify player of star reward
        if (typeof addToast === 'function') {
            let msg = `Nhận ${starsRandom} ⭐ (lưu: ${starsAward} ⭐)`;
            if (starsAward > prevStars && starsRandom < starsAward) {
                msg += ` - Giữ nguyên ${starsAward} ⭐`;
            }
            addToast(msg, "#FFD54F");
        }
    }

    // update local buff multiplier
    this.tdStarBuff = 1 + (0.05 * (DB.data.tdStarBonuses || 0));

    DB.save();
};

TowerDefenseState.Draw = function (ctx) {
    if (!this.lastCanvasSize || this.lastCanvasSize.w !== GAME.Canvas.Width || this.lastCanvasSize.h !== GAME.Canvas.Height) {
        this.updateMapLayout();
        this.lastCanvasSize = { w: GAME.Canvas.Width, h: GAME.Canvas.Height };
    }

    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    let tileSize = this.map.tileSize;
    let originX = this.map.originX;
    let originY = this.map.originY;

    drawRect(ctx, 0, this.ui.topMargin, GAME.Canvas.Width, GAME.Canvas.Height - this.ui.topMargin, "#6FB54A");
    drawRect(ctx, originX, originY, this.map.width * tileSize, this.map.height * tileSize, "#7CB342");

    for (let y = 0; y < this.map.height; y++) {
        for (let x = 0; x < this.map.width; x++) {
            let cell = this.map.grid[y][x];
            if (cell === "path") {
                drawRect(ctx, originX + x * tileSize, originY + y * tileSize, tileSize, tileSize, "#C2A16D");
            } else if (cell === "river") {
                let rx = originX + x * tileSize;
                let ry = originY + y * tileSize;
                drawRect(ctx, rx, ry, tileSize, tileSize, "#2196F3");

                let waveOffset = (this.animTime * 40) % tileSize;
                ctx.save();
                ctx.globalAlpha = 0.35;
                for (let i = 0; i < tileSize; i += 8) {
                    let wy = (i + waveOffset) % tileSize;
                    drawRect(ctx, rx + 3, ry + wy, 2, 6, "rgba(255,255,255,0.6)");
                    drawRect(ctx, rx + tileSize - 6, ry + ((wy + 10) % tileSize), 2, 6, "rgba(255,255,255,0.4)");
                }
                ctx.restore();
            } else if (cell === "bridge") {
                drawRect(ctx, originX + x * tileSize, originY + y * tileSize, tileSize, tileSize, "#8D6E63");
                drawRect(ctx, originX + x * tileSize, originY + y * tileSize + tileSize / 2 - 4, tileSize, 8, "#5D4037");
            }
        }
    }

    // draw moving clouds behind trees
    this.map.trees.forEach(t => {
        let x = originX + (t.x + 0.5) * tileSize;
        let y = originY + (t.y + 0.5) * tileSize;
        let sway = Math.sin(this.animTime * 2 + t.x * 0.7 + t.y * 1.3) * 2;
        drawRect(ctx, x - 4 + sway * 0.3, y + 8, 8, 12, "#5D4037");
        drawCircle(ctx, x + sway, y - 2, tileSize * 0.25, "#2E7D32");
        drawCircle(ctx, x + sway - 6, y + 2, tileSize * 0.18, "#388E3C");
    });
    this.map.rocks.forEach(r => {
        let x = originX + (r.x + 0.5) * tileSize;
        let y = originY + (r.y + 0.5) * tileSize;
        let rockType = (r.x * 7 + r.y * 11) % 4;
        let color = ["#9E9E9E", "#757575", "#A1887F", "#78909C"][rockType];
        if (rockType === 0) {
            // circular rock
            drawCircle(ctx, x, y, tileSize * 0.2, color);
        } else if (rockType === 1) {
            // square rock
            drawRect(ctx, x - tileSize * 0.18, y - tileSize * 0.18, tileSize * 0.36, tileSize * 0.36, color);
        } else if (rockType === 2) {
            // jagged rock (multiple circles)
            drawCircle(ctx, x, y, tileSize * 0.22, color);
            drawCircle(ctx, x - 5, y + 6, tileSize * 0.12, color);
            drawCircle(ctx, x + 5, y + 6, tileSize * 0.12, color);
        } else {
            // oblong rock
            drawRect(ctx, x - tileSize * 0.25, y - tileSize * 0.12, tileSize * 0.5, tileSize * 0.24, color);
        }
    });
    this.map.mountains.forEach(m => {
        let x = originX + (m.x + 0.5) * tileSize;
        let y = originY + (m.y + 0.5) * tileSize;
        drawRect(ctx, x - tileSize * 0.25, y - tileSize * 0.25, tileSize * 0.5, tileSize * 0.5, "#616161");
    });
    this.map.bushes.forEach(b => {
        let x = originX + (b.x + 0.5) * tileSize;
        let y = originY + (b.y + 0.5) * tileSize;
        drawCircle(ctx, x, y, tileSize * 0.18, "#4CAF50");
        drawCircle(ctx, x + 6, y + 2, tileSize * 0.14, "#66BB6A");
    });
    this.map.grassPatches.forEach(g => {
        let x = originX + (g.x + 0.5) * tileSize;
        let y = originY + (g.y + 0.5) * tileSize;
        let grassType = (g.x * 3 + g.y * 5) % 5;
        if (grassType === 0) {
            drawRect(ctx, x - 6, y + 6, 10, 2, "#4E8A2E");
            drawRect(ctx, x + 2, y + 4, 10, 2, "#5AAE3A");
        } else if (grassType === 1) {
            drawRect(ctx, x - 8, y + 5, 8, 2, "#558B2F");
            drawRect(ctx, x, y + 8, 12, 2, "#7CB342");
        } else if (grassType === 2) {
            drawRect(ctx, x - 7, y + 3, 12, 2.5, "#689F38");
            drawRect(ctx, x - 5, y + 7, 10, 2, "#AFB42B");
        } else if (grassType === 3) {
            drawRect(ctx, x - 4, y + 4, 8, 1.5, "#33691E");
            drawRect(ctx, x - 6, y + 7, 12, 2, "#558B2F");
            drawRect(ctx, x + 3, y + 10, 6, 1.5, "#689F38");
        } else {
            drawRect(ctx, x - 9, y + 6, 9, 2, "#7CB342");
            drawRect(ctx, x, y + 3, 8, 2.5, "#9CCC65");
        }
    });
    this.map.flowers.forEach(f => {
        let x = originX + (f.x + 0.5) * tileSize;
        let y = originY + (f.y + 0.5) * tileSize;
        let flowerType = (f.x * 13 + f.y * 17) % 8;
        let colors = ["#FFEB3B", "#FF7043", "#EC407A", "#BA68C8", "#FFB74D", "#FF6E40", "#EF5350", "#AB47BC"];
        let color = colors[flowerType % colors.length];
        let stemColor = "#558B2F";
        if (flowerType === 0 || flowerType === 1) {
            // simple flower
            drawCircle(ctx, x, y, 3, color);
            drawRect(ctx, x - 0.5, y + 2, 1, 4, stemColor);
        } else if (flowerType === 2 || flowerType === 3) {
            // multi-petal flower (6 petals)
            drawCircle(ctx, x, y - 2, 2, color);
            drawCircle(ctx, x + 2, y - 1, 2, color);
            drawCircle(ctx, x + 2, y + 1, 2, color);
            drawCircle(ctx, x, y + 2, 2, color);
            drawCircle(ctx, x - 2, y + 1, 2, color);
            drawCircle(ctx, x - 2, y - 1, 2, color);
            drawCircle(ctx, x, y, 1.5, "#FFD700");
            drawRect(ctx, x - 0.5, y + 3, 1, 3, stemColor);
        } else if (flowerType === 4 || flowerType === 5) {
            // tulip-like
            drawRect(ctx, x - 1.5, y - 3, 1, 4, color);
            drawRect(ctx, x + 0.5, y - 3, 1, 4, color);
            drawCircle(ctx, x, y - 1, 2.5, color);
            drawRect(ctx, x - 0.5, y + 1, 1, 4, stemColor);
        } else {
            // daisy (multiple petals arranged in circle)
            let petalDist = 2.5;
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
                let px = x + Math.cos(angle) * petalDist;
                let py = y + Math.sin(angle) * petalDist;
                drawCircle(ctx, px, py, 1.5, color);
            }
            drawCircle(ctx, x, y, 2, "#FDD835");
            drawRect(ctx, x - 0.5, y + 2, 1, 3, stemColor);
        }
    });
    if (this.scenery && this.scenery.clouds) {
        for (let c of this.scenery.clouds) {
            ctx.save();
            ctx.globalAlpha = c.alpha || 0.7;
            drawText(ctx, "☁️", c.x, c.y, "white", Math.max(24, Math.round(c.size)), "center");
            ctx.restore();
        }
    }


    // draw birds and butterflies above map objects
    if (this.scenery) {
        if (this.scenery.birds) {
            for (let br of this.scenery.birds) {
                let size = 18 + Math.abs(Math.sin(this.animTime * 8 + br.phase)) * 8;
                drawText(ctx, br.icon || "🐦", br.x, br.y, "white", Math.round(size), "center");
            }
        }
        if (this.scenery.butterflies) {
            for (let bf of this.scenery.butterflies) {
                let flutter = 12 + Math.abs(Math.sin(bf.phase * 3)) * 8;
                drawText(ctx, bf.icon || "🦋", bf.x, bf.y, "white", Math.round(flutter), "center");
            }
        }
    }

    drawText(ctx, "👹", this.map.spawnWorld.x, this.map.spawnWorld.y + 6, "white", 32, "center");
    drawRoundedRect(ctx, this.base.x - tileSize * 0.45, this.base.y - tileSize * 0.45, tileSize * 0.9, tileSize * 0.9, 8, "#6D4C41");
    drawText(ctx, "🏰", this.base.x, this.base.y + 6, "white", 32, "center");

    drawRect(ctx, this.base.x - 40, this.base.y - tileSize * 0.7, 80, 6, "red");
    let baseHpPct = Math.max(0, this.base.hp) / this.base.maxHp;
    drawRect(ctx, this.base.x - 40, this.base.y - tileSize * 0.7, 80 * baseHpPct, 6, "lime");

    for (let slot of this.map.towerSlotsWorld) {
        // always draw dirt patch (remain visible under placed towers)
        let patchR = Math.max(12, tileSize * 0.28);
        drawCircle(ctx, slot.x, slot.y, patchR, "#8D6E63");
        drawCircle(ctx, slot.x, slot.y, patchR * 0.62, "#A1887F");
        // deterministic tiny rocks based on grid coords
        const pseudo = (v) => { let x = Math.sin(v) * 10000; return x - Math.floor(x); };
        for (let r = 0; r < 4; r++) {
            let seed = slot.grid.x * 37 + slot.grid.y * 91 + r * 13;
            let a = pseudo(seed) * Math.PI * 2;
            let rad = patchR * (0.6 + pseudo(seed + 7) * 0.3);
            let rx = slot.x + Math.cos(a) * rad;
            let ry = slot.y + Math.sin(a) * rad;
            drawCircle(ctx, rx, ry, 2, "#9E9E9E");
        }
    }

    this.towers.forEach(t => {
        let stars = t.towerData ? t.towerData.stars : 1;
        let shape = TOWER_SHAPES[Math.min(TOWER_SHAPES.length - 1, stars - 1)];
        drawText(ctx, shape, t.x, t.y + 6, "white", 30, "center");
        drawRect(ctx, t.x - 20, t.y - 26, 40, 4, "red");
        drawRect(ctx, t.x - 20, t.y - 26, 40 * (t.hp / t.maxHp), 4, "lime");
        if (t.bonusLevel && t.bonusLevel > 0) {
            drawRoundedRect(ctx, t.x - 16, t.y - 42, 32, 14, 6, "rgba(0,0,0,0.6)");
            drawText(ctx, `B${t.bonusLevel}`, t.x, t.y - 32, "#FFD54F", 10, "center");
        }
        if (t === this.selectedTowerInstance) {
            // Draw attack range circle for the selected tower (behind buttons)
            if (t.range && t.range > 8) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0,0,0,0.12)";
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#FFD54F";
                ctx.stroke();
                ctx.restore();
            }
            // Draw sell/upgrade buttons below selected tower
            let btnH = 25;
            let btnW = 50;
            let btnGap = 10;
            let sellX = t.x - btnW - btnGap / 2;
            let upgradeX = t.x + btnGap / 2;
            let btnY = t.y + 30;
            
            let upgradeCost = 150 + (t.bonusLevel || 0) * 150;
            let canUpgrade = (t.bonusLevel || 0) < 3 && this.mineral >= upgradeCost;
            
            drawButton(ctx, "Bán", sellX, btnY, btnW, btnH, "#D32F2F", () => {
                let idx = this.towers.indexOf(t);
                if (idx !== -1) {
                    this.towers[idx].dead = true;
                    this.builtTowerIds.delete(t.id);
                }
            }, "white", 10);
            
            drawButton(ctx, "Nâng", upgradeX, btnY, btnW, btnH, canUpgrade ? "#FF9800" : "#555", () => {
                if (!canUpgrade) return;
                this.mineral -= upgradeCost;
                t.bonusLevel = Math.min(3, (t.bonusLevel || 0) + 1);
                t.totalCost = (t.totalCost || 0) + upgradeCost;
                // sparkle effect on upgrade
                if (this.hitParticles) {
                    for (let s = 0; s < 12; s++) {
                        let ang = Math.random() * Math.PI * 2;
                        let sp = 40 + Math.random() * 80;
                        this.hitParticles.push({ x: t.x + (Math.random() - 0.5) * 8, y: t.y + (Math.random() - 0.5) * 6, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.6 + Math.random() * 0.6, color: "#FFD54F" });
                    }
                }
            }, "white", 10);
        }
        // Draw rotating stars for embedded heroes (one star per hero-star count) when tower is placed
        let dbTower = t.towerData || null;
        if (dbTower && dbTower.embeddedHeroes && dbTower.embeddedHeroes.length > 0) {
            let total = dbTower.embeddedHeroes.length;
            for (let si = 0; si < total; si++) {
                let a = (this.animTime * 2 + si * (Math.PI * 2 / Math.max(1, total)));
                let rad = 30 + (si * 4);
                let sx = t.x + Math.cos(a) * rad;
                let sy = t.y - 18 + Math.sin(a) * rad * 0.6;
                ctx.save();
                ctx.globalAlpha = 0.95;
                drawText(ctx, "★", sx, sy, "#FFD54F", 14, "center");
                ctx.restore();
            }
        }
    });

    this.heroes.forEach(h => {
        let icon = h.icon || "🧙";
        let alpha = h.dead ? 0.4 : 1;
        ctx.globalAlpha = alpha;
        drawText(ctx, icon, h.x, h.y + 6, "white", 28, "center");
        ctx.globalAlpha = 1;

        if (!h.dead) {
            drawRect(ctx, h.x - 18, h.y - 24, 36, 4, "red");
            drawRect(ctx, h.x - 18, h.y - 24, 36 * (h.hp / h.maxHp), 4, "lime");
        }
    });

    this.enemies.forEach(e => {
        let scale = e.scale || 1;
        let iconSize = Math.max(18, Math.round(26 * scale));
        let barW = 32 * scale;
        let barH = 4 * scale;
        let barX = e.x - barW / 2;
        let barY = e.y - 22 * scale;
        drawText(ctx, e.icon, e.x, e.y + 6 * scale, "white", iconSize, "center");
        drawRect(ctx, barX, barY, barW, barH, "red");
        drawRect(ctx, barX, barY, barW * (e.hp / e.maxHp), barH, "lime");
    });

    // Draw trail particles (behind projectiles)
    if (this.trailParticles) {
        for (let tp of this.trailParticles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, tp.life / 1.0);
            drawCircle(ctx, tp.x, tp.y, tp.size || 3, tp.color || "rgba(200,200,200,0.6)");
            ctx.restore();
        }
    }

    this.projectiles.forEach(p => {
        if (p.type === 'meteor') {
            drawText(ctx, "☄️", p.x, p.y, "white", 20, "center");
        } else if (p.type === 'missile') {
            let dx = p.targetX - p.x;
            let dy = p.targetY - p.y;
            let rem = Math.hypot(dx, dy);
            // ensure initDist exists
            if (!p.initDist) p.initDist = Math.max(40, Math.hypot((p.targetX || 0) - (p.startX || p.x), (p.targetY || 0) - (p.startY || p.y)));
            let t = 1 - Math.min(1, rem / p.initDist);
            // scale from 0.6 -> 2.0 as it approaches
            let scale = 0.6 + t * 1.4;
            let size = Math.max(10, Math.round(18 * scale));
            let angle = Math.atan2(dy, dx);
            let emojiOffset = Math.PI / 4; // rocket emoji orientation
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle + emojiOffset);
            drawText(ctx, "🚀", 0, 0, "white", size, "center");
            ctx.restore();
        } else if (p.glyph) {
            drawText(ctx, p.glyph, p.x, p.y, p.color || "white", 18, "center");
        } else {
            drawCircle(ctx, p.x, p.y, 4, "#FFD54F");
        }
    });

    // Draw hit particles
    if (this.hitParticles) {
        for (let p of this.hitParticles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / 0.8);
            drawCircle(ctx, p.x, p.y, 2, p.color || "#D32F2F");
            ctx.restore();
        }
    }

    // Draw damage popups
    if (this.damagePopups) {
        for (let pop of this.damagePopups) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, pop.life / 0.9);
            drawText(ctx, pop.text, pop.x, pop.y, pop.color || "#FF5252", 16, "center");
            ctx.restore();
        }
    }

    // Draw hero range overlay (stroke-only, shown when hero selected)
    if (this.selectedHeroId) {
        let sh = this.heroes.find(h => h.id === this.selectedHeroId);
        if (sh && !sh.dead) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(sh.x, sh.y, sh.range || 80, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255,213,79,0.95)"; // #FFD54F
            ctx.stroke();
            ctx.restore();
        }
    }

    drawText(ctx, `Thủ thành - Màn ${this.level}`, GAME.Canvas.Width / 2, 32, "white", 22, "center");
    
    // Time display - centered with border
    let timeX = GAME.Canvas.Width / 2;
    let timeY = 95;
    let timeText = `${Math.ceil(this.timeLeft)}s`;
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(timeText, timeX, timeY);
    ctx.fillText(timeText, timeX, timeY);
    ctx.restore();

    let bY = GAME.Canvas.Height - this.ui.bottomH;
    drawRect(ctx, 0, bY, GAME.Canvas.Width, this.ui.bottomH, "rgba(0,0,0,0.8)");

    // Base skills
    let missileX = 20;
    let missileY = bY + 20;
    let missileReady = this.missileCD <= 0;
    let missileSize = 100;
    drawButton(ctx, "", missileX, missileY, missileSize, missileSize, missileReady ? "#C62828" : "#333", () => this.fireBaseMissile());
    drawText(ctx, "🚀", missileX + missileSize / 2, missileY + missileSize / 2 + 10, "white", 48, "center");
    drawText(ctx, "Q", missileX + 8, missileY + 12, "#FFCDD2", 10, "left");
    drawText(ctx, missileReady ? "Ready" : `${Math.ceil(this.missileCD)}s`, missileX + missileSize / 2, missileY + missileSize - 10, "#FFCDD2", 10, "center");

    let meteorX = 140;
    let meteorY = bY + 20;
    let meteorSize = 100;
    let meteorReady = this.meteorCharges > 0;
    drawButton(ctx, "", meteorX, meteorY, meteorSize, meteorSize, meteorReady ? "#7B1FA2" : "#333", () => this.fireMeteor());
    drawText(ctx, "☄️", meteorX + meteorSize / 2, meteorY + meteorSize / 2 + 10, "white", 48, "center");
    drawText(ctx, "W", meteorX + 8, meteorY + 12, "#E1BEE7", 10, "left");
    if (this.meteorCharges > 0) drawBadge(ctx, meteorX + meteorSize - 5, meteorY + 5, this.meteorCharges);

    drawText(ctx, "💎", 40, 80, "white", 28, "center");
    drawText(ctx, `${Math.floor(this.mineral)}/${this.maxMineral}`, 40, 100, "black", 12, "center");
    // Tower Defense star bank display (TD-only)
    let tdBank = (DB.data && DB.data.tdStarBank) ? DB.data.tdStarBank : 0;
    let tdBon = (DB.data && DB.data.tdStarBonuses) ? DB.data.tdStarBonuses : 0;
    drawText(ctx, `★ ${tdBank}  (+${tdBon * 5}%)`, 40, 120, "#FFD54F", 12, "center");

    drawText(ctx, `Base: ${Math.floor(this.base.hp)}`, GAME.Canvas.Width - 100, 70, "red", 14, "left");
    let totalEnemies = this.levelTotalEnemies || 0;
    drawText(ctx, `Kills: ${this.kills}/${totalEnemies}`, GAME.Canvas.Width - 100, 95, "red", 14, "left");

    // Exit
    drawButton(ctx, "Thoát\nEsc", GAME.Canvas.Width - 120, bY + 20, 100, 100, "#C62828", () => GAME.ChangeState(TowerDefenseStageSelectState), "white", 12);

    let towerSlotSize = 100;
    let towerGap = 12;
    let towerRowW = 4 * towerSlotSize + 3 * towerGap;
    let heroSlot = 100;
    let heroGap = 12;
    let heroW = this.heroes.length * heroSlot + Math.max(0, this.heroes.length - 1) * heroGap;
    let groupGap = heroW > 0 ? 18 : 0;
    let groupW = towerRowW + heroW + groupGap;
    let groupStartX = (GAME.Canvas.Width - groupW) / 2;
    let towerStartX = groupStartX;
    let heroX = towerStartX + towerRowW + groupGap;
    let towerY = bY + 12;
    let heroY = bY + 12;

    for (let i = 0; i < 4; i++) {
        let tId = DB.data.towerTeam[i];
        let x = towerStartX + i * (towerSlotSize + towerGap);
        let y = towerY;
        let selected = this.selectedTowerId === tId;
        drawRoundedRect(ctx, x, y, towerSlotSize, towerSlotSize, 8, selected ? "#4CAF50" : "#333");

        if (tId) {
            let towerData = DB.data.towers.find(t => t.id === tId);
            if (towerData) {
                let shape = TOWER_SHAPES[Math.min(TOWER_SHAPES.length - 1, (towerData.stars || 1) - 1)];
                drawText(ctx, shape, x + towerSlotSize / 2, y + 35, "white", 40, "center");
                
                // Stars - max 5, ⭐ for 1-5, 🌟 for 6-10
                let displayStars = Math.min(towerData.stars || 1, 5);
                let starType = (towerData.stars || 1) > 5 ? "🌟" : "⭐";
                let starsDisplay = starType.repeat(displayStars);
                drawText(ctx, starsDisplay, x + towerSlotSize / 2, y + 55, "#FFD54F", 11, "center");
                
                // HP bar
                let tower = this.towers.find(t => t.id === tId);
                if (tower && !tower.dead) {
                    let barW = towerSlotSize - 20;
                    let barH = 8;
                    drawRect(ctx, x + 10, y + 80, barW, barH, "red");
                    drawRect(ctx, x + 10, y + 80, barW * (tower.hp / tower.maxHp), barH, "lime");
                    drawText(ctx, `Lv.${towerData.level}`, x + towerSlotSize / 2, y + 75, "yellow", 10, "center");
                } else {
                    drawText(ctx, `Lv.${towerData.level}`, x + towerSlotSize / 2, y + 75, "yellow", 10, "center");
                }
                
                if (this.builtTowerIds.has(tId)) drawText(ctx, "ĐÃ XUẤT", x + towerSlotSize / 2, y + 12, "#FF7043", 8, "center");
            }
        } else {
            drawText(ctx, "+", x + towerSlotSize / 2, y + 40, "#777", 40, "center");
        }

        if (Enjine.Mouse.Clicked &&
            Enjine.Mouse.X >= x && Enjine.Mouse.X <= x + towerSlotSize &&
            Enjine.Mouse.Y >= y && Enjine.Mouse.Y <= y + towerSlotSize) {
            Enjine.Mouse.Clicked = false;
            if (tId) {
                this.selectedTowerId = tId;
                this.selectedHeroId = null;
            }
        }
    }

    for (let i = 0; i < this.heroes.length; i++) {
        let h = this.heroes[i];
        let x = heroX + i * (heroSlot + heroGap);
        let y = heroY;
        drawRoundedRect(ctx, x, y, heroSlot, heroSlot, 8, this.selectedHeroId === h.id ? "#1E88E5" : "#333");
        drawText(ctx, h.icon || "🧙", x + heroSlot / 2, y + 35, "white", 40, "center");

        // Hero level and stats
        let hero = DB.data.heroes.find(hero => hero.id === h.id);
        if (hero) {
            // Stars - max 5, ⭐ for 1-5, 🌟 for 6-10
            let displayStars = Math.min(hero.stars || 1, 5);
            let starType = (hero.stars || 1) > 5 ? "🌟" : "⭐";
            let starsDisplay = starType.repeat(displayStars);
            drawText(ctx, starsDisplay, x + heroSlot / 2, y + 55, "#FFD54F", 11, "center");
            
            // HP bar
            let barW = heroSlot - 20;
            let barH = 8;
            drawRect(ctx, x + 10, y + 80, barW, barH, "red");
            drawRect(ctx, x + 10, y + 80, barW * (h.hp / h.maxHp), barH, "lime");
            
            drawText(ctx, `Lv.${hero.level}`, x + heroSlot / 2, y + 75, "yellow", 10, "center");
        }

        if (h.dead) {
            // Dark overlay for dead hero
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(x, y, heroSlot, heroSlot);
            ctx.restore();
            
            if (h.respawnTimer > 0) {
                drawText(ctx, `${Math.ceil(h.respawnTimer)}s`, x + heroSlot / 2, y + heroSlot / 2, "#FFCC80", 14, "center");
            } else {
                drawText(ctx, `💎${h.reviveCost}`, x + heroSlot / 2, y + heroSlot / 2, "#FFD54F", 11, "center");
            }
        }

        if (Enjine.Mouse.Clicked &&
            Enjine.Mouse.X >= x && Enjine.Mouse.X <= x + heroSlot &&
            Enjine.Mouse.Y >= y && Enjine.Mouse.Y <= y + heroSlot) {
            Enjine.Mouse.Clicked = false;
            if (h.dead) {
                if (h.respawnTimer <= 0 && this.mineral >= h.reviveCost) {
                    this.mineral -= h.reviveCost;
                    h.dead = false;
                    h.hp = h.maxHp;
                    this.setHeroTargetByClick(h, this.base.x, this.base.y);
                }
            } else {
                this.selectedHeroId = h.id;
                this.selectedTowerId = null;
            }
        }
    }
    
    if (this.showStartDialog) {
        drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.7)");
        let winW = 800, winH = 520;
        let winX = (GAME.Canvas.Width - winW) / 2;
        let winY = (GAME.Canvas.Height - winH) / 2;
        drawRoundedRect(ctx, winX, winY, winW, winH, 12, "#222");

        drawText(ctx, "CHUẨN BỊ THỦ THÀNH", winX + winW / 2, winY + 40, "white", 28, "center");
        drawText(ctx, "Mua bonus pack trước khi bắt đầu", winX + winW / 2, winY + 70, "#BBB", 16, "center");

        // Bonus packs - 3 buttons arranged horizontally
        let atkSelected = this.bonusPacks.atk;
        let spdSelected = this.bonusPacks.spd;
        let meteorSelected = this.bonusPacks.meteor;

        let bonusButtonW = 180;
        let bonusButtonH = 80;
        let bonusGap = 20;
        let bonusTotalW = 3 * bonusButtonW + 2 * bonusGap;
        let bonusStartX = winX + (winW - bonusTotalW) / 2;
        let bonusY = winY + 100;

        drawButton(ctx, `⚔️ Công +50%\n(100💎)${atkSelected ? "\n[ĐÃ CHỌN]" : ""}`, bonusStartX, bonusY, bonusButtonW, bonusButtonH, atkSelected ? "#5D4037" : "#555", () => {
            this.bonusPacks.atk = !this.bonusPacks.atk;
        }, "white", 12);
        drawButton(ctx, `⚡ Tốc đánh +50%\n(100💎)${spdSelected ? "\n[ĐÃ CHỌN]" : ""}`, bonusStartX + bonusButtonW + bonusGap, bonusY, bonusButtonW, bonusButtonH, spdSelected ? "#F57C00" : "#555", () => {
            this.bonusPacks.spd = !this.bonusPacks.spd;
        }, "white", 12);
        drawButton(ctx, `☄️ +1 Thiên thạch\n(100💎)${meteorSelected ? "\n[ĐÃ CHỌN]" : ""}`, bonusStartX + 2 * (bonusButtonW + bonusGap), bonusY, bonusButtonW, bonusButtonH, meteorSelected ? "#7B1FA2" : "#555", () => {
            this.bonusPacks.meteor = !this.bonusPacks.meteor;
        }, "white", 12);

        // Tower list display - show only deployed towers from towerTeam
        let towerListY = bonusY + bonusButtonH + 30;
        drawText(ctx, "DANH SÁCH CHÒI CANH", winX + winW / 2, towerListY, "#FFCC80", 16, "center");
        
        let deployedTowers = [];
        for (let i = 0; i < DB.data.towerTeam.length; i++) {
            if (DB.data.towerTeam[i]) {
                let tower = DB.data.towers.find(t => t.id === DB.data.towerTeam[i]);
                if (tower) {
                    deployedTowers.push({ tower, slotIndex: i });
                }
            }
        }

        let towerCard = 80;
        let towerCardGap = 15;
        let towerDisplayCount = deployedTowers.length;
        let towerListW = towerDisplayCount * towerCard + Math.max(0, towerDisplayCount - 1) * towerCardGap;
        let towerListX = winX + (winW - towerListW) / 2;
        let towerListDisplayY = towerListY + 15;

        for (let i = 0; i < deployedTowers.length; i++) {
            let { tower, slotIndex } = deployedTowers[i];
            let tx = towerListX + i * (towerCard + towerCardGap);
            let ty = towerListDisplayY;
            
            let shape = TOWER_SHAPES[Math.min(TOWER_SHAPES.length - 1, (tower.stars || 1) - 1)];
            
            drawRoundedRect(ctx, tx, ty, towerCard, towerCard, 8, "#333");
            drawText(ctx, shape, tx + towerCard / 2, ty + 40, "white", 32, "center");
            drawText(ctx, `Lv.${tower.level}`, tx + towerCard / 2, ty + 65, "yellow", 11, "center");
        }

        // Hero display
        let heroY = towerListDisplayY + towerCard + 45;
        drawText(ctx, "TƯỚNG HỖ TRỢ", winX + winW / 2, heroY - 15, "#FFCC80", 16, "center");
        let heroSlot = 80;
        let heroGap = 16;
        let heroRowW = 4 * heroSlot + 3 * heroGap;
        let heroStartX = winX + (winW - heroRowW) / 2;
        for (let i = 0; i < 4; i++) {
            let hx = heroStartX + i * (heroSlot + heroGap);
            let hy = heroY;
            drawRoundedRect(ctx, hx, hy, heroSlot, heroSlot, 8, "#333");
            let hId = DB.data.team[i];
            if (hId) {
                let hero = DB.data.heroes.find(h => h.id === hId);
                if (hero) {
                    let typeInfo = Object.values(CLASS_TYPES).find(t => t.id === hero.type);
                    drawText(ctx, typeInfo ? typeInfo.icon : "🧙", hx + heroSlot / 2, hy + 40, "white", 32, "center");
                    drawText(ctx, `Lv.${hero.level}`, hx + heroSlot / 2, hy + 68, "cyan", 11, "center");
                }
            } else {
                drawText(ctx, "-", hx + heroSlot / 2, hy + 42, "#777", 28, "center");
            }
        }

        drawButton(ctx, "BẮT ĐẦU", winX + winW / 2 - 125, winY + winH - 60, 115, 50, "#2196F3", () => {
            let cost = (this.bonusPacks.atk ? 100 : 0) + (this.bonusPacks.spd ? 100 : 0) + (this.bonusPacks.meteor ? 100 : 0);
            if (!DB.data.diamonds) DB.data.diamonds = 0;
            if (cost > 0 && DB.data.diamonds < cost) { addToast("Không đủ kim cương!", "#F44336"); return; }

            if (cost > 0) DB.data.diamonds -= cost;
            this.bonusBuff = {
                towerAtk: this.bonusPacks.atk ? 1.5 : 1,
                heroAtk: this.bonusPacks.atk ? 1.5 : 1,
                towerSpd: this.bonusPacks.spd ? 1.5 : 1,
                heroSpd: this.bonusPacks.spd ? 1.5 : 1
            };
            this.meteorCharges = this.bonusPacks.meteor ? 2 : 1;

            DB.data.towerTeam = [...this.tempTowerTeam];
            DB.save();
            this.showStartDialog = false;
        }, "white", 16);
        
        drawButton(ctx, "THOÁT", winX + winW / 2 + 10, winY + winH - 60, 115, 50, "#C62828", () => GAME.ChangeState(TowerDefenseStageSelectState), "white", 16);
    }

    if (this.gameOver) {
        drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.7)");
        let msg = this.win ? "CHIẾN THẮNG!" : "THẤT BẠI!";
        drawText(ctx, msg, GAME.Canvas.Width / 2, GAME.Canvas.Height / 2 - 40, this.win ? "#4CAF50" : "#F44336", 36, "center");
        drawText(ctx, `Vàng nhận: ${Math.floor(this.goldEarned)}`, GAME.Canvas.Width / 2, GAME.Canvas.Height / 2, "white", 18, "center");
        drawButton(ctx, "❮ Về Chọn Màn", GAME.Canvas.Width / 2 - 100, GAME.Canvas.Height / 2 + 40, 200, 50, "#555", () => GAME.ChangeState(TowerDefenseStageSelectState));
    }

    drawToasts(ctx);
    this.handleMapClick();
};
