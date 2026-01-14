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

    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    drawStrokedText("EL DORADO", GAME.Canvas.Width / 2, 35); // Moved to header, reduced size

    drawTeamDisplay(ctx, 200, false, GAME.Canvas.Width);

    let taskbarH = 120;
    let taskbarY = GAME.Canvas.Height - taskbarH;
    let btnSize = 100;
    let btnGap = 20;
    // 6 Buttons: Hero, Base, Shop, Inventory, Battle, Data Book
    let totalBtnW = 6 * btnSize + 5 * btnGap;
    let btnStartX = (GAME.Canvas.Width - totalBtnW) / 2;

    // 1. Manage
    drawButton(ctx, "", btnStartX, taskbarY, btnSize, btnSize, "#004edf", () => GAME.ChangeState(HeroManageState));
    drawRoundedStroke(ctx, btnStartX, taskbarY, btnSize, btnSize, 10, "black", 5);
    drawStrokedText("🧙‍♂️", btnStartX + btnSize / 2, taskbarY + 45, 40);
    drawStrokedText("Quản Lý", btnStartX + btnSize / 2, taskbarY + 85, 14);

    // 2. Shop
    drawButton(ctx, "", btnStartX + btnSize + btnGap, taskbarY, btnSize, btnSize, "#004edf", () => GAME.ChangeState(GachaState));
    drawRoundedStroke(ctx, btnStartX + btnSize + btnGap, taskbarY, btnSize, btnSize, 10, "black", 5);
    drawStrokedText("🎲", btnStartX + btnSize + btnGap + btnSize / 2, taskbarY + 45, 40);
    drawStrokedText("Quay thưởng", btnStartX + btnSize + btnGap + btnSize / 2, taskbarY + 85, 14);

    // 3. Upgrade
    drawButton(ctx, "", btnStartX + 2 * (btnSize + btnGap), taskbarY, btnSize, btnSize, "#004edf", () => GAME.ChangeState(UpgradeBaseState));
    drawRoundedStroke(ctx, btnStartX + 2 * (btnSize + btnGap), taskbarY, btnSize, btnSize, 10, "black", 5);
    drawStrokedText("🛠️", btnStartX + 2 * (btnSize + btnGap) + btnSize / 2, taskbarY + 45, 40);
    drawStrokedText("Nâng cấp", btnStartX + 2 * (btnSize + btnGap) + btnSize / 2, taskbarY + 85, 14);

    // 4. Inventory
    drawButton(ctx, "", btnStartX + 3 * (btnSize + btnGap), taskbarY, btnSize, btnSize, "#004edf", () => GAME.ChangeState(ItemManageState));
    drawRoundedStroke(ctx, btnStartX + 3 * (btnSize + btnGap), taskbarY, btnSize, btnSize, 10, "black", 5);
    drawStrokedText("🎒", btnStartX + 3 * (btnSize + btnGap) + btnSize / 2, taskbarY + 45, 40);
    drawStrokedText("Kho Đồ", btnStartX + 3 * (btnSize + btnGap) + btnSize / 2, taskbarY + 85, 14);

    // 5. Data Book
    drawButton(ctx, "", btnStartX + 4 * (btnSize + btnGap), taskbarY, btnSize, btnSize, "#004edf", () => GAME.ChangeState(DataBookState));
    drawRoundedStroke(ctx, btnStartX + 4 * (btnSize + btnGap), taskbarY, btnSize, btnSize, 10, "black", 5);
    drawStrokedText("📖", btnStartX + 4 * (btnSize + btnGap) + btnSize / 2, taskbarY + 45, 40);
    drawStrokedText("Sổ dữ liệu", btnStartX + 4 * (btnSize + btnGap) + btnSize / 2, taskbarY + 85, 14);

    // 6. Battle
    drawButton(ctx, "", btnStartX + 5 * (btnSize + btnGap), taskbarY, btnSize, btnSize, "#004edf", () => GAME.ChangeState(StageSelectState));
    drawRoundedStroke(ctx, btnStartX + 5 * (btnSize + btnGap), taskbarY, btnSize, btnSize, 10, "black", 5);
    drawStrokedText("🗺️", btnStartX + 5 * (btnSize + btnGap) + btnSize / 2, taskbarY + 45, 40);
    drawStrokedText("Chiến Đấu", btnStartX + 5 * (btnSize + btnGap) + btnSize / 2, taskbarY + 85, 14);

    drawStrokedText(ctx, "v1.0 - Close beta", 10, GAME.Canvas.Height - 10, "#004edf", 10);
};
