/**
 * --- STAGE SELECT STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, MEDAL_BUFFS } from '../context.js';
import { drawGlobalHeader, drawText, drawButton, drawRoundedRect, drawRect } from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';
import { PlayState } from './PlayState.js';

export var StageSelectState = new Enjine.GameState();
StageSelectState.currentPage = 0;
StageSelectState.stagesPerPage = 20;

StageSelectState.Enter = function () {
    this.currentPage = Math.floor((DB.data.maxStage - 1) / this.stagesPerPage);
};

StageSelectState.Draw = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.6)"); // Overlay
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    drawText(ctx, "CHỌN MÀN CHƠI", GAME.Canvas.Width / 2, 32, "white", 24, "center"); // Moved to header, reduced size
    drawButton(ctx, "❮ Về Menu", 10, 70, 100, 30, "#555", () => GAME.ChangeState(MainMenuState));

    let buffs = DB.getBuffs();
    drawText(ctx, "Buff Kích Hoạt:", 20, 120, "cyan", 16);
    let by = 145;
    buffs.forEach((val, idx) => {
        if (val > 0) {
            drawText(ctx, `${MEDAL_BUFFS[idx]}: +${val}%`, 30, by, "white", 14);
            by += 20;
        }
    });

    let startIdx = this.currentPage * this.stagesPerPage;
    let endIdx = Math.min(startIdx + this.stagesPerPage, 1000);

    let cols = 5;
    let btnSize = 80;
    let gap = 20;
    let gridW = cols * btnSize + (cols - 1) * gap;
    let startX = (GAME.Canvas.Width - gridW) / 2;
    let startY = 180;

    for (let i = startIdx; i < endIdx; i++) {
        let localIdx = i - startIdx;
        let c = localIdx % cols;
        let r = Math.floor(localIdx / cols);

        let x = startX + c * (btnSize + gap);
        let y = startY + r * (btnSize + gap);

        let stageNum = i + 1;
        let medal = DB.data.medals[i] || 0; // Handle undefined if array not full

        let bgColor = "#333";
        let textColor = "white";
        let medalIcon = "";

        if (stageNum > DB.data.maxStage) {
            bgColor = "#222";
            textColor = "#555";
        } else {
            if (medal === 1) { bgColor = "#8B4513"; medalIcon = "★"; }
            else if (medal === 2) { bgColor = "#778899"; medalIcon = "★★"; }
            else if (medal === 3) { bgColor = "#DAA520"; medalIcon = "★★★"; }
            else bgColor = "#444";
        }

        if (stageNum <= DB.data.maxStage) {
            drawButton(ctx, stageNum.toString(), x, y, btnSize, btnSize, bgColor, () => {
                PlayState.level = stageNum;
                GAME.ChangeState(PlayState);
            }, textColor);

            if (medalIcon) {
                drawText(ctx, medalIcon, x + btnSize / 2, y + btnSize - 15, "yellow", 12, "center");
            }
        } else {
            drawRoundedRect(ctx, x, y, btnSize, btnSize, 10, "#222");
            drawText(ctx, "🔒", x + btnSize / 2, y + btnSize / 2 + 5, "#555", 20, "center");
        }
    }

    let navY = startY + 4 * (btnSize + gap) + 20;
    let maxPage = Math.ceil(1000 / this.stagesPerPage) - 1;

    drawText(ctx, `Trang ${this.currentPage + 1}/${maxPage + 1}`, GAME.Canvas.Width / 2, navY + 25, "white", 20, "center");

    if (this.currentPage > 0) {
        drawButton(ctx, "❮ Trước", GAME.Canvas.Width / 2 - 150, navY, 80, 40, "#444", () => this.currentPage--);
    }

    if (this.currentPage < maxPage) {
        drawButton(ctx, "Sau ❯", GAME.Canvas.Width / 2 + 70, navY, 80, 40, "#444", () => this.currentPage++);
    }
};
