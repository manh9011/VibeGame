/**
 * --- SHOP STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, ITEM_TYPES, RARITY } from '../context.js';
import { drawGlobalHeader, drawButton, drawText, drawRoundedRect, addToast, drawToasts, drawItemIcon, drawRoundedStroke } from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';

export var ShopState = new Enjine.GameState();

ShopState.currentTab = 0; // 0: Weapon, 1: Shield, 2: Boots, 3: Watch
ShopState.scroll = 0;

ShopState.Enter = function () {
    this.currentTab = 0;
    this.scroll = 0;
};

ShopState.Draw = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);

    // Draw Header
    drawGlobalHeader(ctx, GAME.Canvas.Width);
    drawText(ctx, "CỬA HÀNG TRANG BỊ", GAME.Canvas.Width / 2, 32, "white", 24, "center");

    // Back Button
    drawButton(ctx, "❮ Về Menu", 20, 70, 100, 30, "#555", () => GAME.ChangeState(MainMenuState));

    // --- TABS ---
    let tabW = 120, tabH = 40, startTabX = 50, tabY = 120;
    let tabGap = 10;
    // Center tabs
    let totalTabW = 4 * tabW + 3 * tabGap;
    startTabX = (GAME.Canvas.Width - totalTabW) / 2;

    Object.values(ITEM_TYPES).forEach((t, i) => {
        let isSelected = this.currentTab === t.id;
        drawRoundedStroke(ctx, startTabX + i * (tabW + tabGap), tabY, tabW, tabH, 10, "#444", 5);
        drawButton(ctx, `${t.icon} ${t.name}`, startTabX + i * (tabW + tabGap), tabY, tabW, tabH, isSelected ? "#FF9800" : "#444", () => {
            this.currentTab = t.id;
            this.scroll = 0;
        });
    });

    // --- SHOP CONTENT ---
    let contentY = 180;
    let contentH = GAME.Canvas.Height - 200;
    let contentW = GAME.Canvas.Width - 100;
    let contentX = 50;

    // Ordered Rarities
    const rarities = Object.values(RARITY).sort((a, b) => a.id - b.id);

    // Grid Layout
    let cols = 5;
    let slotW = 180;
    let slotH = 230; // Taller for price button and more spacing
    let gapX = 30;
    let gapY = 30;

    let totalRowW = cols * slotW + (cols - 1) * gapX;
    let startX = (GAME.Canvas.Width - totalRowW) / 2;

    rarities.forEach((r, i) => {
        let col = i % cols;
        let row = Math.floor(i / cols);
        let x = startX + col * (slotW + gapX);
        let y = contentY + row * (slotH + gapY);

        // Background
        drawRoundedRect(ctx, x, y, slotW, slotH, 10, r.color);
        drawRoundedRect(ctx, x, y, slotW, slotH, 10, "rgba(0,0,0,0.5)");
        drawRoundedStroke(ctx, x, y, slotW, slotH, 10, "#444", 5);

        // Icon Area
        let iconSize = 80;
        let iconX = x + (slotW - iconSize) / 2;
        let iconY = y + 20;

        // Simulate an item for display
        let typeData = Object.values(ITEM_TYPES).find(t => t.id === this.currentTab);
        let dummyItem = {
            type: this.currentTab,
            rarity: r.name ? r.name : Object.keys(RARITY).find(key => RARITY[key] === r),
            mainStat: { type: typeData ? typeData.mainStat : 'atk', val: 0 },
            subStat: { type: 'atk', val: 0 }
        };

        // Draw rarity bg for icon
        drawRoundedStroke(ctx, iconX, iconY, iconSize, iconSize, 5, "black", 1);
        drawRoundedRect(ctx, iconX, iconY, iconSize, iconSize, 5, "rgba(0,0,0,0.25)");

        // Draw icon
        drawText(ctx, typeData.icon, iconX + iconSize / 2, iconY + iconSize / 2 + 10, "white", 40, "center");

        // Rarity Name (Level)
        let rarityTextY = iconY + iconSize + 46;
        drawText(ctx, r.name, x + slotW / 2 - 2, rarityTextY - 2, "#444", 40, "center");
        drawText(ctx, r.name, x + slotW / 2 - 2, rarityTextY + 2, "#444", 40, "center");
        drawText(ctx, r.name, x + slotW / 2 + 2, rarityTextY - 2, "#444", 40, "center");
        drawText(ctx, r.name, x + slotW / 2 + 2, rarityTextY + 2, "#444", 40, "center");
        drawText(ctx, r.name, x + slotW / 2, rarityTextY, "white", 40, "center");

        // Price Calculation: 50 * 2^id
        let price = 50 * Math.pow(2, r.id);

        // Price Button
        let btnH = 40;
        let btnY = y + slotH - btnH - 10;
        let canBuy = DB.data.diamonds >= price;

        drawButton(ctx, "", x + 10, btnY, slotW - 20, btnH, canBuy ? "#4CAF50" : "#555", () => {
            if (canBuy) {
                // Buy logic
                if (DB.data.inventory.length >= DB.data.limitItems) {
                    addToast("Kho đồ đã đầy!", "#F44336");
                    return;
                }

                DB.data.diamonds -= price;
                // Create item
                // DB.createItem arguments: (targetRarity, level, allowedTypes, autoSave)
                // allowedTypes expects array of type IDs? No, createItem implementation: 
                // if (allowedTypes) typeKeys = typeKeys.filter(k => allowedTypes.includes(ITEM_TYPES[k].id));
                // So allowedTypes should be [this.currentTab] (integer id)

                // Need to pass rarity KEY (string "F", "E", etc), not object or ID.
                let rKey = Object.keys(RARITY).find(k => RARITY[k].id === r.id);

                DB.createItem(rKey, null, [this.currentTab], true);
                addToast(`Đã mua ${typeData.name} ${r.name}!`, "#4CAF50");
            } else {
                addToast("Không đủ kim cương!", "#F44336");
            }
        });

        // Price Text inside button
        drawRoundedStroke(ctx, x + 10, btnY, slotW - 20, btnH, 10, "black", 1);
        drawText(ctx, `💎 ${price.toLocaleString()}`, x + slotW / 2, btnY + 25, canBuy ? "white" : "#AAA", 16, "center");

    });

    drawToasts(ctx);
};

ShopState.Update = function (dt) {
    BackgroundSystem.Update(dt);
};
