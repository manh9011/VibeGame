/**
 * --- UPGRADE BASE STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB } from '../context.js';
import { drawGlobalHeader, drawText, drawButton, drawRect, drawRoundedRect } from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';
import { SPELL_TYPES } from '../data/dataManager.js';

export var UpgradeBaseState = new Enjine.GameState();

UpgradeBaseState.Enter = function () {
    this.currentTab = 0;
    this.scrollY = 0;
    this.maxScrollY = 0;
    this.isDragging = false;
    this.lastMouseY = 0;

    this.showKeyDialog = false;
    this.targetSpellId = null;
};

UpgradeBaseState.Update = function () {
    if (this.showKeyDialog) return; // Block input if dialog open

    // Scrolling Logic
    if (this.currentTab === 1) { // Only scroll spell tab
        if (Enjine.Mouse.IsDown) {
            if (!this.isDragging) {
                this.isDragging = true;
                this.lastMouseY = Enjine.Mouse.Y;
            } else {
                let diff = Enjine.Mouse.Y - this.lastMouseY;
                this.scrollY += diff;
                this.lastMouseY = Enjine.Mouse.Y;

                // Clamp
                if (this.scrollY > 0) this.scrollY = 0;
                if (this.scrollY < -this.maxScrollY) this.scrollY = -this.maxScrollY;
            }
        } else {
            this.isDragging = false;
        }
    }
};

UpgradeBaseState.Draw = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.6)"); // Overlay
    drawGlobalHeader(ctx, GAME.Canvas.Width);
    drawText(ctx, "NÂNG CẤP NHÀ CHÍNH", GAME.Canvas.Width / 2, 35, "white", 30, "center");
    drawButton(ctx, "❮ Về Menu", 10, 70, 100, 30, "#555", () => GAME.ChangeState(MainMenuState));

    // Base Stats
    // Tabs
    let tabW = 150, tabH = 40, tabY = 120;
    if (this.currentTab === undefined) this.currentTab = 0; // 0: Stats, 1: Spells

    drawButton(ctx, "CHỈ SỐ", GAME.Canvas.Width / 2 - tabW - 10, tabY, tabW, tabH, this.currentTab === 0 ? "#FF9800" : "#444", () => this.currentTab = 0);
    drawButton(ctx, "KỸ NĂNG", GAME.Canvas.Width / 2 + 10, tabY, tabW, tabH, this.currentTab === 1 ? "#9C27B0" : "#444", () => this.currentTab = 1);

    if (this.currentTab === 0) {
        // --- BASE STATS ---
        let startY = 180;
        let col1X = 100;

        const stats = [
            { key: 'hpLvl', name: 'Máu Nhà', cost: 100 },
            { key: 'atkLvl', name: 'Tấn Công', cost: 100 },
            { key: 'defLvl', name: 'Phòng Thủ', cost: 100 },
            { key: 'minMaxLvl', name: 'Khoáng Tối Đa', cost: 100 },
            { key: 'minRateLvl', name: 'Tốc Độ Khoáng', cost: 100 }
        ];

        stats.forEach((s, index) => {
            let y = startY + index * 70;
            let lvl = DB.data.baseStats[s.key];
            let price = s.cost * lvl;

            let subText = "";
            if (s.key === 'hpLvl') subText = `Hiện tại: ${(lvl * 1000).toLocaleString()} HP (+1,000)`;
            else if (s.key === 'atkLvl') subText = `Hiện tại: Lv.${lvl}`;
            else if (s.key === 'defLvl') subText = `Hiện tại: Lv.${lvl}`;
            else if (s.key === 'minMaxLvl') subText = `Max: ${(300 + lvl * 100).toLocaleString()} (+100)`;
            else if (s.key === 'minRateLvl') subText = `Tốc độ: ${(1 + lvl * 0.1).toFixed(1)}x (+10%)`;

            drawText(ctx, `${s.name} (Lv.${lvl})`, col1X, y + 20, "white", 20);
            drawText(ctx, subText, col1X, y + 42, "#AAA", 14); // Smaller subtext

            drawText(ctx, `Giá: ${price}`, col1X + 250, y + 30, "yellow", 18);

            if (lvl < 100) {
                drawButton(ctx, "NÂNG (+)", col1X + 400, y, 100, 40, DB.data.gold >= price ? "#4CAF50" : "#555", () => {
                    if (DB.data.gold >= price) {
                        DB.data.gold -= price;
                        DB.data.baseStats[s.key]++;
                        DB.save();
                    }
                });
            } else {
                drawText(ctx, "MAX", col1X + 440, y + 30, "red", 20, "center");
            }
        });

        // --- LIMITS (Right Column) ---
        let col2X = GAME.Canvas.Width / 2 + 50;

        const drawLimit = (name, current, max, cost, level, key, upgradeFunc, idx) => {
            let y = startY + idx * 90;
            drawText(ctx, name, col2X, y + 20, "#FFD700", 22);
            drawText(ctx, `Hiện tại: ${current} / ${max}`, col2X, y + 45, "white", 18);

            if (current < max) {
                drawText(ctx, `Giá: ${cost}`, col2X + 250, y + 45, "yellow", 18);
                drawButton(ctx, "NÂNG CẤP", col2X + 400, y + 10, 120, 40, DB.data.gold >= cost ? "#2196F3" : "#555", () => {
                    if (upgradeFunc.call(DB)) { }
                });
            } else {
                drawText(ctx, "TỐI ĐA", col2X + 400, y + 35, "red", 20, "center");
            }
        };

        let unitCost = 10000 * Math.pow(2, DB.data.limitLevels.unit);
        drawLimit("Giới Hạn Quân", DB.data.limitUnits, 20, unitCost, DB.data.limitLevels.unit, 'unit', DB.upgradeUnitLimit, 0);

        let heroStep = (DB.data.limitHeroes - 30) / 5;
        let heroCost = 5000 + heroStep * 1000;
        drawLimit("Kho Heroes", DB.data.limitHeroes, 100, heroCost, DB.data.limitLevels.hero, 'hero', DB.upgradeHeroLimit, 1);

        let itemStep = (DB.data.limitItems - 30) / 5;
        let itemCost = 5000 + itemStep * 1000;
        drawLimit("Kho Items", DB.data.limitItems, 100, itemCost, DB.data.limitLevels.item, 'item', DB.upgradeItemLimit, 2);

    } else {
        // --- SPELLS (Two Columns with Scroll) ---
        let startY = 180 + this.scrollY;

        // --- DRAW TABLE WITH SCROLL CLIPPING ---
        let spells = Object.values(SPELL_TYPES);
        let itemH = 100;
        let colW = (GAME.Canvas.Width - 50) / 2;
        let startX1 = 20;
        let startX2 = 30 + colW;

        // Calculate max scroll
        let rows = Math.ceil(spells.length / 2);
        let totalH = rows * (itemH + 10);
        let visibleH = GAME.Canvas.Height - 180;
        this.maxScrollY = Math.max(0, totalH - visibleH + 50);

        // Clip area for scrolling
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 170, GAME.Canvas.Width, GAME.Canvas.Height - 170);
        ctx.clip();

        spells.forEach((spell, idx) => {
            let col = idx % 2;
            let row = Math.floor(idx / 2);
            let x = col === 0 ? startX1 : startX2;
            let y = startY + row * (itemH + 10);

            // Draw Item Box
            drawRect(ctx, x, y, colW, itemH, "rgba(0,0,0,0.5)");

            let lvl = DB.data.spells[spell.id] || 0;
            let cost = (lvl + 1) * 500;

            // Icon
            drawText(ctx, spell.icon, x + 40, y + itemH / 2 + 10, "white", 35, "center");

            // Name & Level
            drawText(ctx, `${spell.name} (Lv.${lvl})`, x + 80, y + 30, "#FFD700", 18);

            // Dynamic Description
            let desc = spell.desc;
            if (spell.id === 0) desc = `Hồi ${100 * (lvl || 1)} HP/s (5s)`;
            if (spell.id === 1) desc = `Hồi ${50 * (lvl || 1)} HP/s. Tồn tại ${5 + (lvl || 1)}s`;
            if (spell.id === 2) desc = `Thần bảo vệ (HP:${2000 * (lvl || 1)}). Tồn tại ${5 + (lvl || 1)}s`;
            if (spell.id === 3) desc = `Tường chắn (HP:${5000 * (lvl || 1)}). Tồn tại ${5 + (lvl || 1)}s`;
            if (spell.id === 4) desc = `Đóng băng: ${5 + ((lvl > 0 ? lvl - 1 : 0)) * 0.5}s`;
            if (spell.id === 5) {
                let p = 5 + ((lvl > 0 ? lvl - 1 : 0));
                desc = `Độc: -${p}% HP trong 5s`;
            }
            if (spell.id === 6) {
                let dur = 5 + ((lvl > 0 ? lvl - 1 : 0));
                desc = `+100% Tốc đánh (${dur}s)`;
            }
            if (spell.id === 7) {
                let dur = 5 + ((lvl > 0 ? lvl - 1 : 0));
                desc = `+100% Tấn công (${dur}s)`;
            }

            drawText(ctx, desc, x + 80, y + 55, "#CCC", 12);

            // Upgrade Button
            if (lvl < 20) {
                drawText(ctx, `Giá: ${cost}`, x + colW - 140, y + 30, "yellow", 14);
                drawButton(ctx, "NÂNG", x + colW - 80, y + 10, 60, 30, DB.data.gold >= cost ? "#9C27B0" : "#555", () => {
                    if (!this.showKeyDialog) DB.upgradeSpell(spell.id);
                }, "white", 12);
            } else {
                drawText(ctx, "MAX", x + colW - 60, y + 30, "red", 16, "center");
            }

            // Key Binding Button
            if (!DB.data.spellSlots) DB.data.spellSlots = [0, 1, 2, 3, 4, 5];
            let assignedKeyIndex = DB.data.spellSlots.indexOf(spell.id);
            let keyLabel = "Gán Phím";
            if (assignedKeyIndex !== -1) {
                let k = assignedKeyIndex + 5;
                if (k === 10) k = 0;
                keyLabel = `Phím: ${k}`;
            }

            drawButton(ctx, keyLabel, x + colW - 80, y + 50, 60, 30, assignedKeyIndex !== -1 ? "#E65100" : "#555", () => {
                if (!this.showKeyDialog) {
                    this.showKeyDialog = true;
                    this.targetSpellId = spell.id;
                }
            }, "white", 12);

        });

        ctx.restore(); // End Clip

        // --- KEY BINDING DIALOG ---
        if (this.showKeyDialog) {
            drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.8)"); // Dim bg

            let dw = 400, dh = 300;
            let dx = (GAME.Canvas.Width - dw) / 2;
            let dy = (GAME.Canvas.Height - dh) / 2;

            drawRoundedRect(ctx, dx, dy, dw, dh, 10, "#333");
            drawText(ctx, "CHỌN PHÍM CẦN GÁN", dx + dw / 2, dy + 40, "white", 24, "center");

            // Spell Name
            let targetSpell = Object.values(SPELL_TYPES).find(s => s.id === this.targetSpellId);
            if (targetSpell) {
                drawText(ctx, targetSpell.name, dx + dw / 2, dy + 70, "#FFD700", 18, "center");
            }

            // Keys 5,6,7, 8,9,0 layout
            let keys = [5, 6, 7, 8, 9, 0];
            keys.forEach((k, idx) => {
                // Check if occupied
                let slotIdx = (k === 0) ? 5 : k - 5;
                let occupierId = DB.data.spellSlots[slotIdx];
                let occupierName = occupierId !== null && occupierId !== undefined ? SPELL_TYPES[occupierId]?.name : "-- Trống --";
                if (occupierId === this.targetSpellId) occupierName = "[Đang chọn]";

                let col = idx % 3;
                let row = Math.floor(idx / 3);

                let kx = dx + 35 + col * 115;
                let ky = dy + 100 + row * 80;

                drawButton(ctx, `${k}\n${occupierName}`, kx, ky, 100, 60, occupierId === this.targetSpellId ? "#4CAF50" : "#555", () => {
                    // Assign logic
                    // Remove from old slot
                    let oldSlot = DB.data.spellSlots.indexOf(this.targetSpellId);
                    if (oldSlot !== -1) DB.data.spellSlots[oldSlot] = null;

                    // Assign to new slot (overwrite)
                    DB.data.spellSlots[slotIdx] = this.targetSpellId;
                    DB.save();

                    this.showKeyDialog = false;
                    this.targetSpellId = null;
                }, "white", 12);
            });

            // Cancel / Unassign
            drawButton(ctx, "Hủy Bỏ", dx + dw / 2 - 110, dy + 250, 100, 30, "#F44336", () => {
                this.showKeyDialog = false;
                this.targetSpellId = null;
            });

            drawButton(ctx, "Gỡ Phím", dx + dw / 2 + 10, dy + 250, 100, 30, "#FF9800", () => {
                let oldSlot = DB.data.spellSlots.indexOf(this.targetSpellId);
                if (oldSlot !== -1) DB.data.spellSlots[oldSlot] = null;
                DB.save();
                this.showKeyDialog = false;
                this.targetSpellId = null;
            });
        }
    }

};
