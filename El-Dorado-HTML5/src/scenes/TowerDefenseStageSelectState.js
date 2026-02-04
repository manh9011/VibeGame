/**
 * --- TOWER DEFENSE STAGE SELECT STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB } from '../context.js';
import { drawGlobalHeader, drawText, drawButton, drawRoundedRect, drawRect } from '../utils/uiHelpers.js';
import { MainMenuState } from './MainMenuState.js';
import { TowerDefenseState } from './TowerDefenseState.js';

export var TowerDefenseStageSelectState = new Enjine.GameState();
TowerDefenseStageSelectState.currentPage = 0;
TowerDefenseStageSelectState.stagesPerPage = 20;

TowerDefenseStageSelectState.Enter = function () {
    this.currentPage = Math.floor((DB.data.tdMaxStage - 1) / this.stagesPerPage);
};

TowerDefenseStageSelectState.Draw = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);
    drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.6)");
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    drawText(ctx, "CHỌN MÀN THỦ THÀNH", GAME.Canvas.Width / 2, 32, "white", 24, "center");
    drawButton(ctx, "❮ Về Menu", 10, 70, 100, 30, "#555", () => GAME.ChangeState(MainMenuState));

    let startIdx = this.currentPage * this.stagesPerPage;
    let endIdx = Math.min(startIdx + this.stagesPerPage, 1000);

    let cols = 5;
    let btnSize = 80;
    let gap = 20;
    let gridW = cols * btnSize + (cols - 1) * gap;
    let startX = (GAME.Canvas.Width - gridW) / 2;
    let startY = 160;

    for (let i = startIdx; i < endIdx; i++) {
        let localIdx = i - startIdx;
        let c = localIdx % cols;
        let r = Math.floor(localIdx / cols);

        let x = startX + c * (btnSize + gap);
        let y = startY + r * (btnSize + gap);

        let stageNum = i + 1;
        let stars = (DB.data.tdStars && DB.data.tdStars[i]) ? DB.data.tdStars[i] : 0;

        let bgColor = "#333";
        let textColor = "white";
        let starIcon = "";

        if (stageNum > DB.data.tdMaxStage) {
            bgColor = "#222";
            textColor = "#555";
        } else {
            if (stars === 1) { bgColor = "#8B4513"; starIcon = "★"; }
            else if (stars === 2) { bgColor = "#778899"; starIcon = "★★"; }
            else if (stars === 3) { bgColor = "#DAA520"; starIcon = "★★★"; }
            else bgColor = "#444";
        }

        if (stageNum <= DB.data.tdMaxStage) {
            drawButton(ctx, stageNum.toString(), x, y, btnSize, btnSize, bgColor, () => {
                TowerDefenseState.level = stageNum;
                GAME.ChangeState(TowerDefenseState);
            }, textColor);

            if (starIcon) {
                drawText(ctx, starIcon, x + btnSize / 2, y + btnSize - 15, "#FFD54F", 12, "center");
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
