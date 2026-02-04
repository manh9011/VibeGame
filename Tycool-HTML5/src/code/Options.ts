
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

export interface BuildingDef {
    id: string;
    name: string;
    icon: string;
    cost: Cost;
    desc: string;
    type: string;
    income?: number;
    capacity?: number;
    effect?: string;
    resource?: string;
    amount?: number;
    fame?: number;
    size?: number;
    spriteIndex?: number;
}

export const BUILDINGS_DB: Record<string, BuildingDef> = {
    house: { id: 'house', name: 'Nhà Dân', icon: '🏠', spriteIndex: 11, cost: { gold: 100, wood: 20 }, desc: '+2 Vàng/ngày, +5 Dân', type: 'economy', income: 2, capacity: 5 },
    tavern: { id: 'tavern', name: 'Quán Rượu', icon: '🍺', spriteIndex: 19, cost: { gold: 300, wood: 100, stone: 20 }, desc: 'Nơi thuê Anh Hùng', type: 'service', effect: 'recruit', size: 2 },
    blacksmith: { id: 'blacksmith', name: 'Lò Rèn', icon: '⚒️', spriteIndex: 12, cost: { gold: 500, wood: 150, stone: 100 }, desc: 'Sản xuất vũ khí', type: 'craft', effect: 'equip', size: 2 },
    market: { id: 'market', name: 'Chợ', icon: '🎪', spriteIndex: 7, cost: { gold: 800, wood: 300 }, desc: 'Giao thương tài nguyên', type: 'economy', effect: 'trade', size: 2 },
    woodcutter: { id: 'woodcutter', name: 'Trại Gỗ', icon: '🪓', spriteIndex: 10, cost: { gold: 150 }, desc: '+5 Gỗ/ngày. Tự động thu hoạch.', type: 'resource', resource: 'wood', amount: 5, size: 2 },
    quarry: { id: 'quarry', name: 'Mỏ Đá', icon: '⛏️', spriteIndex: 21, cost: { gold: 200, wood: 50 }, desc: '+3 Đá/ngày. Tự động thu hoạch.', type: 'resource', resource: 'stone', amount: 3, size: 2 },
    decoration: { id: 'decoration', name: 'Đài Phun Nước', icon: '⛲', spriteIndex: 13, cost: { gold: 100, stone: 50 }, desc: '+10 Danh tiếng', type: 'fame', fame: 10 }
};

export const SPRITE_MAP = {
    tree: [4, 5, 25, 27, 28, 31, 32, 33],
    hero: 34,
    villager: [34, 22], // Using knight and person sprites
    flower: 25,
    path: 28,
    rock: 32,
    water: 33
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
