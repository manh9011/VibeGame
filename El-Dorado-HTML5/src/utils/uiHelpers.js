/**
 * --- UI COMPONENTS & HELPERS ---
 */
import { Enjine } from '../engine/core.js';
import { CLASS_TYPES, DB, RARITY, ITEM_TYPES } from '../context.js'; // Importing DB from context to avoid circular dep if needed, or pass data as args.
// Actually, for helpers, it's better to pass data as arguments to be pure, but some functions like drawGlobalHeader rely on DB.
// We accepted the plan to import DB from context.

// Performance optimization: Create lookup maps once at module load
let CLASS_TYPE_MAP = null;
let ITEM_TYPE_MAP = null;

function getClassTypeMap() {
    if (!CLASS_TYPE_MAP) {
        CLASS_TYPE_MAP = new Map();
        Object.values(CLASS_TYPES).forEach(t => CLASS_TYPE_MAP.set(t.id, t));
    }
    return CLASS_TYPE_MAP;
}

function getItemTypeMap() {
    if (!ITEM_TYPE_MAP) {
        ITEM_TYPE_MAP = new Map();
        Object.values(ITEM_TYPES).forEach(t => ITEM_TYPE_MAP.set(t.id, t));
    }
    return ITEM_TYPE_MAP;
}

export const activeToasts = [];

export function addToast(message, color = "#4CAF50", duration = 2000) {
    activeToasts.push({
        message: message,
        color: color,
        duration: duration,
        startTime: Date.now()
    });
}

export function drawToasts(ctx) {
    if (activeToasts.length === 0) return;
    let now = Date.now();
    let y = 100;

    // Filter expired
    for (let i = activeToasts.length - 1; i >= 0; i--) {
        if (now - activeToasts[i].startTime > activeToasts[i].duration) {
            activeToasts.splice(i, 1);
        }
    }

    activeToasts.forEach((t, i) => {
        let elapsed = now - t.startTime;
        let alpha = 1;
        if (elapsed > t.duration - 500) alpha = (t.duration - elapsed) / 500;

        ctx.globalAlpha = alpha;
        let w = ctx.measureText(t.message).width + 40;
        let x = (ctx.canvas.width - w) / 2;

        drawRoundedRect(ctx, x, y + i * 50, w, 40, 10, "rgba(0,0,0,0.8)");
        drawText(ctx, t.message, ctx.canvas.width / 2, y + i * 50 + 28, t.color, 20, "center");
        ctx.globalAlpha = 1.0;
    });
}

export function drawItemIcon(ctx, item, x, y, size) {
    let rarityKey = item.rarity;
    let rData = RARITY[rarityKey];
    let typeData = getItemTypeMap().get(item.type);

    drawRoundedRect(ctx, x, y, size, size, 5, rData.color); // Rarity BG
    drawRect(ctx, x + 2, y + 2, size - 4, size - 4, "rgba(0,0,0,0.5)"); // Dark inner

    ctx.save();
    ctx.textBaseline = "middle";
    drawText(ctx, typeData.icon, x + size / 2, y + size / 2, "white", size * 0.6, "center");
    ctx.restore();

    // Could draw stars or rarity letter
    drawText(ctx, rarityKey, x + size - 5, y + size - 5, "white", 10, "right");
}

export function drawRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

export function drawRoundedRect(ctx, x, y, w, h, r, color) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawRoundedStroke(ctx, x, y, w, h, r, color, lineWidth = 1) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
}

