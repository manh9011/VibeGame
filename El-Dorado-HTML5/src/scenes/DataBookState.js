/**
 * --- DATABOOK STATE ---
 * Browse all hero classes, view stats, simulate builds, preview combat
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import {
    GAME,

    DB, CLASS_TYPES, ITEM_TYPES, RARITY
} from '../context.js';
import {
    drawGlobalHeader, drawButton, drawText, drawRect, drawRoundedRect,
    drawCircle, addToast, drawToasts
} from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';

export var DataBookState = new Enjine.GameState();

// Helper: Remove diacritics for search
function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Helper: Get all classes as array
function getAllClasses() {
    return Object.values(CLASS_TYPES);
}

// Helper: Draw radar chart
function drawRadarChart(ctx, stats, x, y, radius) {
    const statKeys = ['hp', 'atk', 'def', 'crit', 'eva', 'regen', 'spd', 'atkSpd'];
    const statLabels = ['HP', 'ATK', 'DEF', 'CRIT', 'EVA', 'REGEN', 'SPD', 'ATKSPD'];
    const count = statKeys.length;

    // Normalize stats to 0-1 range
    const maxValues = { hp: 500, atk: 200, def: 100, crit: 50, eva: 50, regen: 50, spd: 2, atkSpd: 3 };
    const normalized = statKeys.map(key => Math.min(stats[key] / maxValues[key], 1));

    // Draw background web
    ctx.save();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
        const r = radius * (i + 1) / 5;
        ctx.beginPath();
        for (let j = 0; j <= count; j++) {
            const angle = (Math.PI * 2 * j / count) - Math.PI / 2;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Draw axis lines
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        ctx.stroke();
    }

    // Draw stat polygon
    ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
    ctx.strokeStyle = '#0096FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= count; i++) {
        const idx = i % count;
        const angle = (Math.PI * 2 * idx / count) - Math.PI / 2;
        const r = normalized[idx] * radius;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) - Math.PI / 2;
        const labelRadius = radius + 15;
        const px = x + Math.cos(angle) * labelRadius;
        const py = y + Math.sin(angle) * labelRadius;
        ctx.fillText(statLabels[i], px, py + 3);
    }
    ctx.restore();
}

// Helper: Calculate stats for level/stars
function calculateSimulatedStats(classType, level, stars, equipment) {
    // Use config stats
    const s = classType.baseStats;
    const g = classType.growth;
    const r = classType.levelRate || { hp: 1.05, atk: 1.05, def: 1.02, regen: 1.05, spd: 1, atkSpd: 1 };

    // 1. Star Growth (Base)
    const st = stars - 1;
    let stats = {
        hp: s.hp + st * g.hp,
        atk: s.atk + st * g.atk,
        def: s.def + st * g.def,
        regen: s.regen + st * g.regen,
        spd: parseFloat((s.spd + st * g.spd).toFixed(2)),
        atkSpd: parseFloat((s.atkSpd + st * g.atkSpd).toFixed(2)),
        crit: s.crit,
        eva: s.eva
    };

    // 2. Level Scaling
    if (level > 1) {
        const lvl = level - 1;
        stats.hp = Math.floor(stats.hp * Math.pow(r.hp, lvl));
        stats.atk = Math.floor(stats.atk * Math.pow(r.atk, lvl));
        stats.def = Math.floor(stats.def * Math.pow(r.def, lvl));
        stats.regen = Math.floor(stats.regen * Math.pow(r.regen, lvl));
        if (r.spd !== 1) stats.spd = parseFloat((stats.spd * Math.pow(r.spd, lvl)).toFixed(2));
        if (r.atkSpd !== 1) stats.atkSpd = parseFloat((stats.atkSpd * Math.pow(r.atkSpd, lvl)).toFixed(2));
    }

    // Add equipment bonuses
    if (equipment) {
        for (let item of equipment) {
            if (item) {
                if (item.mainStat.type === 'hp') stats.hp += item.mainStat.val;
                else if (item.mainStat.type === 'atk') stats.atk += item.mainStat.val;
                else if (item.mainStat.type === 'def') stats.def += item.mainStat.val;
                else if (item.mainStat.type === 'spd') stats.spd += item.mainStat.val;
                else if (item.mainStat.type === 'atkSpd') stats.atkSpd += item.mainStat.val;

                if (item.subStat.type === 'hp') stats.hp += item.subStat.val;
                else if (item.subStat.type === 'atk') stats.atk += item.subStat.val;
                else if (item.subStat.type === 'def') stats.def += item.subStat.val;
                else if (item.subStat.type === 'crit') stats.crit += item.subStat.val;
                else if (item.subStat.type === 'eva') stats.eva += item.subStat.val;
                else if (item.subStat.type === 'regen') stats.regen += item.subStat.val;
                else if (item.subStat.type === 'spd') stats.spd += item.subStat.val;
                else if (item.subStat.type === 'atkSpd') stats.atkSpd += item.subStat.val;
            }
        }
    }

    return stats;
}

DataBookState.Enter = function () {
    this.selectedTab = 'all';
    this.selectedClass = getAllClasses()[0]; // First class by default
    this.searchText = '';
    this.gridScroll = 0;
    this.isSearching = false;

    // Simulator state
    this.simLevel = 200;
    this.simStars = 10;
    this.simEquipment = [null, null, null, null]; // 4 slots
    this.equipmentMenuOpen = -1; // -1 = none, 0-3 = slot index

    // Combat preview state
    this.showCombat = false;
    this.combatHero = null;
    this.combatDummy = null;
    this.combatProjectiles = [];
    this.combatTime = 0;
};

DataBookState.Draw = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.7)");
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    if (this.showCombat) {
        this.drawCombatPreview(ctx);
        return;
    }

    // Header
    drawText(ctx, "SỔ DỮ LIỆU", GAME.Canvas.Width / 2, 32, "white", 24, "center");

    // Back button
    drawButton(ctx, "❮ Trở về", 10, 70, 100, 30, "#555", () => GAME.ChangeState(MainMenuState));

    // Tabs
    const tabY = 70;
    const tabW = 150;
    const tabs = [
        { id: 'all', label: 'Tất cả' },
        { id: 'human', label: 'Con người' },
        { id: 'animal', label: 'Động vật' },
        { id: 'supernatural', label: 'Siêu nhiên' }
    ];

    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const x = 120 + i * (tabW + 10);
        const isActive = this.selectedTab === tab.id;
        drawButton(ctx, tab.label, x, tabY, tabW, 30, isActive ? "#0096FF" : "#444",
            () => { this.selectedTab = tab.id; this.gridScroll = 0; }, "white", 14);
    }

    // Layout: Grid on left (400px), Detail on right
    const gridX = 10;
    const gridY = 120;
    const gridW = 400;
    const gridH = GAME.Canvas.Height - 140;

    const detailX = gridX + gridW + 20;
    const detailY = gridY;
    const detailW = GAME.Canvas.Width - detailX - 10;
    const detailH = gridH;

    this.drawGrid(ctx, gridX, gridY, gridW, gridH);
    this.drawDetail(ctx, detailX, detailY, detailW, detailH);

    drawToasts(ctx);

    if (this.equipmentMenuOpen !== -1 && this.equipmentMenuOpen !== undefined) {
        this.drawEquipmentSelect(ctx);
    }
};

DataBookState.drawGrid = function (ctx, x, y, w, h) {
    // Background
    drawRoundedRect(ctx, x, y, w, h, 10, "#222");

    // Search box
    const searchH = 35;
    drawRoundedRect(ctx, x + 5, y + 5, w - 10, searchH, 5, "#333");
    drawText(ctx, this.searchText || "Search...", x + 15, y + 25, this.searchText ? "white" : "#888", 14, "left");

    // Click to activate search (simplified - just shows text, actual input would need HTML input overlay)
    if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= x + 5 && Enjine.Mouse.X <= x + w - 5 &&
        Enjine.Mouse.Y >= y + 5 && Enjine.Mouse.Y <= y + 5 + searchH) {
        // In production, show input field
        this.isSearching = !this.isSearching;
        Enjine.Mouse.Clicked = false;
    }

    // Grid area
    const gridStartY = y + searchH + 15;
    const gridAreaH = h - searchH - 20;

    // Filter classes
    let classes = getAllClasses();
    if (this.selectedTab !== 'all') {
        classes = classes.filter(c => c.category === this.selectedTab);
    }
    if (this.searchText) {
        const search = removeDiacritics(this.searchText);
        classes = classes.filter(c => removeDiacritics(c.name).includes(search));
    }

    // Grid: 2 columns
    const cols = 2;
    const cellW = (w - 50) / cols;
    const cellH = 60;
    const maxVisible = Math.floor(gridAreaH / cellH);
    const maxScroll = Math.max(0, Math.ceil(classes.length / cols) - maxVisible);

    // Scroll buttons - position inside grid area to avoid overlap
    const scrollBtnW = 30;
    const scrollBtnH = 30;
    const scrollBtnX = x + w - scrollBtnW - 10;
    const btnUpY = gridStartY + 5;
    const btnDownY = y + h - scrollBtnH - 15;

    if (this.gridScroll > 0) {
        drawButton(ctx, "▲", scrollBtnX, btnUpY, scrollBtnW, scrollBtnH, "#555", () => this.gridScroll--);
    }
    if (this.gridScroll < maxScroll) {
        drawButton(ctx, "▼", scrollBtnX, btnDownY, scrollBtnW, scrollBtnH, "#555", () => this.gridScroll++);
    }

    // Scroll Indicator
    if (maxScroll > 0) {
        const trackTop = btnUpY + scrollBtnH + 10;
        const trackBottom = btnDownY - 10;
        const trackH = trackBottom - trackTop;
        const trackX = scrollBtnX + scrollBtnW / 2;

        // Track
        drawRect(ctx, trackX - 2, trackTop, 4, trackH, "#222");

        // Handle
        const ratio = this.gridScroll / maxScroll;
        const handleY = trackTop + ratio * trackH;
        drawCircle(ctx, trackX, handleY, 12, "#555"); // Yellow Dot
    }

    // Draw grid items
    const startIdx = this.gridScroll * cols;
    const endIdx = Math.min(classes.length, startIdx + maxVisible * cols);

    for (let i = startIdx; i < endIdx; i++) {
        const classType = classes[i];
        const row = Math.floor((i - startIdx) / cols);
        const col = (i - startIdx) % cols;

        const cellX = x + 10 + col * cellW;
        const cellY = gridStartY + row * cellH;

        const isSelected = this.selectedClass && this.selectedClass.id === classType.id;

        // Cell background
        drawRoundedRect(ctx, cellX, cellY, cellW - 5, cellH - 5, 5, isSelected ? "#0096FF" : "#333");

        // Icon
        drawText(ctx, classType.icon, cellX + 25, cellY + 35, "white", 40, "center");

        // Name
        drawText(ctx, classType.name, cellX + 55, cellY + 20, "white", 12, "left");
        drawText(ctx, `ID: ${classType.id}`, cellX + 55, cellY + 35, "#AAA", 10, "left");

        // Click handler
        if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= cellX && Enjine.Mouse.X <= cellX + cellW - 5 &&
            Enjine.Mouse.Y >= cellY && Enjine.Mouse.Y <= cellY + cellH - 5) {
            this.selectedClass = classType;
            Enjine.Mouse.Clicked = false;
        }
    }
};

DataBookState.drawDetail = function (ctx, x, y, w, h) {
    if (!this.selectedClass) return;

    const c = this.selectedClass;

    // Background Panel
    drawRoundedRect(ctx, x, y, w, h, 10, "#222");

    // Header Area
    drawText(ctx, c.icon, x + 60, y + 60, "white", 70, "center");
    drawText(ctx, c.name.toUpperCase(), x + 120, y + 40, "#FFD700", 26, "left");
    drawText(ctx, `Mô tả: ${c.desc}\nLoại: ${c.category?.toUpperCase()}`, x + 120, y + 70, "#AAA", 14, "left");

    // Divider
    drawRect(ctx, x + 20, y + 100, w - 40, 2, "#444");

    // --- Two Column Layout ---
    const col2X = x + w * 0.45; // Split at 45% width
    const contentY = y + 120;

    // === LEFT COLUMN: Controls & Base Stats ===
    let leftY = contentY;

    // 1. Base Stats
    drawText(ctx, "Thuộc tính ban đầu", x + 20, leftY, "#00FF00", 16, "left");
    leftY += 25;
    const baseStats = calculateSimulatedStats(c, 1, 1, null);
    const statLabels = [
        `HP: ${baseStats.hp}`, `ATK: ${baseStats.atk}`,
        `DEF: ${baseStats.def}`, `CRIT: ${baseStats.crit}%`,
        `EVA: ${baseStats.eva}%`, `REGEN: ${baseStats.regen}`,
        `SPD: ${Math.round(baseStats.spd * 100)}%`, `ASPD: ${Math.round(baseStats.atkSpd * 100)}%`
    ];
    for (let i = 0; i < statLabels.length; i++) {
        drawText(ctx, statLabels[i], x + 20 + (i % 2) * 140, leftY + Math.floor(i / 2) * 20, "#DDD", 13, "left");
    }
    leftY += 100;

    // 2. Build Simulator
    drawText(ctx, "Thử nghiệm", x + 20, leftY, "#FF9800", 16, "left");
    leftY += 30;

    // Sliders
    drawText(ctx, `Cấp: ${this.simLevel}`, x + 20, leftY + 5, "white", 14, "left");
    this.drawSlider(ctx, x + 100, leftY - 8, 200, 20, 1, 200, this.simLevel, (val) => this.simLevel = val);
    leftY += 50;

    drawText(ctx, `Sao: ${this.simStars} ⭐`, x + 20, leftY + 5, "yellow", 14, "left");
    this.drawSlider(ctx, x + 100, leftY - 8, 200, 20, 1, 10, this.simStars, (val) => this.simStars = val);
    leftY += 60;

    // Equipment
    drawText(ctx, "Vật phẩm:", x + 20, leftY, "white", 14, "left");
    leftY += 25;
    const slotNames = ['⚔️ Kiếm', '🛡️ Khiên', '👢 Giày', '⌚ Đồng hồ'];
    for (let i = 0; i < 4; i++) {
        const eq = this.simEquipment[i];
        const label = eq ? `${eq.type}: ${eq.rarity}` : slotNames[i];
        const btnX = x + 20 + (i % 2) * 160;
        const btnY = leftY + Math.floor(i / 2) * 45;
        drawButton(ctx, label, btnX, btnY, 150, 35, eq ? "#555" : "#333",
            () => this.equipmentMenuOpen = this.equipmentMenuOpen === i ? -1 : i, "white", 12);
    }

    // === RIGHT COLUMN: Visualization ===
    let rightY = contentY;
    const rightCenter = col2X + (w - (col2X - x)) / 2;

    // Radar Chart - Larger & Centered
    drawText(ctx, "Tăng trưởng", rightCenter, rightY, "#00FFFF", 16, "center");
    const simStats = calculateSimulatedStats(c, this.simLevel, this.simStars, this.simEquipment);
    // Draw chart with larger radius (120)
    drawRadarChart(ctx, simStats, rightCenter, rightY + 140, 120);
    rightY += 270;

    // Simulated Stats Summary
    drawText(ctx, "Thuộc tính", col2X + 40, rightY, "#0F0", 16, "left");
    rightY += 30;

    const finalStats = [
        `HP: ${Math.round(simStats.hp)}`, `ATK: ${Math.round(simStats.atk)}`,
        `DEF: ${Math.round(simStats.def)}`, `CRIT: ${Math.round(simStats.crit)}%`,
        `EVA: ${Math.round(simStats.eva)}%`, `DPS: ${Math.round(simStats.atk * simStats.atkSpd)}`
    ];
    for (let i = 0; i < finalStats.length; i++) {
        // Larger font list
        drawText(ctx, finalStats[i], col2X + 40 + (i % 2) * 200, rightY + Math.floor(i / 2) * 30, "#0F0", 18, "left");
    }

    // Combat Button
    drawButton(ctx, "⚔️ ĐÁNH THỬ", rightCenter - 100, y + h - 80, 200, 50, "#C00",
        () => { this.showCombat = true; this.initCombat(); }, "white", 18);
};

DataBookState.drawSlider = function (ctx, x, y, w, h, min, max, value, callback) {
    // Background
    drawRect(ctx, x, y, w, h, "#333");

    // Fill
    const fillW = ((value - min) / (max - min)) * w;
    drawRect(ctx, x, y, fillW, h, "#0096FF");

    // Handle
    const handleX = x + fillW;
    drawRect(ctx, handleX - 3, y - 2, 6, h + 4, "#FFF");

    // Click to adjust
    if (Enjine.Mouse.Down && Enjine.Mouse.X >= x && Enjine.Mouse.X <= x + w &&
        Enjine.Mouse.Y >= y - 5 && Enjine.Mouse.Y <= y + h + 5) {
        const ratio = (Enjine.Mouse.X - x) / w;
        const newVal = Math.round(min + ratio * (max - min));
        callback(Math.max(min, Math.min(max, newVal)));
    }
};
DataBookState.initCombat = function () {
    this.combatTime = 0;
    this.combatProjectiles = [];

    const stats = calculateSimulatedStats(this.selectedClass, this.simLevel, this.simStars, this.simEquipment);

    this.combatHero = {
        x: 100,
        y: GAME.Canvas.Height - 200,
        targetX: GAME.Canvas.Width / 2 - 150,
        hp: stats.hp,
        maxHp: stats.hp,
        atk: stats.atk,
        spd: stats.spd * 50, // Movement speed
        atkSpd: stats.atkSpd,
        range: this.selectedClass.id === 0 || this.selectedClass.id === 2 ? 300 : 50,
        state: 'move',
        atkCD: 0,
        class: this.selectedClass
    };

    this.combatDummy = {
        x: GAME.Canvas.Width - 150,
        y: GAME.Canvas.Height - 200,
        hp: 999999,
        maxHp: 999999,
        w: 60,
        h: 80,
        def: 0 // Default dummy defense
    };
};

DataBookState.drawCombatPreview = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.8)");

    drawText(ctx, "COMBAT PREVIEW", GAME.Canvas.Width / 2, 30, "#FFD700", 24, "center");

    // Ground
    const groundY = GAME.Canvas.Height - 100;
    drawRect(ctx, 0, groundY, GAME.Canvas.Width, 100, "#654321");

    // Dummy
    if (this.combatDummy) {
        const d = this.combatDummy;
        drawRoundedRect(ctx, d.x - d.w / 2, d.y - d.h, d.w, d.h, 5, "#666");
        drawText(ctx, "🎯", d.x, d.y - d.h / 2, "white", 40, "center");
        drawText(ctx, "DUMMY", d.x, d.y - d.h - 10, "white", 12, "center");
    }

    // Hero
    if (this.combatHero) {
        const h = this.combatHero;
        drawText(ctx, h.class.icon, h.x, h.y, "white", 60, "center");

        // HP bar
        const hpW = 100;
        const hpH = 8;
        const hpRatio = h.hp / h.maxHp;
        drawRect(ctx, h.x - hpW / 2, h.y - 50, hpW, hpH, "#333");
        drawRect(ctx, h.x - hpW / 2, h.y - 50, hpW * hpRatio, hpH, "#0F0");
    }

    // Projectiles
    for (let p of this.combatProjectiles) {
        drawCircle(ctx, p.x, p.y, 5, "#FFD700");
    }

    // Buttons
    drawButton(ctx, "Tấn công", 20, GAME.Canvas.Height - 70, 100, 40, "#C00",
        () => this.triggerAttack(), "white", 14);

    drawButton(ctx, "Làm lại", 140, GAME.Canvas.Height - 70, 100, 40, "#555",
        () => this.initCombat(), "white", 14);

    drawButton(ctx, "❮ Trờ về", GAME.Canvas.Width - 120, GAME.Canvas.Height - 70, 100, 40, "#555",
        () => this.showCombat = false, "white", 14);

    drawToasts(ctx);
};

DataBookState.generateSimItem = function (typeIdx, rarityKey) {
    const types = ['SWORD', 'SHIELD', 'BOOTS', 'WATCH'];
    const typeKey = types[typeIdx];
    const typeData = ITEM_TYPES[typeKey];
    const rData = RARITY[rarityKey];

    let mainVal = 0;
    if (typeKey === 'SWORD') mainVal = Math.round(10 * rData.mult);
    if (typeKey === 'SHIELD') mainVal = Math.round(5 * rData.mult);
    if (typeKey === 'BOOTS') mainVal = parseFloat((0.02 * rData.mult).toFixed(2));
    if (typeKey === 'WATCH') mainVal = parseFloat((0.02 * rData.mult).toFixed(2));

    return {
        type: typeData.name,
        rarity: rData.name,
        mainStat: { type: typeData.mainStat, val: mainVal },
        subStat: { type: 'hp', val: 0 }
    };
};

DataBookState.drawEquipmentSelect = function (ctx) {
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.7)");
    const w = 500, h = 300;
    const x = (GAME.Canvas.Width - w) / 2, y = (GAME.Canvas.Height - h) / 2;

    drawRoundedRect(ctx, x, y, w, h, 15, "#222");
    ctx.strokeStyle = "#00FFFF"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);

    const slotNames = ['⚔️ Kiếm', '🛡️ Khiên', '👢 Giày', '⌚ Đồng hồ'];
    drawText(ctx, `Chọn ${slotNames[this.equipmentMenuOpen].toUpperCase()}`, x + w / 2, y + 30, "white", 20, "center");

    drawButton(ctx, "Bỏ", x + w / 2 - 50, y + 55, 100, 25, "#C00", () => {
        this.simEquipment[this.equipmentMenuOpen] = null;
        this.equipmentMenuOpen = -1;
    }, "white", 12);

    const rKeys = Object.keys(RARITY);
    let sx = x + 25, sy = y + 100;
    for (let i = 0; i < rKeys.length; i++) {
        const k = rKeys[i];
        const r = RARITY[k];
        const bx = sx + (i % 5) * 95;
        const by = sy + Math.floor(i / 5) * 60;
        drawButton(ctx, k, bx, by, 80, 40, r.color, () => {
            this.simEquipment[this.equipmentMenuOpen] = this.generateSimItem(this.equipmentMenuOpen, k);
            this.equipmentMenuOpen = -1;
        }, "black", 14);
    }

    // Close on click outside
    if (Enjine.Mouse.Clicked && (Enjine.Mouse.X < x || Enjine.Mouse.X > x + w || Enjine.Mouse.Y < y || Enjine.Mouse.Y > y + h)) {
        this.equipmentMenuOpen = -1;
        Enjine.Mouse.Clicked = false;
    }
};

DataBookState.triggerAttack = function () {
    if (!this.combatHero || this.combatHero.atkCD > 0) return;

    const h = this.combatHero;
    const d = this.combatDummy;

    // Fire projectile
    if (h.range > 100) {
        this.combatProjectiles.push({
            x: h.x,
            y: h.y - 20,
            targetX: d.x,
            targetY: d.y - 40,
            dmg: h.atk,
            timer: 0,
            speed: 1.5
        });
    } else {
        // Melee - instant damage
        let dmg = h.atk * (100 / (100 + (d.def || 0)));
        dmg = Math.floor(dmg);
        // User reported "negative damage", likely referring to the "-" prefix being confusing or some calculation error.
        // We will show just the number in Red to imply damage.
        addToast(`${dmg}`, "#FF0000");
    }

    h.atkCD = 1 / h.atkSpd;
};

DataBookState.Update = function (dt) {
    if (!this.showCombat) return;

    this.combatTime += dt;

    const h = this.combatHero;
    const d = this.combatDummy;

    if (!h || !d) return;

    // Update hero
    if (h.atkCD > 0) h.atkCD -= dt;

    if (h.state === 'move') {
        const dist = Math.abs(h.x - h.targetX);
        if (dist > h.range) {
            h.x += h.spd * dt;
        } else {
            h.state = 'attack';
        }
    }

    // Update projectiles
    for (let i = this.combatProjectiles.length - 1; i >= 0; i--) {
        const p = this.combatProjectiles[i];
        p.timer += dt * p.speed;

        if (p.timer >= 1) {
            let finalDmg = Math.floor(p.dmg * (100 / (100 + (d.def || 0))));
            addToast(`${finalDmg}`, "#FF0000");
            this.combatProjectiles.splice(i, 1);
        } else {
            p.x = h.x + (p.targetX - h.x) * p.timer;
            p.y = h.y - 20 + (p.targetY - (h.y - 20)) * p.timer;
        }
    }
};
