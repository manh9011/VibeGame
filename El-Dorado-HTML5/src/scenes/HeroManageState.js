/**
 * --- HERO MANAGE STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, CLASS_TYPES, ITEM_TYPES } from '../context.js';
import { drawGlobalHeader, drawButton, drawText, drawTeamDisplay, drawHeroCard, drawRect, drawItemIcon, drawRoundedRect, addToast, drawToasts } from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';
import { GachaState } from './GachaState.js';

export var HeroManageState = new Enjine.GameState();
HeroManageState.Enter = function () {
    this.refreshHeroList();
    this.scroll = 0;
    this.inventoryScroll = 0;
    this.scrollAccumulator = 0;
    this.selectedHeroId = null;
    this.mergeList = [];
    this.showUpgradeDialog = false;
    this.isSellingMode = false;
    this.sellList = [];
    this.isDragging = false;
    this.showInventorySlot = null;
    this.lastDragX = null;
};

HeroManageState.Update = function () {
    // Only sort if flagged? For now we sort on Enter.
    // If we want auto-update, we can check hash here, but explicit refresh is better.
};



HeroManageState.refreshHeroList = function () {
    let teamHeroes = [];
    let otherHeroes = [];

    // Filter nulls from team just in case
    let teamIds = DB.data.team.filter(tid => tid !== null);

    // Use Set for O(1) lookup instead of includes() which is O(n)
    let teamSet = new Set(teamIds);

    // Optimized: Single pass
    DB.data.heroes.forEach(h => {
        if (h.embeddedIn) return; // Hide heroes assigned to towers
        if (teamSet.has(h.id)) return; // Already separated
        otherHeroes.push(h);
    });


    // Always sort to ensure proper ordering (stars descending, then level descending)
    otherHeroes.sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        return b.level - a.level;
    });

    // Add team heroes in slot order
    for (let i = 0; i < 4; i++) {
        let tid = DB.data.team[i];
        if (tid) {
            let h = DB.data.heroes.find(x => x.id === tid);
            if (h && !h.embeddedIn) teamHeroes.push(h);
        }
    }

    if (this.showUpgradeDialog) {
        // In Upgrade Mode: Filter out team heroes from selection
        // Also remove the target hero itself from the listing if needed, 
        // though usually we want to see it but disabled? 
        // Plan said "Hide Deployed Heroes".
        this.displayHeroes = [...otherHeroes];
    } else {
        this.displayHeroes = [...teamHeroes, ...otherHeroes];
    }
};

HeroManageState.showInventorySlot = null; // null or 0,1,2,3
HeroManageState.inventoryScroll = 0; // Scroll position for inventory view
HeroManageState.scrollAccumulator = 0;
HeroManageState.lastDragX = null;
HeroManageState.isDragging = false;
HeroManageState.displayHeroes = []; // Cached list

HeroManageState.Draw = function (ctx) {
    if (!this.displayHeroes || this.displayHeroes.length === 0) {
        // Fallback if Enter wasn't called (e.g. hot reload)
        this.refreshHeroList();
    }

    // Animation time updates removed - animations disabled for performance

    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.6)"); // Overlay
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    drawText(ctx, "QUẢN LÝ TƯỚNG", GAME.Canvas.Width / 2, 32, "white", 24, "center"); // Moved to header

    // --- 2-ROW GRID ---
    let cardW = 160, gap = 20;
    let cardH = 220;
    let itemW = cardW + gap;

    // Rows
    let rows = 2; // Fixed 2 rows
    let gridY = this.showUpgradeDialog ? 230 : 210;

    let displayHeroes = this.displayHeroes;
    // Calculate columns fit in screen
    let startX = 50;
    let availableW = GAME.Canvas.Width - 100;
    let maxVisibleCols = Math.floor(availableW / itemW);
    let maxVisibleItems = maxVisibleCols * rows;

    // Total items needed / rows -> total columns?
    // We scroll by COLUMN index or ITEM index? 
    // Easier to scroll by COLUMN index.
    let totalCols = Math.ceil(displayHeroes.length / rows);
    let maxScroll = Math.max(0, totalCols - maxVisibleCols);

    if (Enjine.Mouse.Down) {
        if (this.lastDragX !== null) {
            let dx = Enjine.Mouse.X - this.lastDragX;
            if (Math.abs(dx) > 2) this.isDragging = true;

            this.scrollAccumulator -= dx;
            while (this.scrollAccumulator >= itemW) {
                this.scroll++;
                this.scrollAccumulator -= itemW;
            }
            while (this.scrollAccumulator <= -itemW) {
                this.scroll--;
                this.scrollAccumulator += itemW;
            }

            if (this.scroll < 0) this.scroll = 0;
            if (this.scroll > maxScroll) this.scroll = maxScroll;
        }
        this.lastDragX = Enjine.Mouse.X;
    } else {
        this.lastDragX = null;
        this.scrollAccumulator = 0;
        if (this.isDragging) {
            Enjine.Mouse.Clicked = false;
            this.isDragging = false;
        }
    }

    if (this.showInventorySlot !== null && this.selectedHeroId) {
        this.drawInventory(ctx);
        return;
    }

    if (!this.showUpgradeDialog) {
        drawButton(ctx, "❮ Về Menu", 10, 70, 100, 30, "#555", () => GAME.ChangeState(MainMenuState));
    } else {
        drawText(ctx, "CHỌN NGUYÊN LIỆU ĐỂ GỘP", GAME.Canvas.Width / 2, 90, "#FF9800", 24, "center");

        let cancelX = 10;
        drawButton(ctx, "HỦY BỎ", cancelX, 70, 100, 30, "#C00", () => { this.showUpgradeDialog = false; this.mergeList = []; this.refreshHeroList(); });

        // Show Target Hero Icon next to Cancel
        if (this.selectedHeroId) {
            let targetHero = DB.data.heroes.find(h => h.id === this.selectedHeroId);
            if (targetHero) {
                // Determine same type to jump
                let targetType = targetHero.type;
                drawRoundedRect(ctx, cancelX + 110, 65, 40, 40, 5, "#448AFF");
                drawRect(ctx, cancelX + 112, 67, 36, 36, "rgba(0,0,0,0.5)");
                // Actually helper drawItemIcon expects item object with 'type' (id) and 'rarity'. Hero type is class ID. 
                // Need class icon. UIHelpers doesn't have drawClassIcon? 
                // drawTeamDisplay uses typeInfo.icon.
                // Let's just draw text icon.
                let typeInfo = CLASS_TYPES[Object.keys(CLASS_TYPES).find(k => CLASS_TYPES[k].id == targetHero.type)];
                drawText(ctx, typeInfo.icon, cancelX + 130, 90, "white", 30, "center");

                // Show jump button
                drawButton(ctx, "🔍 Tìm cùng loại", cancelX + 160, 70, 120, 30, "#2196F3", () => {
                    // Find first hero of same type in displayHeroes
                    let jumpIdx = this.displayHeroes.findIndex(h => h.type === targetType && h.id !== this.selectedHeroId);
                    if (jumpIdx !== -1) {
                        let col = Math.floor(jumpIdx / rows);
                        this.scroll = Math.max(0, Math.min(col, maxScroll));
                        addToast("Đã nhảy đến vị trí!", "#4CAF50");
                    } else {
                        addToast("Không tìm thấy nguyên liệu phù hợp!", "#F44336");
                    }
                }, "white", 12);

                // Select All Same Type button
                drawButton(ctx, "➕ Chọn hết", cancelX + 290, 70, 100, 30, "#FF9800", () => {
                    let count = 0;
                    this.displayHeroes.forEach(h => {
                        if (h.type === targetType && h.id !== this.selectedHeroId) {
                            if (!this.mergeList.includes(h.id)) {
                                this.mergeList.push(h.id);
                                count++;
                            }
                        }
                    });
                    if (count > 0) addToast(`Đã chọn thêm ${count} tướng!`, "#4CAF50");
                    else addToast("Không còn tướng cùng loại!", "orange");
                }, "white", 12);
            }
        }
    }

    if (!this.showUpgradeDialog) {
        if (!this.isSellingMode) {
            drawTeamDisplay(ctx, 60, false, GAME.Canvas.Width, 90);
        } else {
            // Sell Info at Top (Replacing Team Display)
            let topY = 80;
            drawText(ctx, `KHO: ${DB.data.heroes.length} / ${DB.data.limitHeroes}`, GAME.Canvas.Width / 2, topY, "white", 20, "center");

            let total = this.sellList.reduce((acc, id) => {
                let h = DB.data.heroes.find(x => x.id === id);
                return acc + (h ? Math.floor(h.level * 100 * h.stars * 100) : 0);
            }, 0);

            let color = total > 0 ? "#FFD700" : "#AAA";
            let text = total > 0 ? `Dự kiến: +${total} Vàng` : "Chọn tướng để bán";
            drawText(ctx, text, GAME.Canvas.Width / 2, topY + 30, color, 20, "center");
        }
    }

    // Draw Scroll Buttons
    if (this.scroll > 0)
        drawButton(ctx, "❮", 10, gridY + cardH - 20, 30, 40, "#777", () => this.scroll--);
    if (this.scroll < maxScroll)
        drawButton(ctx, "❯", GAME.Canvas.Width - 40, gridY + cardH - 20, 30, 40, "#777", () => this.scroll++);

    // Pre-compute team status for better performance
    let teamSet = new Set(DB.data.team.filter(t => t !== null));

    // Convert lists to Sets for O(1) lookup
    let mergeSet = new Set(this.mergeList);
    let sellSet = new Set(this.sellList);

    // OPTIMIZATION: Build item map once per frame for O(1) equipment lookup
    const itemMap = new Map();
    DB.data.inventory.forEach(i => itemMap.set(i.id, i));

    // Draw Grid Items
    for (let c = 0; c < maxVisibleCols; c++) {
        for (let r = 0; r < rows; r++) {
            let colIdx = c + this.scroll;
            // Index logic: Column-major scroll?
            // If scrolling horizontally, items are filled top-to-bottom, then left-to-right?
            // Or left-to-right, then top-to-bottom?
            // "Jump" logic assumed `col = floor(index / rows)`. -> Column Major filling.
            // Index 0: Col 0, Row 0. Index 1: Col 0, Row 1. Index 2: Col 1, Row 0...

            let idx = colIdx * rows + r;
            if (idx >= displayHeroes.length) break;

            let hero = displayHeroes[idx];
            let x = startX + c * itemW;
            let y = gridY + r * (cardH + 20); // 20px vertical gap

            let isTeam = teamSet.has(hero.id);
            let isSelected = this.selectedHeroId === hero.id;
            let isMerge = mergeSet.has(hero.id);

            // Check Slot Clicks (Always visible now)
            if (Enjine.Mouse.Clicked && !this.isDragging && !this.showUpgradeDialog && !this.isSellingMode) {
                let slotSize = 30;
                let gap = 5;
                let startEqX = x + (cardW - (4 * slotSize + 3 * gap)) / 2;
                let eqY = y + 175; // Uses local y

                for (let s = 0; s < 4; s++) {
                    let bx = startEqX + s * (slotSize + gap);
                    if (Enjine.Mouse.X >= bx && Enjine.Mouse.X <= bx + slotSize &&
                        Enjine.Mouse.Y >= eqY && Enjine.Mouse.Y <= eqY + slotSize) {
                        this.selectedHeroId = hero.id;
                        this.showInventorySlot = s;
                        Enjine.Mouse.Clicked = false;
                        break;
                    }
                }
            }

            let isSellSelected = this.isSellingMode && sellSet.has(hero.id);

            drawHeroCard(ctx, hero, x, y, cardW, cardH, isSelected || isSellSelected, isTeam, isMerge, () => {
                if (this.isDragging) return; // Ignore click if dragging

                if (this.showUpgradeDialog) {
                    if (hero.id === this.selectedHeroId) return;
                    if (isTeam) return;

                    if (mergeSet.has(hero.id))
                        this.mergeList = this.mergeList.filter(id => id !== hero.id);
                    else
                        this.mergeList.push(hero.id);
                } else if (this.isSellingMode) {
                    // Sell Logic
                    let isEquipped = Object.values(hero.equipments).some(e => e !== null);
                    if (isTeam || isEquipped) {
                        addToast("Không thể bán tướng đang dùng!", "#F44336");
                        return;
                    }

                    if (sellSet.has(hero.id)) {
                        this.sellList = this.sellList.filter(id => id !== hero.id);
                    } else {
                        this.sellList.push(hero.id);
                    }
                } else {
                    this.selectedHeroId = hero.id;
                    this.mergeList = [];
                }
            }, itemMap);

            // Re-add visual overlays inside the loop using local x, y
            if (this.isSellingMode) {
                let isEquipped = Object.values(hero.equipments).some(e => e !== null);

                if (isTeam || isEquipped) {
                    drawRect(ctx, x, y, cardW, cardH, "rgba(0,0,0,0.5)");
                    drawText(ctx, "ĐANG DÙNG", x + cardW / 2, y + cardH / 2, "red", 16, "center");
                }
                if (isSellSelected) {
                    drawText(ctx, "✅", x + cardW - 20, y + 20, "lime", 24, "center");
                }
            }
        }
    }


    // --- BUTTONS ---
    let bottomY = 160; // Position below grid
    let centerX = GAME.Canvas.Width / 2;

    let jumpY = bottomY; // SAME LINE

    // Star Buttons Left (1-4)
    for (let s = 1; s <= 5; s++) {
        drawButton(ctx, `${s}⭐`, 20 + (s - 1) * 60, jumpY, 50, 40, "#0059ff", () => {
            let idx = displayHeroes.findIndex(h => h.stars === s);
            if (idx !== -1) this.scroll = idx;
        }, "white", 12);
    }

    // Star Buttons Right (5-8)
    for (let s = 6; s <= 10; s++) {
        drawButton(ctx, `${s}⭐`, GAME.Canvas.Width - 320 + (s - 6) * 60, jumpY, 50, 40, "#0059ff", () => {
            let idx = displayHeroes.findIndex(h => h.stars === s);
            if (idx !== -1) this.scroll = idx;
        }, "white", 12);
    }

    if (!this.showUpgradeDialog) {

        if (this.selectedHeroId) {
            let hero = DB.data.heroes.find(h => h.id === this.selectedHeroId);
            if (hero) {
                let actionY = 160;
                // Calculate width: 4 slots * 80 (width 70 + gap 10) + Upgrade (100) + Star (120) + Gaps
                // Actual widths used: Slot: 70, Upgrade: 100, Star: 120.
                // Positions from original code were: actionX + s*80. So Slot 4 ends at 3*80+70 = 310.
                // Upgrade was at actionX + 340. Gap 30. Width 100. Ends 440.
                // Star was at actionX + 450. Gap 10. Width 120. Ends 570.
                let totalW = 570;
                let actionX = (GAME.Canvas.Width - totalW) / 2;

                // Slot Buttons
                for (let s = 0; s < 4; s++) {
                    let isEquippedHere = DB.data.team[s] === hero.id;
                    let label = isEquippedHere ? "GỠ" : `SLOT ${s + 1}`;
                    let color = isEquippedHere ? "#C00" : "#444";

                    let classPresent = false;
                    if (!isEquippedHere) {
                        classPresent = DB.data.team.some(tid => {
                            if (!tid || tid === hero.id) return false;
                            let th = DB.data.heroes.find(h => h.id === tid);
                            return th && th.type === hero.type;
                        });
                    }

                    if (!classPresent || isEquippedHere) {
                        drawButton(ctx, label, actionX + s * 80, actionY, 70, 40, color, () => {
                            if (isEquippedHere) DB.data.team[s] = null;
                            else {
                                let oldSlot = DB.data.team.indexOf(hero.id);
                                if (oldSlot !== -1) DB.data.team[oldSlot] = null;
                                DB.data.team[s] = hero.id;
                            }
                            DB.save();
                            this.refreshHeroList();
                        }, "white", 12);
                    }
                }

                // Upgrade Button
                drawButton(ctx, "NÂNG CẤP", actionX + 340, actionY, 100, 40, "#FF9800", () => {
                    this.showUpgradeDialog = true;
                    this.mergeList = [];
                });

                // Star Upgrade Button
                if (hero.stars < 10) {
                    let starCost = hero.stars * 10000;
                    let canUpgrade = DB.data.gold >= starCost;
                    drawButton(ctx, `UP ⭐ (${starCost / 1000}k)`, actionX + 450, actionY, 120, 40, canUpgrade ? "#E91E63" : "#555", () => {
                        let res = DB.upgradeHeroStar(hero.id);
                        if (res.success) {
                            addToast(res.msg, "#4CAF50");
                            this.refreshHeroList();
                        }
                        else addToast(res.msg, "#F44336");
                    }, "white", 14);
                }

                // Back Button (Deselect)
                drawButton(ctx, "X", actionX - 50, actionY, 40, 40, "#555", () => this.selectedHeroId = null, "white", 14);
            }
        } else if (!this.isSellingMode) {
            // --- NORMAL MODE ---
            let btnH = 40;
            let sellW = 140;
            let gachaW = 190;
            let gap = 10;

            let sellX = centerX - sellW / 2;
            let heroGachaX = sellX - gap - gachaW;
            let itemGachaX = sellX + sellW + gap;

            // Hero Gacha
            drawButton(ctx, "QUAY TƯỚNG (10k)", heroGachaX, bottomY, gachaW, btnH, "#0059ff", () => {
                let res = DB.gachaBulk('hero', 1, 10000);
                if (res.error) addToast(res.error, "#FF5722"); // Orange/Red for error
                else {
                    let h = res.items[0];
                    if (h) {
                        addToast(`Có: ${CLASS_TYPES[Object.keys(CLASS_TYPES).find(k => CLASS_TYPES[k].id == h.type)].name} ${h.stars}⭐!`, "#FFEB3B");
                        this.refreshHeroList();
                    }
                }
            }, "white", 16);

            // Sell Button (Center)
            drawButton(ctx, "BÁN TƯỚNG", sellX, bottomY, sellW, btnH, "#ef0000", () => {
                this.isSellingMode = true;
                this.sellList = [];
                this.selectedHeroId = null;
                this.refreshHeroList(); // Refresh to clear selections or filters if needed
            }, "white", 16);

            // Item Gacha
            drawButton(ctx, "QUAY ĐỒ (10k)", itemGachaX, bottomY, gachaW, btnH, "#0059ff", () => {
                let res = DB.gachaBulk('item', 1, 10000);
                if (res.error) addToast(res.error, "#FF5722");
                else {
                    let it = res.items[0];
                    if (it) addToast(`Có: ${ITEM_TYPES[Object.keys(ITEM_TYPES).find(k => ITEM_TYPES[k].id == it.type)].name} [${it.rarity}]!`, "#00E676");
                }
            }, "white", 16);

            // Slot Info (Below buttons)
            let heroInfoX = heroGachaX + gachaW / 2;
            let itemInfoX = itemGachaX + gachaW / 2;

            drawText(ctx, `${DB.data.heroes.length}/${DB.data.limitHeroes}`, heroInfoX - 150, bottomY + 30, "white", 14, "center");
            drawText(ctx, `${DB.data.inventory.length}/${DB.data.limitItems}`, itemInfoX + 150, bottomY + 30, "white", 14, "center");

            drawText(ctx, "TƯỚNG", heroInfoX - 150, bottomY + 10, "#eee", 10, "center");
            drawText(ctx, "TRANG BỊ", itemInfoX + 150, bottomY + 10, "#eee", 10, "center");

        } else {
            // --- SELL MODE ---
            let btnH = 40;
            let mainW = 200;

            drawText(ctx, "CHẾ ĐỘ BÁN TƯỚNG", centerX, bottomY - 10, "#C00", 24, "center");

            // Cancel (Left)
            drawButton(ctx, "HỦY BỎ", centerX - mainW - 10, bottomY, mainW, btnH, "#555", () => {
                this.isSellingMode = false;
                this.sellList = [];
            }, "white", 18);

            // Sell Action (Right)
            let sellText = this.sellList.length > 0 ? `BÁN (${this.sellList.length})` : "CHỌN TƯỚNG";
            let sellColor = this.sellList.length > 0 ? "#C00" : "#333";

            drawButton(ctx, sellText, centerX + 10, bottomY, mainW, btnH, sellColor, () => {
                if (this.sellList.length === 0) return;

                let highVal = this.sellList.some(id => {
                    let h = DB.data.heroes.find(x => x.id === id);
                    return h && (h.stars >= 3 || h.level >= 10);
                });

                if (highVal) {
                    this.showSellWarning = true;
                } else {
                    let earned = DB.sellHeroes(this.sellList);
                    addToast(`Bán ${this.sellList.length} tướng, +${earned}G!`, "#FFD700");
                    this.sellList = [];
                    this.isSellingMode = false;
                    this.refreshHeroList();
                }
            }, "white", 18);
        }

        if (this.showSellWarning) {
            drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.8)");
            let wx = (GAME.Canvas.Width - 400) / 2, wy = (GAME.Canvas.Height - 300) / 2;
            drawRoundedRect(ctx, wx, wy, 400, 300, 15, "#222"); ctx.strokeStyle = "red"; ctx.lineWidth = 2; ctx.strokeRect(wx, wy, 400, 300);
            drawText(ctx, "CẢNH BÁO", GAME.Canvas.Width / 2, wy + 50, "red", 30, "center");
            drawText(ctx, "Bạn đang chọn bán tướng", GAME.Canvas.Width / 2, wy + 100, "white", 18, "center");
            drawText(ctx, "có Level hoặc Sao cao (>=3⭐).", GAME.Canvas.Width / 2, wy + 130, "white", 18, "center");
            drawText(ctx, "Bạn có chắc chắn muốn bán?", GAME.Canvas.Width / 2, wy + 160, "white", 18, "center");

            drawButton(ctx, "HỦY", wx + 20, wy + 220, 100, 50, "#555", () => this.showSellWarning = false);
            drawButton(ctx, "BÁN LUÔN", wx + 280, wy + 220, 100, 50, "#C00", () => {
                let earned = DB.sellHeroes(this.sellList);
                addToast(`Đã bán ${this.sellList.length} tướng, nhận ${earned} vàng!`, "#FFD700");
                this.sellList = [];
                this.isSellingMode = false;
                this.showSellWarning = false;
                this.refreshHeroList();
            });
        }
    }
    else {
        if (this.mergeList.length > 0) {
            let btnW = 240;
            drawButton(ctx, `XÁC NHẬN GỘP (${this.mergeList.length})`, centerX - btnW / 2, bottomY, btnW, 50, "#0A0", () => {
                DB.mergeHeroes(this.selectedHeroId, this.mergeList);
                this.showUpgradeDialog = false;
                this.mergeList = [];
                this.selectedHeroId = null;
                this.refreshHeroList();
            }, "white", 18);
        }
    }
    drawToasts(ctx);
};

HeroManageState.drawInventory = function (ctx) {
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.9)");
    let typeInfo = Object.values(ITEM_TYPES).find(t => t.id === this.showInventorySlot);
    drawText(ctx, "KHO ĐỒ: " + typeInfo.name.toUpperCase(), GAME.Canvas.Width / 2, 32, "white", 20, "center");

    let closeX = GAME.Canvas.Width - 100;
    drawButton(ctx, "ĐÓNG", closeX, 20, 80, 40, "#555", () => {
        this.showInventorySlot = null;
        this.inventoryScroll = 0;
    });

    let filtered = DB.data.inventory.filter(i => i.type === this.showInventorySlot);

    const rarityOrder = ["SR", "R", "A", "B", "C", "D", "E", "F"];
    filtered.sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

    let cardW = 350, cardH = 120; // Increased Size
    let startX = (GAME.Canvas.Width - cardW) / 2;
    let startY = 100;

    let curHero = DB.data.heroes.find(h => h.id === this.selectedHeroId);
    let equippedId = curHero.equipments[this.showInventorySlot];

    // "Unequip" Button
    if (equippedId) {
        drawButton(ctx, "GỠ TRANG BỊ", startX, startY, cardW, 40, "#C00", () => {
            DB.unequipItem(this.selectedHeroId, this.showInventorySlot);
            this.showInventorySlot = null;
            this.inventoryScroll = 0;
        });
        startY += 60;
    }

    // Scroll logic
    let maxVisibleItems = Math.floor((GAME.Canvas.Height - startY - 20) / (cardH + 10));
    let maxScroll = Math.max(0, filtered.length - maxVisibleItems);

    // Clamp scroll
    if (this.inventoryScroll < 0) this.inventoryScroll = 0;
    if (this.inventoryScroll > maxScroll) this.inventoryScroll = maxScroll;

    // Scroll buttons
    if (this.inventoryScroll > 0) {
        drawButton(ctx, "▲", startX + cardW + 10, startY, 40, 40, "#555", () => this.inventoryScroll--);
    }
    if (this.inventoryScroll < maxScroll) {
        drawButton(ctx, "▼", startX + cardW + 10, startY + 50, 40, 40, "#555", () => this.inventoryScroll++);
    }

    // Render only visible items
    let startIdx = this.inventoryScroll;
    let endIdx = Math.min(filtered.length, startIdx + maxVisibleItems);

    for (let idx = startIdx; idx < endIdx; idx++) {
        let item = filtered[idx];
        let y = startY + (idx - startIdx) * (cardH + 10);

        let isEquipped = item.id === equippedId;
        let equippedByOther = item.equippedTo && item.equippedTo !== this.selectedHeroId;

        // Background
        let bgColor = isEquipped ? "#222" : (equippedByOther ? "#3E2723" : "#333");
        drawRoundedRect(ctx, startX, y, cardW, cardH, 10, bgColor);

        // Icon (Larger)
        drawItemIcon(ctx, item, startX + 10, y + 10, 100);

        // Stats with icons and percentage formatting
        let mainIcon = item.mainStat.type === 'atk' ? "⚔️" :
            (item.mainStat.type === 'hp' ? "❤️" :
                (item.mainStat.type === 'def' ? "🛡" :
                    (item.mainStat.type === 'atkSpd' ? "⚡" :
                        (item.mainStat.type === 'spd' ? "👟" : item.mainStat.type.toUpperCase()))));

        let subIcon = item.subStat.type === 'atk' ? "⚔️" :
            (item.subStat.type === 'hp' ? "❤️" :
                (item.subStat.type === 'def' ? "🛡" :
                    (item.subStat.type === 'atkSpd' ? "⚡" :
                        (item.subStat.type === 'spd' ? "👟" : item.subStat.type.toUpperCase()))));

        // Format values - show SPD and ATKSPD as percentages
        let mainVal = (item.mainStat.type === 'spd' || item.mainStat.type === 'atkSpd')
            ? `${Math.round(item.mainStat.val * 100)}%`
            : Math.round(item.mainStat.val);
        let subVal = (item.subStat.type === 'spd' || item.subStat.type === 'atkSpd')
            ? `${Math.round(item.subStat.val * 100)}%`
            : Math.round(item.subStat.val);

        drawText(ctx, `${item.mainStat.type.toUpperCase()} : ${mainVal}`, startX + 120, y + 40, "yellow", 16, "left");
        drawText(ctx, `${item.subStat.type.toUpperCase()} : ${subVal}`, startX + 120, y + 65, "white", 14, "left");

        // Button moved to bottom right corner
        let btnColor = isEquipped ? "#4CAF50" : "#FF9800";
        let btnText = isEquipped ? "ĐANG MẶC" : "TRANG BỊ";

        if (equippedByOther) {
            btnColor = "#795548";
            btnText = "ĐANG DÙNG";
        }

        drawButton(ctx, btnText, startX + cardW - 110, y + cardH - 50, 100, 40, btnColor, () => {
            if (isEquipped) return;
            DB.equipItem(this.selectedHeroId, item.id, this.showInventorySlot);
            this.showInventorySlot = null;
            this.inventoryScroll = 0;
        }, "white", 14);
    }
};