export function drawCircle(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawText(ctx, text, x, y, color = "white", size = 20, align = "left", fontFamily = null) {
    ctx.fillStyle = color;
    // Text fonts first, emoji font as fallback
    let fontNames = fontFamily ? fontFamily : '"Noto Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif, "Noto Color Emoji"';
    ctx.font = `${size}px ${fontNames}`;
    ctx.textAlign = align;

    // Auto-add border to emoji (except stars) for better visibility
    const hasEmoji = /[^\x00-\x7F]/.test(text);
    const isStarEmoji = text.includes('⭐') || text.includes('🌟');
    const isPlainText = /^[a-zA-Z0-9\s.,!?:-]+$/.test(text);

    if (hasEmoji && !isStarEmoji && !isPlainText) {
        // Add 2px black stroke for emoji (increased for visibility)
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeText(text, x, y);
        ctx.restore();
    }

    ctx.fillText(text, x, y);
}

export function drawBadge(ctx, x, y, number, bgColor = "red", textColor = "white") {
    drawCircle(ctx, x, y, 12, bgColor);
    ctx.fillStyle = textColor;
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(number, x, y + 4);
}

export function drawButton(ctx, text, x, y, w, h, color = "#444", callback, textColor = "white", fontSize = 16, withShadow = false, fontFamily = null) {
    // Only render shadow if explicitly requested for performance
    if (withShadow) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        drawRoundedRect(ctx, x, y, w, h, 10, color);
        ctx.restore();
    } else {
        drawRoundedRect(ctx, x, y, w, h, 10, color);
    }

    // Simplified highlight gradient for better performance
    // Use rounded rect for gloss to match button shape
    ctx.save();
    ctx.globalAlpha = 0.1;
    drawRoundedRect(ctx, x, y, w, h / 2, 10, "#FFFFFF");
    ctx.restore();

    let lines = text.split('\n');
    let lineH = fontSize * 1.2;
    let startY = y + h / 2 - (lines.length - 1) * lineH / 2 + fontSize / 2 - 2;

    for (let i = 0; i < lines.length; i++) {
        drawText(ctx, lines[i], x + w / 2, startY + i * lineH, textColor, fontSize, "center", fontFamily);
    }

    if (Enjine.Mouse.Clicked &&
        Enjine.Mouse.X >= x && Enjine.Mouse.X <= x + w &&
        Enjine.Mouse.Y >= y && Enjine.Mouse.Y <= y + h) {
        Enjine.Mouse.Clicked = false;
        if (callback) callback();
    }
}

// === HELPER VẼ GAME GLOBAL ===

export function drawPlayerBase(ctx, x, y, w, h) {
    let hpLvl = DB.data.baseStats.hpLvl;

    // --- STYLE CONFIG ---
    let baseColor = "#8D6E63"; // Wood (Tier 1)
    let accentColor = "#5D4037";
    let detailColor = "#3E2723";
    let tier = 1;

    if (hpLvl >= 20) { // Stone (Tier 2)
        baseColor = "#9E9E9E";
        accentColor = "#616161";
        detailColor = "#424242";
        tier = 2;
    }
    if (hpLvl >= 50) { // Fortress (Tier 3)
        baseColor = "#78909C"; // Blue Grey
        accentColor = "#455A64";
        detailColor = "#263238";
        tier = 3;
    }
    if (hpLvl >= 80) { // Citadel (Tier 4)
        baseColor = "#ECEFF1"; // White/Marble
        accentColor = "#FFC107"; // Gold
        detailColor = "#1A237E"; // Royal Blue
        tier = 4;
    }

    // --- DRAW ---
    let bodyH = 100;
    if (tier >= 2) bodyH = 120;
    if (tier >= 3) bodyH = 140;

    let bodyY = y + h - bodyH;
    let pad = 10;

    // Main Block
    ctx.fillStyle = baseColor;
    ctx.fillRect(x + pad, bodyY, w - pad * 2, bodyH);
    ctx.strokeStyle = detailColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + pad, bodyY, w - pad * 2, bodyH);

    // Door (Arch)
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    let doorH = 40;
    ctx.moveTo(x + w / 2 - 15, bodyY + bodyH);
    ctx.lineTo(x + w / 2 - 15, bodyY + bodyH - doorH + 15);
    ctx.arc(x + w / 2, bodyY + bodyH - doorH + 15, 15, Math.PI, 0);
    ctx.lineTo(x + w / 2 + 15, bodyY + bodyH);
    ctx.fill();

    // Windows
    ctx.fillStyle = accentColor;
    if (tier === 1) {
        drawRect(ctx, x + 30, bodyY + 20, 10, 10, accentColor);
        drawRect(ctx, x + 60, bodyY + 20, 10, 10, accentColor);
    } else {
        // Narrow windows
        drawRect(ctx, x + 25, bodyY + 30, 10, 25, accentColor);
        drawRect(ctx, x + 65, bodyY + 30, 10, 25, accentColor);
    }

    // Roof / Battlements
    if (tier === 1) {
        // Wooden Roof
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(x, bodyY);
        ctx.lineTo(x + w / 2, bodyY - 40);
        ctx.lineTo(x + w, bodyY);
        ctx.fill();
    } else {
        // Battlements
        let cw = (w - pad * 2) / 5;
        ctx.fillStyle = baseColor;
        for (let i = 0; i < 5; i++) {
            if (i % 2 === 0) {
                ctx.fillRect(x + pad + i * cw, bodyY - 15, cw, 20);
                ctx.strokeRect(x + pad + i * cw, bodyY - 15, cw, 20);
            }
        }

        // Tower?
        if (tier >= 3) {
            let tw = 40;
            let th = 30;
            if (tier >= 4) th = 50;
            let ty = bodyY - 15 - th;

            ctx.fillStyle = baseColor;
            ctx.fillRect(x + w / 2 - tw / 2, ty, tw, th);
            ctx.strokeRect(x + w / 2 - tw / 2, ty, tw, th);

            // Tower Roof
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.moveTo(x + w / 2 - tw / 2 - 5, ty);
            ctx.lineTo(x + w / 2, ty - 25);
            ctx.lineTo(x + w / 2 + tw / 2 + 5, ty);
            ctx.fill();

            // Flag
            let fx = x + w / 2;
            let fy = ty - 25;
            ctx.strokeStyle = "#333";
            ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 30); ctx.stroke();

            ctx.fillStyle = tier === 4 ? "#F44336" : "#FFC107";
            ctx.beginPath();
            ctx.moveTo(fx, fy - 30);
            ctx.lineTo(fx + 20, fy - 20);
            ctx.lineTo(fx, fy - 10);
            ctx.fill();
        }
    }
}

