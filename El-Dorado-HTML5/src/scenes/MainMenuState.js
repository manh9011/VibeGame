/**
 * --- MAIN MENU STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB } from '../context.js';
import { drawGlobalHeader, drawText, drawTeamDisplay, drawButton, drawRoundedStroke } from '../utils/uiHelpers.js';
import { HeroManageState } from './HeroManageState.js';
import { UpgradeBaseState } from './UpgradeBaseState.js';
import { GachaState } from './GachaState.js';
import { StageSelectState } from './StageSelectState.js';
import { ItemManageState } from './ItemManageState.js';
import { DataBookState } from './DataBookState.js';
import { PvPMenuState } from './PvPMenuState.js';
import { ShopState } from './ShopState.js';
import { TowerDefenseStageSelectState } from './TowerDefenseStageSelectState.js';
import { TowerManageState } from './TowerManageState.js';

export var MainMenuState = new Enjine.GameState();


MainMenuState.Enter = function () {
    BackgroundSystem.setTheme(1);
};

MainMenuState.Draw = function (ctx) {
    const drawStrokedText = (text, x, y, size, fontName = '"Segoe UI"') => {
        ctx.font = `bold ${size}px ${fontName}`;
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.strokeText(text, x, y);
        ctx.fillStyle = "white";
        ctx.fillText(text, x, y);
    };

    const drawNewBadge = (x, y) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-15 * Math.PI / 180); // Tilted 15 degrees up

        // Badge Background
        ctx.fillStyle = "#FF0000";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        const w = 40;
        const h = 20;
        const r = 5;

        ctx.beginPath();
        const rx = -w / 2;
        const ry = -h / 2;
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + w - r, ry);
        ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
        ctx.lineTo(rx + w, ry + h - r);
        ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h);
        ctx.lineTo(rx + r, ry + h);
        ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
        ctx.lineTo(rx, ry + r);
        ctx.quadraticCurveTo(rx, ry, rx + r, ry);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = "white";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("NEW", 0, 1);

        ctx.restore();
    };

    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    drawStrokedText("EL DORADO", GAME.Canvas.Width / 2, 35);

    drawTeamDisplay(ctx, 200, false, GAME.Canvas.Width);

    let btnSize = 95;
    let btnGap = 16;
    let buttons = [
        { label: "Quản Lý", icon: "🧙‍♂️", color: "#004edf", state: HeroManageState },
        { label: "Quay thưởng", icon: "🎲", color: "#004edf", state: GachaState },
        { label: "Nâng cấp", icon: "🛠️", color: "#004edf", state: UpgradeBaseState },
        { label: "Kho Đồ", icon: "🎒", color: "#004edf", state: ItemManageState },
        { label: "Sổ dữ liệu", icon: "📖", color: "#004edf", state: DataBookState },
        { label: "Chiến Đấu", icon: "🗺️", color: "#004edf", state: StageSelectState },
        { label: "Cửa Hàng", icon: "💎", color: "#e91e63", state: ShopState, isNew: true },
        { label: "PvP", icon: "⚔️", color: "#e91e63", state: PvPMenuState, isNew: true },
        { label: "Chòi Canh", icon: "🗼", color: "#ffbb00", state: TowerManageState, isNew: true },
        { label: "Thủ Thành", icon: "🏰", color: "#ffbb00", state: TowerDefenseStageSelectState, isNew: true },
    ];

    let cols = 5;
    let rows = Math.ceil(buttons.length / cols);
    let totalW = cols * btnSize + (cols - 1) * btnGap;
    let totalH = rows * btnSize + (rows - 1) * btnGap;
    let startX = (GAME.Canvas.Width - totalW) / 2;
    let startY = GAME.Canvas.Height - totalH - 20;

    buttons.forEach((btn, idx) => {
        let r = Math.floor(idx / cols);
        let c = idx % cols;
        let x = startX + c * (btnSize + btnGap);
        let y = startY + r * (btnSize + btnGap);

        drawButton(ctx, "", x, y, btnSize, btnSize, btn.color, () => GAME.ChangeState(btn.state));
        drawRoundedStroke(ctx, x, y, btnSize, btnSize, 10, "black", 5);
        drawStrokedText(btn.icon, x + btnSize / 2, y + 42, 38);
        drawStrokedText(btn.label, x + btnSize / 2, y + 80, 13);

        if (btn.isNew) drawNewBadge(x + btnSize - 15, y + 15);
    });

    drawText(ctx, "v1.0 - Close beta", 10, GAME.Canvas.Height - 10, "#004edf", 10, "left");
};
