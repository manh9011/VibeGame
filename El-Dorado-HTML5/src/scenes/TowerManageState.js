/**
 * --- TOWER MANAGE STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, TOWER_TYPES, CLASS_TYPES } from '../context.js';
import { drawGlobalHeader, drawButton, drawText, drawRoundedRect, drawRect, addToast, drawToasts, drawTowerCard, drawHeroCard, drawRoundedStroke } from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';

export var TowerManageState = new Enjine.GameState();
const TOWER_SHAPES = ["🏚️", "🏠", "🏯", "🏰", "🗼", "🏙️"];

const HERO_ICON_MAP = new Map(Object.values(CLASS_TYPES).map(t => [t.id, t.icon]));
function getHeroIcon(hero) {
    if (!hero) return "?";
    return HERO_ICON_MAP.get(hero.type) || hero.icon || "?";
}

TowerManageState.Enter = function () {
    this.selectedTowerId = null;
    this.scroll = 0;
    this.scrollAccumulator = 0;
    this.upgradeMode = false;
    this.materialIds = [];
    this.isDragging = false;
    this.lastDragX = null;
    this.heroSelectModal = null; // { open: true, towerId, slotIndex }

    // wheel handler for hero-select modal paging
    this._wheelHandler = (e) => {
        if (this.heroSelectModal && this.heroSelectModal.open) {
            e.preventDefault();
            let dir = e.deltaY > 0 ? 1 : -1;
            this.heroSelectModal.page = (this.heroSelectModal.page || 0) + dir;
            if (this.heroSelectModal.page < 0) this.heroSelectModal.page = 0;
        }
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('wheel', this._wheelHandler, { passive: false });
    }
};

TowerManageState.Draw = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.7)");
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    drawText(ctx, "QUẢN LÝ CHÒI CANH", GAME.Canvas.Width / 2, 32, "white", 24, "center");

    let modalOpen = this.heroSelectModal && this.heroSelectModal.open;
    let savedClick = null;
    let savedDown = null;
    if (modalOpen) {
        savedClick = Enjine.Mouse.Clicked;
        savedDown = Enjine.Mouse.Down;
        Enjine.Mouse.Clicked = false;
        Enjine.Mouse.Down = false;
    }

    // --- TOP BUTTON BAR ---
    let buttonY = 55;
    let btnGap = 12;
    let btnW = 45;
    let btnH = 35;
    let startBtnX = 20;

    drawButton(ctx, "❮ Về Menu", startBtnX, buttonY, 100, btnH, "#555", () => GAME.ChangeState(MainMenuState), "white", 12);

    let bx = startBtnX + 115;
    drawButton(ctx, this.upgradeMode ? "Hủy Nâng" : "Nâng cấp", bx, buttonY, 120, btnH, this.upgradeMode ? "#C62828" : "#FF9800", () => {
        this.upgradeMode = !this.upgradeMode;
        this.materialIds = [];
        if (!this.upgradeMode) this.selectedTowerId = null;
    }, "white", 12);

    bx += 135;
    let gachaX = bx;
    drawButton(ctx, "Quay chòi 100k", gachaX, buttonY, 140, btnH, "#4CAF50", () => {
        let res = DB.gachaBulk("tower", 1, 100000);
        if (res.error) addToast(res.error, "#F44336");
        else addToast("Đã nhận 1 chòi mới!", "#4CAF50");
    }, "white", 11);

    // Draw action buttons for selected tower (if any) - left of gacha button
    let tower = this.selectedTowerId ? DB.data.towers.find(t => t.id === this.selectedTowerId) : null;
    if (tower) {
        let assignedSlot = DB.data.towerTeam.findIndex(id => id === tower.id);
        let actionGap = 10;

        if (this.upgradeMode) {
            let canMerge = this.materialIds.length > 0;
            let mergeW = 140;
            let mergeX = gachaX + 140 + actionGap;
            drawButton(ctx, `Gộp (${this.materialIds.length})`, mergeX, buttonY, mergeW, btnH, canMerge ? "#4CAF50" : "#555", () => {
                if (!canMerge) return;
                let res = DB.mergeTowers(tower.id, this.materialIds);
                if (res.success) {
                    addToast(res.msg, "#4CAF50");
                    this.materialIds = [];
                } else addToast(res.msg, "#F44336");
            }, "white", 11);
        } else {
            // Slot buttons (1-4)
            let slotStep = 50;
            let slotGroupW = slotStep * 4;
            let upgradeW = 70;
            let removeW = 50;
            let totalW = slotGroupW + actionGap + upgradeW + actionGap + removeW;
            let slotX = gachaX + 140 + actionGap;
            for (let i = 0; i < 4; i++) {
                let selected = assignedSlot === i;
                drawButton(ctx, `${i + 1}`, slotX + i * slotStep, buttonY, btnW, btnH, selected ? "#4CAF50" : "#444", () => {
                    for (let j = 0; j < 4; j++) {
                        if (DB.data.towerTeam[j] === tower.id) DB.data.towerTeam[j] = null;
                    }
                    DB.data.towerTeam[i] = tower.id;
                    DB.save();
                    addToast(`Đã gán vị trí ${i + 1}`, "#4CAF50");
                }, "white", 12);
            }

            // Remove button
            let remBtnX = slotX + slotGroupW + actionGap + upgradeW + actionGap;
            if (assignedSlot !== -1) {
                drawButton(ctx, "Gỡ", remBtnX, buttonY, 50, btnH, "#C62828", () => {
                    DB.data.towerTeam[assignedSlot] = null;
                    DB.save();
                    addToast("Đã gỡ khỏi đội hình", "#FF7043");
                }, "white", 12);
            }

            // Upgrade star button
            let canUpgrade = tower.level >= 100 && tower.stars < tower.maxStars;
            drawButton(ctx, "Nâng sao", slotX + slotGroupW + actionGap, buttonY, 70, btnH, canUpgrade ? "#FF9800" : "#555", () => {
                if (!canUpgrade) return;
                let res = DB.upgradeTowerStar(tower.id);
                if (res.success) addToast(res.msg, "#4CAF50");
                else addToast(res.msg, "#F44336");
            }, "white", 11);
        }
    }

    // --- TEAM DISPLAY ---
    let teamY = 105;
    drawText(ctx, "CHÒI CANH XUẤT CHIẾN", GAME.Canvas.Width / 2, teamY, "white", 16, "center");

    let slotSize = 70;
    let slotGap = 12;
    let teamRowW = 4 * slotSize + 3 * slotGap;
    let teamStartX = (GAME.Canvas.Width - teamRowW) / 2;
    let teamStartY = teamY + 20;

    for (let i = 0; i < 4; i++) {
        let x = teamStartX + i * (slotSize + slotGap);
        let y = teamStartY;
        let tId = DB.data.towerTeam[i];
        drawRoundedRect(ctx, x, y, slotSize, slotSize, 8, "#333");

        if (tId) {
            let t = DB.data.towers.find(tower => tower.id === tId);
            if (t) {
                let shape = TOWER_SHAPES[Math.min(TOWER_SHAPES.length - 1, (t.stars || 1) - 1)];
                drawText(ctx, shape, x + slotSize / 2, y + 30, "white", 28, "center");
                drawText(ctx, `Lv.${t.level}`, x + slotSize / 2, y + 55, "yellow", 10, "center");
            }
        } else {
            drawText(ctx, "+", x + slotSize / 2, y + 35, "#777", 28, "center");
        }

        if (Enjine.Mouse.Clicked &&
            Enjine.Mouse.X >= x && Enjine.Mouse.X <= x + slotSize &&
            Enjine.Mouse.Y >= y && Enjine.Mouse.Y <= y + slotSize) {
            Enjine.Mouse.Clicked = false;
            if (tId) this.selectedTowerId = tId;
        }
    }

    // --- TOWER LIST IN GRID 2x5 ---

    let rows = 2;
    let cols = 10;
    
    let cardW = (GAME.Canvas.Width - 100) / cols - 10;
    let cardH = 220;
    let cardGap = 10;

    let maxVisibleItems = rows * cols;
    let gridY = teamStartY + slotSize + 30;

    // Prepare tower list: deployed first, then rest sorted by stars/level
    let deployedTowerIds = new Set(DB.data.towerTeam.filter(id => id !== null));
    let deployedTowers = [];
    let otherTowers = [];

    DB.data.towers.forEach(tower => {
        if (deployedTowerIds.has(tower.id)) {
            deployedTowers.push(tower);
        } else {
            otherTowers.push(tower);
        }
    });

    // Sort deployed towers by their slot order
    deployedTowers.sort((a, b) => {
        let slotA = DB.data.towerTeam.indexOf(a.id);
        let slotB = DB.data.towerTeam.indexOf(b.id);
        return slotA - slotB;
    });

    // Sort other towers by stars/level
    otherTowers.sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        return b.level - a.level;
    });

    let displayTowers = [...deployedTowers, ...otherTowers];
    let totalScreens = Math.ceil(displayTowers.length / maxVisibleItems);
    let maxScroll = Math.max(0, totalScreens - 1);

    // Handle scrolling with drag
    if (Enjine.Mouse.Down) {
        if (this.lastDragX !== null) {
            let dx = Enjine.Mouse.X - this.lastDragX;
            if (Math.abs(dx) > 2) this.isDragging = true;

            this.scrollAccumulator -= dx;
            while (this.scrollAccumulator >= cardW + cardGap) {
                this.scroll++;
                this.scrollAccumulator -= (cardW + cardGap);
            }
            while (this.scrollAccumulator <= -(cardW + cardGap)) {
                this.scroll--;
                this.scrollAccumulator += (cardW + cardGap);
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

    // Draw scroll buttons (page-based)
    if (this.scroll > 0)
        drawButton(ctx, "❮", 10, gridY + cardH - 20, 30, 40, "#777", () => this.scroll--);
    if (this.scroll < maxScroll)
        drawButton(ctx, "❯", GAME.Canvas.Width - 40, gridY + cardH - 20, 30, 40, "#777", () => this.scroll++);

    // Draw tower cards in 2x5 grid
    let cardStartX = 50;
    let startIdx = this.scroll * maxVisibleItems;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let idx = startIdx + r * cols + c;
            if (idx >= displayTowers.length) break;

            let t = displayTowers[idx];
            let x = cardStartX + c * (cardW + cardGap);
            let y = gridY + r * (cardH + cardGap);

            let isSelected = this.selectedTowerId === t.id;
            let isDeployed = deployedTowerIds.has(t.id);
            let isMerge = this.upgradeMode && this.materialIds.includes(t.id);

            // Prepare embedded-hero slots geometry (used for click detection)
            let slotSize = 28;
            if (!t.embeddedHeroes) t.embeddedHeroes = [];
            let totalSlotsW = 4 * slotSize + 3 * 6;
            let startSlotsX = x + Math.max(8, Math.floor((cardW - totalSlotsW) / 2));
            let sy = y + cardH - slotSize - 10;

            let clickInSlot = false;
            if (Enjine.Mouse.Clicked) {
                for (let si = 0; si < 4; si++) {
                    let sx = startSlotsX + si * (slotSize + 6);
                    if (Enjine.Mouse.X >= sx && Enjine.Mouse.X <= sx + slotSize && Enjine.Mouse.Y >= sy && Enjine.Mouse.Y <= sy + slotSize) {
                        clickInSlot = true;
                        break;
                    }
                }
            }

            if (clickInSlot) {
                let savedClick = Enjine.Mouse.Clicked;
                Enjine.Mouse.Clicked = false;
                drawTowerCard(ctx, t, x, y, cardW, cardH, isSelected, isDeployed, isMerge, () => {
                    if (this.isDragging) return;

                    if (this.upgradeMode) {
                        // Can't merge deployed towers
                        if (isDeployed) {
                            addToast("KhÃ´ng thá»ƒ dÃ¹ng chÃ²i Ä‘ang chiáº¿n Ä‘áº¥u lÃ m nguyÃªn liá»‡u!", "#F44336");
                            return;
                        }

                        if (!this.selectedTowerId) {
                            this.selectedTowerId = t.id;
                        } else if (t.id === this.selectedTowerId) {
                            this.selectedTowerId = null;
                            this.materialIds = [];
                        } else {
                            let idx = this.materialIds.indexOf(t.id);
                            if (idx === -1) {
                                if (this.materialIds.length < 6) this.materialIds.push(t.id);
                            } else {
                                this.materialIds.splice(idx, 1);
                            }
                        }
                    } else {
                        this.selectedTowerId = t.id;
                    }
                });
                Enjine.Mouse.Clicked = savedClick;
            } else {
                drawTowerCard(ctx, t, x, y, cardW, cardH, isSelected, isDeployed, isMerge, () => {
                    if (this.isDragging) return;

                    if (this.upgradeMode) {
                        // Can't merge deployed towers
                        if (isDeployed) {
                        addToast("Không thể dùng chòi đang chiến đấu làm nguyên liệu!", "#F44336");
                        return;
                    }

                    if (!this.selectedTowerId) {
                        this.selectedTowerId = t.id;
                    } else if (t.id === this.selectedTowerId) {
                        this.selectedTowerId = null;
                        this.materialIds = [];
                    } else {
                        let idx = this.materialIds.indexOf(t.id);
                        if (idx === -1) {
                            if (this.materialIds.length < 6) this.materialIds.push(t.id);
                        } else {
                            this.materialIds.splice(idx, 1);
                        }
                    }
                    } else {
                        this.selectedTowerId = t.id;
                    }
                });
            }
            // Draw embedded-hero slots on the card (centered at bottom)
            for (let si = 0; si < 4; si++) {
                let sx = startSlotsX + si * (slotSize + 6);
                // small slot: neutral border, show only hero icon (no colored background)
                drawRoundedRect(ctx, sx, sy, slotSize, slotSize, 6, "rgba(0,0,0,0)");
                drawRoundedStroke(ctx, sx, sy, slotSize, slotSize, 6, "#444", 1);
                let hid = t.embeddedHeroes[si];
                if (hid) {
                    let hh = DB.data.heroes.find(h => h.id === hid);
                    if (hh) {
                        drawText(ctx, getHeroIcon(hh), sx + slotSize / 2, sy + 13, "white", 16, "center");
                        drawText(ctx, `${hh.stars || 1}?`, sx + slotSize / 2, sy + slotSize - 4, "#FFD54F", 8, "center");
                        drawText(ctx, "x", sx + slotSize - 6, sy + 10, "#FF7043", 9, "center");
                    }
                } else {
                    drawText(ctx, "+", sx + slotSize / 2, sy + slotSize / 2 + 4, "#777", 18, "center");
                }

                // handle click on slot -> remove with small X or open hero select modal
                if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= sx && Enjine.Mouse.X <= sx + slotSize && Enjine.Mouse.Y >= sy && Enjine.Mouse.Y <= sy + slotSize) {
                    Enjine.Mouse.Clicked = false;
                    let isRemove = hid && Enjine.Mouse.X >= sx + slotSize - 12 && Enjine.Mouse.Y <= sy + 12;
                    if (isRemove) {
                        let hh = DB.data.heroes.find(h => h.id === hid);
                        if (hh) delete hh.embeddedIn;
                        t.embeddedHeroes[si] = null;
                        DB.save();
                        addToast("Đã tháo tướng khỏi chòi!", "#FF7043");
                    } else {
                        let avail = DB.data.heroes.filter(h => {
                            if (DB.data.team && DB.data.team.includes(h.id)) return false;
                            if (h.embeddedIn) return false;
                            return true;
                        });
                        if (avail.length === 0) {
                            addToast("Không có tướng để gắn!", "#F44336");
                        } else {
                            this.heroSelectModal = { open: true, towerId: t.id, slotIndex: si };
                        }
                    }
                }
            }
        }
    }

    drawToasts(ctx);
    if (modalOpen) {
        Enjine.Mouse.Clicked = savedClick;
        Enjine.Mouse.Down = savedDown;
    }
    // Hero selection modal (full-card hero list on dim background)
    if (this.heroSelectModal && this.heroSelectModal.open) {
        // dim background
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, GAME.Canvas.Width, GAME.Canvas.Height);
        ctx.restore();

        // modal area
        let modalW = Math.min(GAME.Canvas.Width - 160, 1000);
        let modalH = Math.min(GAME.Canvas.Height - 160, 720);
        let mx = (GAME.Canvas.Width - modalW) / 2;
        let my = (GAME.Canvas.Height - modalH) / 2;
        drawRoundedRect(ctx, mx, my, modalW, modalH, 12, "#111");
        drawRoundedStroke(ctx, mx, my, modalW, modalH, 12, "#333", 2);
        drawText(ctx, "Chọn tướng để gắn vào chòi", mx + 20, my + 22, "white", 16, "left");
        // close button
        drawButton(ctx, "X", mx + modalW - 36, my + 12, 24, 24, "#C62828", () => {
            this.heroSelectModal = null;
        }, "white", 12);

        // gather available heroes: not deployed and not embedded anywhere
        let avail = DB.data.heroes.filter(h => {
            if (DB.data.team && DB.data.team.includes(h.id)) return false;
            if (h.embeddedIn) return false;
            return true;
        });

        // paging/scroll support for modal
        if (!this.heroSelectModal.page) this.heroSelectModal.page = 0;
        let page = this.heroSelectModal.page || 0;
        let cardW = Math.min(220, Math.floor((modalW - 60) / 3));
        let cardH = 260;
        let cols = Math.max(1, Math.floor((modalW - 60) / (cardW + 10)));
        let rowsVisible = Math.max(1, Math.floor((modalH - 120) / (cardH + 12)));
        let perPage = Math.max(1, cols * rowsVisible);
        let totalPages = Math.ceil(avail.length / perPage);
        if (page >= totalPages) page = totalPages - 1;

        // prev/next buttons
        if (page > 0 && drawButton) drawButton(ctx, "◀", mx + 20, my + modalH - 40, 40, 30, "#777", () => { this.heroSelectModal.page = Math.max(0, (this.heroSelectModal.page || 0) - 1); });
        if (page < totalPages - 1 && drawButton) drawButton(ctx, "▶", mx + modalW - 60, my + modalH - 40, 40, 30, "#777", () => { this.heroSelectModal.page = (this.heroSelectModal.page || 0) + 1; });

        let startIdx = page * perPage;
        for (let i = 0; i < perPage; i++) {
            let ai = startIdx + i;
            if (ai >= avail.length) break;
            let col = i % cols;
            let row = Math.floor(i / cols);
            let hx = mx + 20 + col * (cardW + 10);
            let hy = my + 50 + row * (cardH + 12);
            drawHeroCard(ctx, avail[ai], hx, hy, cardW, cardH, false, false, false, (() => {
                let heroIdx = ai;
                return () => {
                    let tId = this.heroSelectModal.towerId;
                    let slotIdx = this.heroSelectModal.slotIndex;
                    let dbTower = DB.data.towers.find(tt => tt.id === tId);
                    if (!dbTower) { addToast("Không tìm thấy chòi!", "#F44336"); this.heroSelectModal = null; return; }
                    if (!dbTower.embeddedHeroes) dbTower.embeddedHeroes = [];
                    // free previous occupant of slot if any
                    if (dbTower.embeddedHeroes[slotIdx]) {
                        let prev = dbTower.embeddedHeroes[slotIdx];
                        let ph = DB.data.heroes.find(hh => hh.id === prev);
                        if (ph) delete ph.embeddedIn;
                    }
                    let hObj = DB.data.heroes.find(hh => hh.id === avail[heroIdx].id);
                    if (hObj) DB.unequipAll(hObj);
                    dbTower.embeddedHeroes[slotIdx] = avail[heroIdx].id;
                    if (hObj) hObj.embeddedIn = dbTower.id;
                    DB.save();
                    addToast("Đã gắn tướng vào chòi", "#4CAF50");
                    this.heroSelectModal = null;
                };
            })());
        }

        // close modal if click outside modal rect
        if (Enjine.Mouse.Clicked) {
            if (Enjine.Mouse.X < mx || Enjine.Mouse.X > mx + modalW || Enjine.Mouse.Y < my || Enjine.Mouse.Y > my + modalH) {
                this.heroSelectModal = null;
                Enjine.Mouse.Clicked = false;
            }
        }
    }
};

// cleanup wheel listener when leaving state
TowerManageState.Exit = function () {
    if (this._wheelHandler && typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('wheel', this._wheelHandler);
    }
    this._wheelHandler = null;
};
