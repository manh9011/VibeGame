/**
 * --- ITEM MANAGE STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, ITEM_TYPES, RARITY } from '../context.js';
import { drawGlobalHeader, drawButton, drawText, drawRoundedRect, drawItemIcon, addToast, drawToasts, drawRect, drawRoundedStroke } from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';
import { UPGRADE_RATES } from '../data/dataManager.js';

export var ItemManageState = new Enjine.GameState();

ItemManageState.currentTab = 0; // 0: Weapon, 1: Shield, 2: Boots, 3: Watch
ItemManageState.selectedBaseId = null;
ItemManageState.materialIds = []; // Up to 3
ItemManageState.scroll = 0;
ItemManageState.isSellMode = false; // NEW: Sell mode toggle

ItemManageState.Enter = function () {
    this.currentTab = 0;
    this.selectedBaseId = null;
    this.materialIds = [];
    this.scroll = 0;
    this.scroll = 0;
    this.isSellMode = false; // Reset sell mode on enter
    this.useCharm = false; // Reset charm
};

// Calculate sell price based on rarity and type
ItemManageState.calculateSellPrice = function (item) {
    const rarityValues = {
        'F': 10,
        'E': 25,
        'D': 50,
        'C': 100,
        'B': 200,
        'A': 400,
        'R': 800,
        'SR': 0,     // Cannot sell
        'SSR': 0,    // Cannot sell
        'SSSR': 0    // Cannot sell
    };

    let basePrice = rarityValues[item.rarity] || 10;

    // Type multiplier: weapons worth more
    const typeMultiplier = {
        0: 1.5,  // Sword
        1: 1.2,  // Shield
        2: 1.0,  // Boots
        3: 1.3   // Watch
    };

    return Math.floor(basePrice * (typeMultiplier[item.type] || 1) * 100);
};

ItemManageState.Draw = function (ctx) {
    // Update animation time for rotating borders
    if (!this.animTime) this.animTime = 0;
    this.animTime += 0.02; // Rotation speed
    if (this.animTime > Math.PI * 2) this.animTime = 0;

    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.8)");
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    drawText(ctx, "KHO TRANG BỊ & NÂNG CẤP", GAME.Canvas.Width / 2, 32, "white", 24, "center"); // Moved to header
    drawButton(ctx, "❮ Về Menu", 20, 70, 100, 30, "#555", () => GAME.ChangeState(MainMenuState));

    // Sell Mode Toggle Button
    let sellBtnText = this.isSellMode ? "❌ Hủy Bán" : "💰 Bán";
    let sellBtnColor = this.isSellMode ? "#C00" : "#4CAF50";
    drawButton(ctx, sellBtnText, 130, 70, 100, 30, sellBtnColor, () => {
        this.isSellMode = !this.isSellMode;
        this.selectedBaseId = null;
        this.materialIds = [];
    });

    // --- TABS ---
    let tabW = 120, tabH = 40, startTabX = 50, tabY = 120;
    Object.values(ITEM_TYPES).forEach((t, i) => {
        let isSelected = this.currentTab === t.id;
        drawButton(ctx, `${t.icon} ${t.name}`, startTabX + i * (tabW + 10), tabY, tabW, tabH, isSelected ? "#FF9800" : "#444", () => {
            this.currentTab = t.id;
            this.selectedBaseId = null;
            this.materialIds = [];
            this.scroll = 0;
        });
    });

    // --- MAIN LAYOUT : Left (Inventory), Right (Upgrade) ---
    let splitX = GAME.Canvas.Width * 0.6;

    // === LEFT: INVENTORY ===
    let invX = 20, invY = 180, invW = splitX - 40, invH = GAME.Canvas.Height - 200;
    // drawRoundedRect(ctx, invX, invY, invW, invH, 10, "rgba(0,0,0,0.3)");

    let items = DB.data.inventory.filter(i => i.type === this.currentTab);
    // Sort: Rarity Desc
    const rOrder = ["SR", "R", "A", "B", "C", "D", "E", "F"];
    items.sort((a, b) => rOrder.indexOf(a.rarity) - rOrder.indexOf(b.rarity));

    let cols = 4; // Reduced from 5 to fit larger slots
    let slotSize = 110; // Increased from 70
    let gap = 10;
    let maxVisibleRows = Math.floor((invH - 20) / (slotSize + gap));
    let maxVisible = cols * maxVisibleRows;
    let maxScroll = Math.max(0, Math.ceil(items.length / cols) - maxVisibleRows);

    if (this.scroll < 0) this.scroll = 0;
    if (this.scroll > maxScroll) this.scroll = maxScroll;

    // Scroll buttons
    if (this.scroll > 0) drawButton(ctx, "▲", invX + invW - 30, invY, 30, 30, "#555", () => this.scroll--);
    if (this.scroll < maxScroll) drawButton(ctx, "▼", invX + invW - 30, invY + invH - 30, 30, 30, "#555", () => this.scroll++);

    let startIdx = this.scroll * cols;
    let drawnCount = 0;

    for (let i = startIdx; i < items.length; i++) {
        if (drawnCount >= maxVisible) break;
        let item = items[i];

        let col = drawnCount % cols;
        let row = Math.floor(drawnCount / cols);
        let x = invX + col * (slotSize + gap);
        let y = invY + row * (slotSize + gap);

        // Selection Logic
        let isBase = this.selectedBaseId === item.id;
        let isMat = this.materialIds.includes(item.id);
        let isValidMat = false;

        // Check availability
        if (this.selectedBaseId) {
            let base = items.find(it => it.id === this.selectedBaseId);
            if (base && item.id !== base.id && item.rarity === base.rarity && !item.equippedTo) {
                isValidMat = true;
            }
        } else {
            // If no base selected, any can be base
            isValidMat = true; // Visual indicator?
        }

        // Draw Item
        // First draw rarity-colored background for FULL slot
        let rarityKey = item.rarity;
        let rData = RARITY[rarityKey];
        let padding = 4; // Padding from gray border
        drawRoundedRect(ctx, x + padding, y + padding, slotSize - padding * 2, slotSize - padding * 2, 5, rData.color); // Colored frame with padding

        // Add rotating gradient border for R+ rarity items
        const glowRarities = ['R', 'SR', 'SSR', 'SSSR'];
        const superRareGlow = ['SR', 'SSR', 'SSSR']; // SR+ gets extra glow

        if (glowRarities.includes(rarityKey)) {
            if (!this.animTime) this.animTime = 0;

            ctx.save();
            let centerX = x + slotSize / 2;
            let centerY = y + slotSize / 2;

            // Add glow effect for SR+ items
            if (superRareGlow.includes(rarityKey)) {
                ctx.shadowColor = rData.color;
                ctx.shadowBlur = 20;
            }

            // Create rotating gradient with larger bright areas
            let gradient = ctx.createConicGradient(this.animTime, centerX, centerY);
            gradient.addColorStop(0, rData.color);
            gradient.addColorStop(0.35, rData.color);      // Wider bright area
            gradient.addColorStop(0.5, 'transparent');
            gradient.addColorStop(0.85, 'transparent');
            gradient.addColorStop(1, rData.color);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(x + padding, y + padding, slotSize - padding * 2, slotSize - padding * 2, 5);
            ctx.stroke();
            ctx.restore();
        }

        // Then draw selection borders on top
        if (isBase) drawRoundedStroke(ctx, x, y, slotSize, slotSize, 5, "#0F0", 3);
        else if (isMat) drawRoundedStroke(ctx, x, y, slotSize, slotSize, 5, "#E91E63", 3);

        // Icon (centered, smaller)
        let typeData = Object.values(ITEM_TYPES).find(t => t.id === item.type);
        drawRect(ctx, x + padding + 2, y + padding + 2, slotSize - padding * 2 - 4, slotSize - padding * 2 - 4, "rgba(0,0,0,0.5)"); // Dark inner for contrast
        drawText(ctx, typeData.icon, x + slotSize / 2, y + 60, "white", 50, "center"); // Moved down

        // Then draw selection borders on top
        if (isBase) drawRoundedStroke(ctx, x, y, slotSize, slotSize, 5, "#0F0", 3);
        else if (isMat) drawRoundedStroke(ctx, x, y, slotSize, slotSize, 5, "#E91E63", 3);

        // Draw stats with text labels and colon separator
        let mainStatLabel = item.mainStat.type.toUpperCase();
        let subStatLabel = item.subStat.type.toUpperCase();

        // Format values - show SPD and ATKSPD as percentages
        let mainStatValue = (item.mainStat.type === 'spd' || item.mainStat.type === 'atkSpd')
            ? `${Math.round(item.mainStat.val * 100)}%`
            : Math.round(item.mainStat.val);
        let subStatValue = (item.subStat.type === 'spd' || item.subStat.type === 'atkSpd')
            ? `${Math.round(item.subStat.val * 100)}%`
            : Math.round(item.subStat.val);

        let mainStatText = `${mainStatLabel}: ${mainStatValue}`;
        let subStatText = `${subStatLabel}: ${subStatValue}`;
        drawText(ctx, mainStatText, x + slotSize / 2, y + slotSize - 25, "yellow", 10, "center");
        drawText(ctx, subStatText, x + slotSize / 2, y + slotSize - 15, "#CCC", 9, "center");

        // Draw rarity text at bottom right
        drawText(ctx, item.rarity, x + slotSize - 10, y + slotSize - 10, rData.color, 10, "right");

        // SELL MODE: Show sell price or restriction
        if (this.isSellMode) {
            let sellPrice = this.calculateSellPrice(item);
            if (sellPrice > 0 && !item.equippedTo) {
                drawText(ctx, `💰${sellPrice}`, x + 5, y + slotSize + 8, "#ffee00", 10, "left");
            } else if (sellPrice === 0) {
                drawText(ctx, "❌", x + 5, y + slotSize - 10, "red", 12, "left"); // Cannot sell SR+
            } else if (item.equippedTo) {
                drawText(ctx, "🔒", x + 5, y + slotSize - 10, "#FF9800", 12, "left"); // Equipped
            }
        }

        if (item.equippedTo) {
            drawText(ctx, "E", x + slotSize - 12, y + 15, "cyan", 12, "center");
        } else if (isValidMat && !isBase && !isMat && this.selectedBaseId) {
            // Highlight valid material candidates slightly?
            drawText(ctx, "+", x + slotSize / 2, y + slotSize / 2, "rgba(255,255,255,0.2)", 30, "center");
        }

        // CLICK HANDLING
        if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= x && Enjine.Mouse.X <= x + slotSize && Enjine.Mouse.Y >= y && Enjine.Mouse.Y <= y + slotSize) {
            Enjine.Mouse.Clicked = false;

            // SELL MODE
            if (this.isSellMode) {
                let sellPrice = this.calculateSellPrice(item);
                if (sellPrice > 0 && !item.equippedTo) {
                    // Sell the item
                    DB.data.gold += sellPrice;
                    DB.data.inventory = DB.data.inventory.filter(it => it.id !== item.id);
                    DB.save();
                    addToast(`Đã bán +${sellPrice} vàng!`, "#4CAF50");
                } else if (sellPrice === 0) {
                    addToast("Không thể bán vật phẩm SR trở lên!", "#F44336");
                } else if (item.equippedTo) {
                    addToast("Hãy tháo trang bị trước!", "#FF9800");
                }
            }
            // UPGRADE MODE
            else {
                // Allow selecting base even if equipped, but not as material
                if (!this.selectedBaseId) {
                    this.selectedBaseId = item.id;
                } else if (this.selectedBaseId === item.id) {
                    this.selectedBaseId = null;
                    this.materialIds = [];
                } else if (item.equippedTo) {
                    addToast("Vật phẩm đang trang bị không thể làm nguyên liệu!", "#F44336");
                } else if (isValidMat && this.materialIds.length < 3 && !this.materialIds.includes(item.id)) {
                    this.materialIds.push(item.id);
                } else if (this.materialIds.includes(item.id)) {
                    this.materialIds = this.materialIds.filter(id => id !== item.id);
                }
            }
        }

        drawnCount++;
    }

    // === RIGHT: UPGRADE PANEL ===
    let upgX = splitX + 20, upgY = 180, upgW = GAME.Canvas.Width - splitX - 40, upgH = GAME.Canvas.Height - 200;
    drawRoundedRect(ctx, upgX, upgY, upgW, upgH, 15, "#222");

    drawText(ctx, "NÂNG CẤP", upgX + upgW / 2, upgY + 30, "white", 24, "center");

    let midX = upgX + upgW / 2;
    let midY = upgY + 120;
    let slotBig = 80; // Size of the base item slot

    // Base Slot
    drawRoundedRect(ctx, midX - slotBig / 2, midY - slotBig / 2, slotBig, slotBig, 10, "#111");
    // Mat Slots (below)
    let matY = midY + 100;
    let matGap = 20;
    let matStart = midX - (3 * 60 + 2 * matGap) / 2 + 30; // Centered

    if (this.selectedBaseId) {
        let base = DB.data.inventory.find(i => i.id === this.selectedBaseId);
        if (base) {
            drawItemIcon(ctx, base, midX - slotBig / 2 + 5, midY - slotBig / 2 + 5, slotBig - 10);
            drawText(ctx, "Đồ chính", midX, midY - 50, "#0F0", 14, "center");

            // Draw Materials
            for (let i = 0; i < 3; i++) {
                let mx = matStart + i * (60 + matGap) - 30;
                drawRoundedRect(ctx, mx, matY, 60, 60, 5, "#111");
                drawRoundedStroke(ctx, mx, matY, 60, 60, 5, "#444", 1);

                if (i < this.materialIds.length) {
                    let mat = DB.data.inventory.find(m => m.id === this.materialIds[i]);
                    if (mat) drawItemIcon(ctx, mat, mx + 5, matY + 5, 50);
                } else {
                    drawText(ctx, "+", mx + 30, matY + 35, "#333", 30, "center");
                }
            }

            // Rate Info
            let rateInfo = UPGRADE_RATES[base.rarity];
            if (rateInfo) {
                let bonusKey = `${base.type}_${base.rarity}`;
                let bonus = DB.data.upgradeBonus[bonusKey] || 0;
                let charmBonus = this.useCharm ? 50 : 0;
                let total = Math.min(100, rateInfo.rate + bonus + charmBonus);

                drawText(ctx, `Tỷ lệ: ${total}%`, midX, matY + 80, total > 50 ? "#0F0" : "#F44336", 20, "center");

                let detailText = `(Gốc: ${rateInfo.rate}%`;
                if (bonus > 0) detailText += ` + Bonus: ${bonus}%`;
                if (charmBonus > 0) detailText += ` + Charm: 50%`;
                detailText += `)`;

                drawText(ctx, detailText, midX, matY + 100, "#AAA", 12, "center");

                // Lucky Charm Checkbox
                let chkY = matY + 130;
                let chkX = midX - 80;

                // Draw Checkbox
                drawRoundedRect(ctx, chkX, chkY, 20, 20, 3, "#333");
                if (this.useCharm) {
                    drawText(ctx, "✔", chkX + 10, chkY + 16, "#0F0", 18, "center");
                }
                drawText(ctx, "Bùa May Mắn (+50%)", chkX + 30, chkY + 15, "#FFD700", 14, "left");
                drawText(ctx, "Giá: 500k", chkX + 30, chkY + 32, "white", 10, "left");

                // Click Checkbox
                if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= chkX && Enjine.Mouse.X <= chkX + 160 &&
                    Enjine.Mouse.Y >= chkY && Enjine.Mouse.Y <= chkY + 35) {
                    this.useCharm = !this.useCharm;
                    Enjine.Mouse.Clicked = false;
                }
            }

            // Button
            let canUpgrade = this.materialIds.length === 3;
            drawButton(ctx, "NÂNG CẤP", midX - 80, matY + 170, 160, 50, canUpgrade ? "#E91E63" : "#555", () => {
                if (!canUpgrade) return;
                let res = DB.upgradeItem(this.selectedBaseId, this.materialIds, this.useCharm);
                if (res.success) {
                    addToast(res.msg, "#0F0");
                    this.selectedBaseId = null;
                    this.materialIds = [];
                    this.useCharm = false; // Reset charm after success
                } else {
                    if (res.msg) addToast(res.msg, "#F44336");
                    // Failure logic handled in DB (materials lost, bonus added)
                    // Refresh visuals
                    this.materialIds = [];
                }
            }, "white", 20);

        }
    } else {
        drawText(ctx, "Chọn một món đồ để bắt đầu", midX, midY, "#777", 16, "center");
    }

    drawToasts(ctx);
};

ItemManageState.Update = function (dt) {
    BackgroundSystem.Update(dt);
};