export function drawEnemyBase(ctx, x, y, w, h) {
    // Enemy Base (Visual only)
    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(x + 10, y + h);
    ctx.lineTo(x + 10, y + 40);
    ctx.lineTo(x + 30, y + 60);
    ctx.lineTo(x + 50, y + 20);
    ctx.lineTo(x + 70, y + 60);
    ctx.lineTo(x + 90, y + 40);
    ctx.lineTo(x + 90, y + h);
    ctx.fill();

    // Door
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - 30, 20, 0, Math.PI * 2);
    ctx.fill();

    // Red Eyes
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x + w / 2 - 8, y + h - 35, 3, 0, Math.PI * 2);
    ctx.arc(x + w / 2 + 8, y + h - 35, 3, 0, Math.PI * 2);
    ctx.fill();
}

export function drawGlobalHeader(ctx, canvasWidth) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvasWidth, 50);
    drawText(ctx, `🏰 Lv.${DB.data.level}`, 20, 32, "#4CAF50", 24, "left");
    let goldText = DB.data.gold.toLocaleString();
    ctx.textAlign = "right";
    drawText(ctx, `💰 ${goldText}`, canvasWidth - 20, 32, "#FFD700", 24, "right");
    ctx.textAlign = "left";
}

export function drawTeamDisplay(ctx, yPos, showLabels = false, canvasWidth, slotSize = 140) {
    let slotGap = 20;
    let totalTeamW = 4 * slotSize + 3 * slotGap;
    let startX = (canvasWidth - totalTeamW) / 2;

    if (showLabels) drawText(ctx, "ĐỘI HÌNH RA TRẬN", canvasWidth / 2, yPos - 15, "#AAA", 20, "center");

    for (let i = 0; i < 4; i++) {
        let hIdx = DB.data.team[i];
        let x = startX + i * (slotSize + slotGap);

        drawRoundedRect(ctx, x, yPos, slotSize, slotSize, 12, "#333");

        let hero = null;
        if (hIdx) hero = DB.data.heroes.find(h => h.id === hIdx);

        if (hero) {
            let typeInfo = getClassTypeMap().get(hero.type);
            drawRoundedRect(ctx, x + 5, yPos + 5, slotSize - 10, slotSize - 10, 8, typeInfo.color);

            // Relative Sizing
            let center = x + slotSize / 2;
            let iconSize = slotSize * 0.4;
            let nameSize = Math.max(10, slotSize * 0.1);
            let starSize = Math.max(12, slotSize * 0.14); // slightly bigger
            let lvlSize = Math.max(12, slotSize * 0.14);

            // Icon (Smaller)
            drawText(ctx, typeInfo.icon, center, yPos + slotSize * 0.35, "white", iconSize, "center");

            // Name
            ctx.lineWidth = 3; ctx.strokeStyle = "black";
            ctx.font = `bold ${nameSize}px "Noto Sans", sans-serif`; ctx.textAlign = "center";
            ctx.strokeText(typeInfo.name.toUpperCase(), center, yPos + slotSize * 0.55);
            ctx.fillStyle = "white";
            ctx.fillText(typeInfo.name.toUpperCase(), center, yPos + slotSize * 0.55);

            let starIcon = hero.stars > 5 ? "🌟" : "⭐";
            let starCount = hero.stars > 5 ? hero.stars - 5 : hero.stars;
            let starStr = starIcon.repeat(starCount);

            // Stars below Name
            ctx.lineWidth = 3; ctx.strokeStyle = "black";
            ctx.font = `${starSize}px "Noto Sans", "Noto Color Emoji", sans-serif`;
            ctx.strokeText(starStr, center, yPos + slotSize * 0.72);
            drawText(ctx, starStr, center, yPos + slotSize * 0.72, "yellow", starSize, "center");

            // Level at Bottom (Inside)
            ctx.lineWidth = 3; ctx.strokeStyle = "black";
            ctx.font = `bold ${lvlSize}px "Noto Sans", sans-serif`; ctx.textAlign = "center";
            ctx.strokeText(`Lv.${hero.level}`, center, yPos + slotSize - 10);
            ctx.fillStyle = "white";
            ctx.fillText(`Lv.${hero.level}`, center, yPos + slotSize - 10);
        } else {
            drawText(ctx, "+", x + slotSize / 2, yPos + slotSize / 2 + 10, "#555", slotSize * 0.4, "center");
        }
    }
}

