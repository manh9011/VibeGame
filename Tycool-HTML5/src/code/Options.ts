
export const CONFIG = {
    tileWidth: 128,
    tileHeight: 64,
    mapSize: 16,
    tickRate: 1000,
    dayLength: 30,
    zoom: 1.5, // New Config for global scaling
};

export const BACKGROUND_CONFIG = {
    width: 2752,
    height: 1536,
    mapCenterX: 1376,
    mapCenterY: 270, // Intermediate guess, usage of debug keys recommended
};

export const FONTS = {
    main: "'Noto Sans', sans-serif",
    emoji: "'Noto Color Emoji', sans-serif",
    ui: "'Noto Sans', 'Noto Color Emoji', sans-serif"
};

export const SPRITE_CONFIG = {
    path: 'images/entity.png',
    gridSize: 6,
    sheetSize: 1024,
    get cellSize() { return this.sheetSize / this.gridSize; }
};

// Solid colors to prevent transparency issues
export const COLORS = {
    grass: { top: '#27ae6050', right: '#1e8449', left: '#196f3d' },
    water: { top: '#3498db', right: '#2980b9', left: '#2471a3' },
    // Bright highlight
    highlight: { top: '#f1c40f', border: '#fff' },
    error: { top: '#e74c3c', border: '#c0392b' }
};

export interface Cost {
    gold?: number;
    wood?: number;
    stone?: number;
}

// Config for Building Levels
export interface BuildingLevel {
    level: number;
    spriteIndex: number;
    cost: Cost;
    upgradeTime: number; // Seconds
    desc?: string; // Optional override description
    income?: number;
    capacity?: number; // Pop capacity
    fame?: number;
    resource?: string; // resource type produced
    amount?: number; // amount produced
    effect?: string; // special effect code
}

export interface BuildingConfig {
    id: string;
    name: string;
    type: string;
    size?: number;
    maxCount?: number;
    levels: BuildingLevel[];
}

