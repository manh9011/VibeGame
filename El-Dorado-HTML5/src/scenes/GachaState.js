/**
 * --- GACHA STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, CLASS_TYPES, ITEM_TYPES } from '../context.js';
import { drawGlobalHeader, drawButton, drawText, drawHeroCard, drawItemIcon, drawRect, drawRoundedRect, addToast, drawToasts } from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';

export var GachaState = new Enjine.GameState();

GachaState.activeTab = "hero"; // 'hero' or 'item'
GachaState.results = [];

GachaState.Enter = function () {
    this.results = [];
    this.activeTab = "hero";
    this.selectionMode = false;
    this.results = [];
    this.activeTab = "hero";
    this.selectionMode = false;
    this.selectedIds = [];
    this.savedHeroIds = [];
    this.savedItemIds = [];
};

GachaState.Draw = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    drawText(ctx, "QUAY THƯỞNG", GAME.Canvas.Width / 2, 35, "#ffffff", 30, "center");

    drawButton(ctx, "❮ Về Menu", 10, 70, 100, 30, "#555", () => GAME.ChangeState(MainMenuState));

    // --- LEFT PANE (Controls) ---
    // Width ~ 350px (Increased from 300)
    let paneW = 350;
    let paneX = 20;
    let paneY = 120;

    drawRoundedRect(ctx, paneX, paneY, paneW, 500, 10, "rgba(0,0,0,0.5)");

    // Tabs
    let tabW = paneW / 2;
    drawButton(ctx, "TƯỚNG", paneX, paneY, tabW, 50, this.activeTab === "hero" ? "#E91E63" : "#333", () => {
        this.activeTab = "hero";
        this.results = [];
    }, "white", 20);
    drawButton(ctx, "TRANG BỊ", paneX + tabW, paneY, tabW, 50, this.activeTab === "item" ? "#673AB7" : "#333", () => {
        this.activeTab = "item";
        this.results = [];
    }, "white", 20);

    // Gacha Actions
    let actionY = paneY + 100;
    let cost1 = 1000;
    let cost6 = 6000;

    let color = this.activeTab === "hero" ? "#E91E63" : "#673AB7";

    drawText(ctx, this.activeTab === "hero" ? "QUAY TƯỚNG" : "QUAY TRANG BỊ", paneX + paneW / 2, actionY - 20, "white", 24, "center");

    // 1x Button
    drawButton(ctx, `QUAY 1 ( 10k )`, paneX + 25, actionY, 300, 60, color, () => {
        this.doGacha(1, 10000);
    }, "white", 20);

    // 6x Button
    drawButton(ctx, `QUAY 6 ( 50k )`, paneX + 25, actionY + 70, 300, 60, color, () => {
        this.doGacha(6, 50000);
    }, "yellow", 20);

    // Filter Gacha Button
    let filterText = this.activeTab === "hero" ? "QUAY HỆ (100k)" : "QUAY LOẠI (100k)";
    drawButton(ctx, filterText, paneX + 25, actionY + 140, 300, 60, "#FF5722", () => {
        this.selectionMode = true;
        this.scrollY = 0;
        // Load saved selection
        if (this.activeTab === "hero") this.selectedIds = [...this.savedHeroIds];
        else this.selectedIds = [...this.savedItemIds];
    }, "white", 20);

    drawText(ctx, "Tỉ lệ:", paneX + 20, actionY + 280, "#AAA", 16, "left");
    if (this.activeTab === "hero") {
        drawText(ctx, "1-2⭐: Common", paneX + 20, actionY + 310, "white", 14, "left");
        drawText(ctx, "3-5⭐: Rare", paneX + 20, actionY + 330, "cyan", 14, "left");
        drawText(ctx, "6-8⭐: Legend", paneX + 20, actionY + 350, "orange", 14, "left");
    } else {
        drawText(ctx, "F-D: Common", paneX + 20, actionY + 310, "white", 14, "left");
        drawText(ctx, "C-A: Rare", paneX + 20, actionY + 330, "cyan", 14, "left");
        drawText(ctx, "R-SR: Legend", paneX + 20, actionY + 350, "orange", 14, "left");
    }

    // Limits
    let cur = this.activeTab === "hero" ? DB.data.heroes.length : DB.data.inventory.length;
    let max = this.activeTab === "hero" ? DB.data.limitHeroes : DB.data.limitItems;
    drawText(ctx, `Kho: ${cur} / ${max}`, paneX + paneW / 2, paneY + 350, cur >= max ? "red" : "lime", 18, "center");


    // --- RIGHT PANE (Results) ---
    let gridX = paneX + paneW + 20;
    let gridY = 120;
    let gridW = GAME.Canvas.Width - gridX - 20;
    let gridH = 500; // Increased height from 400 to 500

    drawRoundedRect(ctx, gridX, gridY, gridW, gridH, 10, "rgba(0,0,0,0.3)");

    if (this.results.length > 0) {
        // 3x2 Grid Packed Center
        let cols = 3;
        let rows = 2;

        let cardW = 160;
        let cardH = 220;
        let gapX = 10;
        let gapY = 10;

        // Calculate total block size
        let totalBlockW = cols * cardW + (cols - 1) * gapX;
        let totalBlockH = rows * cardH + (rows - 1) * gapY;

        // Start coords to center the block
        let startX = gridX + (gridW - totalBlockW) / 2;
        let startY = gridY + (gridH - totalBlockH) / 2;

        this.results.forEach((res, i) => {
            let col = i % cols;
            let row = Math.floor(i / cols);

            let cx = startX + col * (cardW + gapX);
            let cy = startY + row * (cardH + gapY);

            if (res.type === 'hero') {
                drawHeroCard(ctx, res.data, cx, cy, cardW, cardH, false, false, false, null);
                // New tag?
                drawText(ctx, "NEW", cx + 80, cy - 10, "yellow", 16, "center");
            } else {
                // Draw Item
                // Mini card style for item
                // Use same size cardW/cardH but item specific drawing needed?
                // Previously used small square. Now stretch to match hero card size or center small card in slot?
                // User wants "sát nhau" (close together).
                // Let's draw a card container and centered item.

                drawRoundedRect(ctx, cx, cy, cardW, cardH, 10, "#333");
                // Inner frame
                drawRect(ctx, cx + 5, cy + 5, cardW - 10, cardH - 10, "#222");

                let item = res.data;
                drawItemIcon(ctx, item, cx + (cardW - 60) / 2, cy + 40, 60);

                let typeD = Object.values(ITEM_TYPES).find(t => t.id === item.type);
                drawText(ctx, typeD.name, cx + cardW / 2, cy + 130, "white", 16, "center");
                drawText(ctx, item.rarity, cx + cardW / 2, cy + 150, "orange", 18, "center");

                // Stat
                let mainStat = `${item.mainStat.type.toUpperCase()} +${item.mainStat.val}`;
                drawText(ctx, mainStat, cx + cardW / 2, cy + 180, "lime", 14, "center");

                drawText(ctx, "NEW", cx + cardW / 2, cy + 20, "yellow", 16, "center");
            }
        });
    } else {
        drawText(ctx, "Kết quả sẽ hiện ở đây...", gridX + gridW / 2, gridY + gridH / 2, "#AAA", 20, "center");
    }

    drawToasts(ctx);

    if (this.selectionMode) {
        // Overlay
        drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.8)");

        let winW = 800, winH = 600;
        let winX = (GAME.Canvas.Width - winW) / 2;
        let winY = (GAME.Canvas.Height - winH) / 2;

        drawRoundedRect(ctx, winX, winY, winW, winH, 10, "#222");

        let title = this.activeTab === "hero" ? "CHỌN 10 HỆ TƯỚNG" : "CHỌN 2 LOẠI TRANG BỊ";
        drawText(ctx, title, winX + winW / 2, winY + 40, "white", 30, "center");

        // Header Selection Preview
        if (this.selectedIds.length > 0) {
            let previewSize = 50;
            let previewGap = 10;
            let totalW = this.selectedIds.length * previewSize + (this.selectedIds.length - 1) * previewGap;
            let startPreviewX = winX + (winW - totalW) / 2;
            let previewY = winY + 70;

            this.selectedIds.forEach((id, i) => {
                let px = startPreviewX + i * (previewSize + previewGap);
                let icon = "?";
                let color = "#4CAF50";

                if (this.activeTab === "hero") {
                    let type = Object.values(CLASS_TYPES).find(c => c.id === id);
                    if (type) icon = type.icon;
                } else {
                    let type = Object.values(ITEM_TYPES).find(t => t.id === id);
                    if (type) icon = type.icon;
                }

                drawRoundedRect(ctx, px, previewY, previewSize, previewSize, 5, color);
                drawText(ctx, icon, px + previewSize / 2, previewY + previewSize / 2, "white", 24, "center");
            });
        }

        // Options Grid
        let opts = [];
        if (this.activeTab === "hero") {
            // Show ALL classes (removed filter)
            opts = Object.values(CLASS_TYPES).map(c => ({ id: c.id, name: c.name, icon: c.icon }));
        } else {
            opts = Object.values(ITEM_TYPES).map(t => ({ id: t.id, name: t.name, icon: t.icon }));
        }

        let startX = winX + 20;
        let startY = winY + 150;
        let viewW = winW - 100; // 50 padding each side
        let viewH = winH - 280; // Title + Button space

        let gap = 10, size = 80;
        let cols = 8;
        let rows = Math.ceil(opts.length / cols);
        let contentH = rows * (size + gap);

        // Scroll Logic
        if (this.scrollY === undefined) this.scrollY = 0;
        let maxScroll = Math.max(0, contentH - viewH);

        // Buttons + Indicator
        if (maxScroll > 0) {
            let barX = winX + winW - 50; // More space for buttons
            let barY = startY;
            let barH = viewH;

            let btnSize = 40;
            // Up Button
            drawButton(ctx, "▲", barX, barY - btnSize - 10, btnSize, btnSize, "#444", () => {
                this.scrollY = Math.max(0, this.scrollY - (size + gap));
            }, "white", 20);

            // Down Button
            drawButton(ctx, "▼", barX, barY + barH + 10, btnSize, btnSize, "#444", () => {
                this.scrollY = Math.min(maxScroll, this.scrollY + (size + gap));
            }, "white", 20);

            // Visual Indicator
            let indicatorH = barH;
            let thumbH = Math.max(30, (viewH / contentH) * indicatorH);
            let thumbY = barY + (this.scrollY / maxScroll) * (indicatorH - thumbH);

            drawRoundedRect(ctx, barX + 10, barY, 20, indicatorH, 5, "#333");
            drawRoundedRect(ctx, barX + 10, thumbY, 20, thumbH, 5, "#666"); // Lighter color, non-interactive visual look
        }

        // Clip View
        ctx.save();
        ctx.beginPath();
        ctx.rect(startX - gap, startY - gap, viewW + gap * 2, viewH + gap * 2);
        ctx.clip();

        opts.forEach((opt, i) => {
            let col = i % cols;
            let row = Math.floor(i / cols);
            let x = startX + col * (size + gap);
            let y = startY + row * (size + gap) - this.scrollY;

            // Only draw if visible
            if (y + size < startY || y > startY + viewH) return;

            let selected = this.selectedIds.includes(opt.id);
            drawRoundedRect(ctx, x, y, size, size, 5, selected ? "#4CAF50" : "#444");
            drawText(ctx, opt.icon, x + size / 2, y + size / 2 - 10, "white", 30, "center");
            drawText(ctx, opt.name.substring(0, 10), x + size / 2, y + size - 10, "white", 10, "center");

            if (Enjine.Mouse.Clicked && Enjine.Mouse.X > x && Enjine.Mouse.X < x + size && Enjine.Mouse.Y > y && Enjine.Mouse.Y < y + size) {
                // Since this is inside clip, checking mouse Y vs global Y works if we account for scroll!
                // Wait, logic: Mouse coordinates are screen space.
                // The item `y` is screen space (with scroll applied).
                // So if we click the screen location where the item IS drawn, it captures.
                // However, we must ensure we don't click items outside clip area?
                // The loop `if (y + size < startY ...)` handles drawing, but click check needs to be careful?
                // Actually, if we click outside the clip rect, we shouldn't trigger grid items.
                // I'll add a check that Mouse.Y is within viewY range.
                if (Enjine.Mouse.Y >= startY && Enjine.Mouse.Y <= startY + viewH) {
                    Enjine.Mouse.Clicked = false;
                    if (selected) {
                        this.selectedIds = this.selectedIds.filter(id => id !== opt.id);
                    } else {
                        let limit = this.activeTab === "hero" ? 10 : 2;
                        if (this.selectedIds.length < limit) this.selectedIds.push(opt.id);
                        else addToast(`Chỉ được chọn ${limit}!`, "orange");
                    }

                    // Save immediately
                    if (this.activeTab === "hero") this.savedHeroIds = [...this.selectedIds];
                    else this.savedItemIds = [...this.selectedIds];
                }
            }
        });
        ctx.restore();

        // Confirm Button
        let limit = this.activeTab === "hero" ? 10 : 2;
        let ready = this.selectedIds.length === limit;

        // Random Button (Hero Only)
        if (this.activeTab === "hero" && !ready) {
            drawButton(ctx, "NGẪU NHIÊN", winX + 40, winY + winH - 80, 140, 50, "#2196F3", () => {
                let available = Object.values(CLASS_TYPES).filter(c => !this.selectedIds.includes(c.id));
                let needed = limit - this.selectedIds.length;
                for (let k = 0; k < needed; k++) {
                    if (available.length === 0) break;
                    let r = Math.floor(Math.random() * available.length);
                    this.selectedIds.push(available[r].id);
                    available.splice(r, 1);
                }
                this.savedHeroIds = [...this.selectedIds];
            }, "white", 16);
        }
        drawButton(ctx, `XÁC NHẬN (100k)`, winX + winW / 2 - 100, winY + winH - 80, 200, 50, ready ? "lime" : "#555", () => {
            if (!ready) return;
            let filters = this.activeTab === "hero" ? { classes: this.selectedIds } : { types: this.selectedIds };
            this.doGacha(6, 100000, filters);
            this.selectionMode = false;
        }, "white", 20); // CHANGED TO WHITE

        // Close
        drawButton(ctx, "X", winX + winW - 50, winY + 10, 40, 40, "red", () => { this.selectionMode = false; }, "white", 20);
    }
};

GachaState.doGacha = function (count, costOverride, filters = null) {
    let type = this.activeTab;
    let resultData = DB.gachaBulk(type, count, costOverride, filters);

    if (resultData.error) {
        addToast(resultData.error, "red");
    } else {
        this.results = resultData.items.map(item => ({ type: type, data: item }));
        addToast(`Đã nhận ${count} món! -${resultData.cost}G`, "lime");
    }
};