// Helper function to calculate total stats with equipment bonuses
function calculateTotalStats(hero, itemMap) {
    let stats = {
        hp: hero.hp,
        atk: hero.atk,
        def: hero.def,
        crit: hero.crit,
        eva: hero.eva,
        regen: hero.regen,
        spd: hero.spd,
        atkSpd: hero.atkSpd
    };

    // Add equipment bonuses
    if (hero.equipments && itemMap) {
        for (let slot = 0; slot < 4; slot++) {
            let itemId = hero.equipments[slot];
            if (itemId) {
                let item = itemMap.get(itemId);
                if (item) {
                    // Add main stat
                    if (item.mainStat.type === 'atk') stats.atk += item.mainStat.val;
                    else if (item.mainStat.type === 'def') stats.def += item.mainStat.val;
                    else if (item.mainStat.type === 'hp') stats.hp += item.mainStat.val;
                    else if (item.mainStat.type === 'spd') stats.spd += item.mainStat.val;
                    else if (item.mainStat.type === 'atkSpd') stats.atkSpd += item.mainStat.val;

                    // Add sub stat
                    if (item.subStat.type === 'atk') stats.atk += item.subStat.val;
                    else if (item.subStat.type === 'def') stats.def += item.subStat.val;
                    else if (item.subStat.type === 'hp') stats.hp += item.subStat.val;
                    else if (item.subStat.type === 'crit') stats.crit += item.subStat.val;
                    else if (item.subStat.type === 'eva') stats.eva += item.subStat.val;
                    else if (item.subStat.type === 'regen') stats.regen += item.subStat.val;
                    else if (item.subStat.type === 'spd') stats.spd += item.subStat.val;
                    else if (item.subStat.type === 'atkSpd') stats.atkSpd += item.subStat.val;
                }
            }
        }
    }

    return stats;
}