export const BUILDINGS_DB: Record<string, BuildingConfig> = {
    house: {
        id: 'house', name: 'Nhà Dân', type: 'economy', maxCount: 20,
        levels: [
            { level: 1, spriteIndex: 18, cost: { gold: 100, wood: 20 }, upgradeTime: 0, desc: '+2 Vàng/ngày, +5 Dân', income: 2, capacity: 5 },
            { level: 2, spriteIndex: 19, cost: { gold: 200, wood: 50 }, upgradeTime: 10, desc: '+5 Vàng/ngày, +8 Dân', income: 5, capacity: 8 }
        ]
    },
    tavern: {
        id: 'tavern', name: 'Quán Rượu', type: 'service', size: 2,
        levels: [
            { level: 1, spriteIndex: 21, cost: { gold: 300, wood: 100, stone: 20 }, upgradeTime: 0, desc: 'Nơi thuê Anh Hùng', effect: 'recruit' },
            { level: 2, spriteIndex: 23, cost: { gold: 600, wood: 200, stone: 50 }, upgradeTime: 30, desc: 'Anh hùng xịn hơn (WIP)', effect: 'recruit' }
        ]
    },
    blacksmith: {
        id: 'blacksmith', name: 'Lò Rèn', type: 'craft', size: 2,
        levels: [
            { level: 1, spriteIndex: 15, cost: { gold: 500, wood: 150, stone: 100 }, upgradeTime: 0, desc: 'Sản xuất vũ khí', effect: 'equip' },
            { level: 2, spriteIndex: 16, cost: { gold: 1000, wood: 300, stone: 200 }, upgradeTime: 45, desc: 'Vũ khí cấp 2', effect: 'equip' },
            { level: 3, spriteIndex: 17, cost: { gold: 2000, wood: 600, stone: 400 }, upgradeTime: 90, desc: 'Vũ khí cấp 3', effect: 'equip' }
        ]
    },
    market: {
        id: 'market', name: 'Chợ', type: 'economy', size: 2,
        levels: [
            { level: 1, spriteIndex: 12, cost: { gold: 800, wood: 300 }, upgradeTime: 0, desc: 'Giao thương tài nguyên', effect: 'trade' },
            { level: 2, spriteIndex: 13, cost: { gold: 1500, wood: 600 }, upgradeTime: 60, desc: 'Giao thương tốt hơn', effect: 'trade' },
            { level: 3, spriteIndex: 14, cost: { gold: 3000, wood: 1200 }, upgradeTime: 120, desc: 'Thuế thấp (WIP)', effect: 'trade' }
        ]
    },
    woodcutter: {
        id: 'woodcutter', name: 'Trại Gỗ', type: 'resource', size: 2,
        levels: [
            { level: 1, spriteIndex: 1, cost: { gold: 150 }, upgradeTime: 0, desc: '+5 Gỗ/ngày', resource: 'wood', amount: 5 },
            { level: 2, spriteIndex: 2, cost: { gold: 450 }, upgradeTime: 0, desc: '+10 Gỗ/ngày', resource: 'wood', amount: 10 }
        ]
    },
    quarry: {
        id: 'quarry', name: 'Mỏ Đá', type: 'resource', size: 2,
        levels: [
            { level: 1, spriteIndex: 3, cost: { gold: 200, wood: 50 }, upgradeTime: 0, desc: '+3 Đá/ngày', resource: 'stone', amount: 3 },
            { level: 2, spriteIndex: 4, cost: { gold: 500, wood: 150 }, upgradeTime: 20, desc: '+6 Đá/ngày', resource: 'stone', amount: 6 }
        ]
    },
    decoration: {
        id: 'decoration', name: 'Nhà Anh Hùng', type: 'service', maxCount: 5,
        levels: [
            { level: 1, spriteIndex: 20, cost: { gold: 100, stone: 50 }, upgradeTime: 0, desc: 'Chỗ ở cho 1 anh hùng', fame: 10, capacity: 1 },
            { level: 2, spriteIndex: 21, cost: { gold: 300, stone: 150 }, upgradeTime: 15, desc: 'Hồi phục nhanh hơn', fame: 20, capacity: 1 }
        ]
    }
};

export const SPRITE_MAP = {
    hero: 26,
    villager: [24, 25],
    tree: [5, 6, 7, 8, 9, 10, 11]
};

export const QUESTS_DB = [
    { id: 1, name: 'Dọn dẹp hầm ngục', level: 1, duration: 5, risk: 0.2, reward: { gold: 100, fame: 5 }, req: { str: 5 } },
    { id: 2, name: 'Bảo vệ thương buôn', level: 2, duration: 10, risk: 0.4, reward: { gold: 300, fame: 15 }, req: { str: 10 } },
    { id: 3, name: 'Săn rồng lửa', level: 5, duration: 20, risk: 0.7, reward: { gold: 1000, fame: 100 }, req: { str: 25, int: 10 } },
    { id: 4, name: 'Tìm thảo dược', level: 1, duration: 5, risk: 0.1, reward: { wood: 50, fame: 2 }, req: { int: 5 } },
    { id: 5, name: 'Ngoại giao lân bang', level: 3, duration: 15, risk: 0.3, reward: { gold: 500, stone: 100, fame: 50 }, req: { int: 20 } },
];

export const HERO_CLASSES = [
    { name: 'Chiến Binh', icon: '⚔️', baseStr: 8, baseInt: 2 },
    { name: 'Pháp Sư', icon: '🔮', baseStr: 2, baseInt: 8 },
    { name: 'Đạo Tặc', icon: '🗡️', baseStr: 5, baseInt: 5 },
];

export const VILLAGER_ICONS = ['👨‍🌾', '👩‍🌾', '👷', '👩‍🔧', '💂', '👳', '👲', '🧙'];

export interface HeroRecruitData {
    id: number;
    name: string;
    class: string;
    icon: string;
    level: number;
    str: number;
    int: number;
    cost: number;
    status: 'idle' | 'questing';
}