export function drawHeroCard(ctx, hero, x, y, w, h, isSelected, isTeam, isMerge, callback, itemMap = null) {
    let typeInfo = getClassTypeMap().get(hero.type);

    // Define colors based on star count
    let starColors = {
        1: { bg: "#1A1A1A", border: "#444" },
        2: { bg: "#1E1E1E", border: "#555" },
        3: { bg: "#222", border: "#666" },
        4: { bg: "#2A2A2A", border: "#777" },
        5: { bg: "#333", border: "#888" },
        6: { bg: "#2D1F2D", border: "#9C27B0" },  // Purple tint
        7: { bg: "#2D1F2D", border: "#BA68C8" },
        8: { bg: "#311B31", border: "#CE93D8" },
        9: { bg: "#351D35", border: "#E1BEE7" },
        10: { bg: "#3A203A", border: "#F3E5F5" }
    };

    let starColor = starColors[hero.stars] || starColors[1];
    let bgColor = starColor.bg;
    let borderColor = starColor.border;

    if (isSelected) borderColor = "#FFD700";
    if (isMerge) borderColor = "#0A0";
    if (isTeam && !isSelected) borderColor = "#448AFF";

    drawRoundedRect(ctx, x, y, w, h, 10, bgColor);

    // Enhanced border for high-star heroes (simplified for performance)
    let lw = isSelected || isMerge ? 3 : (hero.stars >= 6 ? 2 : 1);

    // Simple pulsing effect for 6+ stars (no gradients, just line width pulse)
    if (hero.stars >= 6 && !isSelected && !isMerge) {
        if (!window.heroBorderPulse) window.heroBorderPulse = 0;
        window.heroBorderPulse += 0.05;
        if (window.heroBorderPulse > Math.PI * 2) window.heroBorderPulse = 0;

        // Pulse between 2 and 3 pixels
        lw = 2 + Math.abs(Math.sin(window.heroBorderPulse)) * 1;
    }

    drawRoundedStroke(ctx, x, y, w, h, 10, borderColor, lw);

    // Add subtle inner glow for 6+ stars (static, no animation)
    if (hero.stars >= 6) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        drawRoundedStroke(ctx, x + 2, y + 2, w - 4, h - 4, 8, borderColor, 1);
        ctx.restore();
    }

    if (isTeam && !isSelected) {
        ctx.fillStyle = "rgba(0,0,255,0.1)"; ctx.fill();
    }

    // Top Section
    drawText(ctx, typeInfo.icon, x + w / 2, y + 45, "white", 50, "center");
    drawText(ctx, typeInfo.name.toUpperCase(), x + w / 2, y + 65, "#FF9800", 14, "center"); // Moved up slightly

    // Star display: 1-5 use ⭐, 6-10 use 🌟
    // 6-10 stars: show (stars - 5) 🌟 icons
    let starIcon = hero.stars > 5 ? "🌟" : "⭐";
    let starCount = hero.stars > 5 ? hero.stars - 5 : hero.stars;
    let starStr = starIcon.repeat(starCount);

    // Star display (lightweight animation for 6+ stars)
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    ctx.font = "14px \"Noto Sans\", \"Noto Color Emoji\", sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText(starStr, x + w / 2, y + 82);

    // Simple color pulse for high stars (no gradients or shadows)
    let starTextColor = "yellow";
    if (hero.stars > 5) {
        if (!window.heroStarPulse) window.heroStarPulse = 0;
        window.heroStarPulse += 0.03;
        if (window.heroStarPulse > Math.PI * 2) window.heroStarPulse = 0;

        // Alternate between gold and bright gold
        let brightness = 0.7 + Math.abs(Math.sin(window.heroStarPulse)) * 0.3;
        let r = Math.floor(255 * brightness);
        let g = Math.floor(215 * brightness);
        starTextColor = `rgb(${r}, ${g}, 0)`;
    }
    drawText(ctx, starStr, x + w / 2, y + 82, starTextColor, 14, "center");

    drawText(ctx, `Lv: ${hero.level} / ${hero.maxLevel}`, x + w / 2, y + 98, "white", 12, "center");

    // Stats - 2 Columns with icons, right-aligned values
    // Add background overlay for stats area - lighter opacity
    drawRoundedRect(ctx, x + 6, y + 102, w - 12, 68, 6, "rgba(0,0,0,0.25)");

    // Calculate total stats with equipment bonuses
    let totalStats = calculateTotalStats(hero, itemMap);

    let sx = x + 10, sy = y + 118, dy = 15;
    let col2 = x + w / 2 + 5;
    let valX1 = x + w / 2 - 5;  // Right edge of column 1
    let valX2 = x + w - 10;      // Right edge of column 2

    // Col 1 - Icons left, values right
    drawText(ctx, "❤️", sx, sy, "#CCC", 11, "left");
    drawText(ctx, `${Math.round(totalStats.hp)}`, valX1, sy, "#CCC", 11, "right");

    drawText(ctx, "🛡️", sx, sy + dy, "#CCC", 11, "left");
    drawText(ctx, `${Math.round(totalStats.def)}`, valX1, sy + dy, "#CCC", 11, "right");

    drawText(ctx, "🎯", sx, sy + dy * 2, "#CCC", 11, "left");
    drawText(ctx, `${Math.round(totalStats.eva)}%`, valX1, sy + dy * 2, "#CCC", 11, "right");

    drawText(ctx, "⚡", sx, sy + dy * 3, "#CCC", 11, "left");
    drawText(ctx, `${Math.round(totalStats.atkSpd * 100)}%`, valX1, sy + dy * 3, "#CCC", 11, "right");

    // Col 2 - Icons left, values right
    drawText(ctx, "⚔️", col2, sy, "#CCC", 11, "left");
    drawText(ctx, `${Math.round(totalStats.atk)}`, valX2, sy, "#CCC", 11, "right");

    drawText(ctx, "💥", col2, sy + dy, "#CCC", 11, "left");
    drawText(ctx, `${Math.round(totalStats.crit)}%`, valX2, sy + dy, "#CCC", 11, "right");

    drawText(ctx, "💧", col2, sy + dy * 2, "#CCC", 11, "left");
    drawText(ctx, `${Math.round(totalStats.regen)}`, valX2, sy + dy * 2, "#CCC", 11, "right");

    drawText(ctx, "👢", col2, sy + dy * 3, "#CCC", 11, "left");
    drawText(ctx, `${Math.round(totalStats.spd * 100)}%`, valX2, sy + dy * 3, "#CCC", 11, "right");

    // Equipment Slots
    let slotSize = 30;
    let gap = 5;
    let startEqX = x + (w - (4 * slotSize + 3 * gap)) / 2;
    let eqY = y + 175;

    // We need to fetch item data. DB is imported.
    for (let s = 0; s < 4; s++) {
        let bx = startEqX + s * (slotSize + gap);
        drawRoundedRect(ctx, bx, eqY, slotSize, slotSize, 4, "#222");
        drawRoundedStroke(ctx, bx, eqY, slotSize, slotSize, 4, "#444", 1);

        if (hero.equipments && hero.equipments[s]) {
            let item;
            if (itemMap) {
                item = itemMap.get(hero.equipments[s]);
            } else {
                item = DB.data.inventory.find(i => i.id === hero.equipments[s]);
            }
            if (item) drawItemIcon(ctx, item, bx, eqY, slotSize);
        } else {
            let typeIcon = getItemTypeMap().get(s).icon;
            // Draw empty slot with gray background and dimmed icon
            drawRoundedRect(ctx, bx, eqY, slotSize, slotSize, 4, "#1a1a1a");
            drawRoundedStroke(ctx, bx, eqY, slotSize, slotSize, 4, "#555", 1);

            // Draw icon in gray with reduced opacity effect
            ctx.save();
            ctx.globalAlpha = 0.1;
            drawText(ctx, typeIcon, bx + slotSize / 2, eqY + slotSize / 2 + 4, "#888", 16, "center");
            ctx.restore();
        }
    }

    if (isTeam) drawBadge(ctx, x + w - 15, y + 20, "E", "blue");

    if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= x && Enjine.Mouse.X <= x + w && Enjine.Mouse.Y >= y && Enjine.Mouse.Y <= y + h) {
        Enjine.Mouse.Clicked = false;
        if (callback) callback();
    }
}
