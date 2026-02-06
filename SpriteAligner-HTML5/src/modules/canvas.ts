import { AppState, Point } from "./state";
import { DomElements } from "./dom";
import { I18nApi } from "./i18n";
import { getSourceBoundingBox, getSourceCell, getSourceIndex } from "./grid";

export interface OverlayButton {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    label?: string;
}

interface OverlayLabel {
    x: number;
    y: number;
    w: number;
    h: number;
    text: string;
}

export interface OverlayLayout {
    visible: boolean;
    cellRect: { x: number; y: number; w: number; h: number };
    label: OverlayLabel | null;
    buttons: OverlayButton[];
}

export function initCanvasSize(state: AppState, dom: DomElements, i18n: I18nApi): void {
    dom.canvas.width = dom.wrapper.clientWidth;
    dom.canvas.height = dom.wrapper.clientHeight;
    renderCanvas(state, dom, i18n);
}

export function renderCanvas(state: AppState, dom: DomElements, i18n: I18nApi): void {
    if (!state.isImageLoaded) {
        drawIntro(dom, i18n);
        return;
    }

    draw(state, dom);
}

export function screenToWorld(state: AppState, sx: number, sy: number): Point {
    return {
        x: (sx - state.viewPanX) / state.viewScale,
        y: (sy - state.viewPanY) / state.viewScale,
    };
}

export function worldToScreen(state: AppState, wx: number, wy: number): Point {
    return {
        x: wx * state.viewScale + state.viewPanX,
        y: wy * state.viewScale + state.viewPanY,
    };
}

export function updateOverlay(_state: AppState, _dom: DomElements): void {
    // Overlay controls are now drawn directly on the canvas.
}

function drawIntro(dom: DomElements, i18n: I18nApi): void {
    dom.ctx.fillStyle = "#252525";
    dom.ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
    dom.ctx.fillStyle = "#666";
    dom.ctx.font = "24px Segoe UI";
    dom.ctx.textAlign = "center";
    dom.ctx.fillText(i18n.t("intro.title"), dom.canvas.width / 2, dom.canvas.height / 2 - 20);
    dom.ctx.font = "16px Segoe UI";
    dom.ctx.fillText(i18n.t("intro.subtitle"), dom.canvas.width / 2, dom.canvas.height / 2 + 10);
}

function drawIsoGrid(state: AppState, ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    const size = state.isoGridSize;
    const w = state.isoTileW;
    const h = state.isoTileH;

    ctx.save();
    ctx.lineWidth = 1 / state.viewScale;

    const centerIndex = (size - 1) / 2;

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const ii = i - centerIndex;
            const jj = j - centerIndex;

            const cx = centerX + (jj - ii) * (w / 2);
            const cy = centerY + (jj + ii) * (h / 2);

            ctx.beginPath();
            ctx.moveTo(cx, cy - h / 2);
            ctx.lineTo(cx + w / 2, cy);
            ctx.lineTo(cx, cy + h / 2);
            ctx.lineTo(cx - w / 2, cy);
            ctx.closePath();

            ctx.fillStyle = "rgba(76, 175, 80, 0.4)";
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 235, 59, 0.4)";
            ctx.stroke();
        }
    }

    ctx.restore();
}

function draw(state: AppState, dom: DomElements): void {
    if (!state.currentImg) return;

    const isPixelMode = dom.chkPixelMode.checked;
    dom.ctx.imageSmoothingEnabled = !isPixelMode;

    dom.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);

    dom.ctx.save();
    dom.ctx.translate(state.viewPanX, state.viewPanY);
    dom.ctx.scale(state.viewScale, state.viewScale);

    dom.ctx.strokeStyle = "#444";
    dom.ctx.lineWidth = 2 / state.viewScale;
    dom.ctx.strokeRect(0, 0, state.totalWidth, state.totalHeight);

    for (let r = 0; r < state.numRows; r++) {
        for (let c = 0; c < state.numCols; c++) {
            const cx = c * state.cellWidth;
            const cy = r * state.cellHeight;
            const sourceIndex = getSourceIndex(state, r, c);
            const cell = getSourceCell(state, sourceIndex);
            const bbox = getSourceBoundingBox(state, sourceIndex);

            // Calculate anchor based on mode
            let anchorX: number, anchorY: number;
            if (state.anchorMode === "pixel") {
                anchorX = cx + state.anchorX;
                anchorY = cy + state.anchorY;
            } else {
                anchorX = cx + state.cellWidth * state.anchorX;
                anchorY = cy + state.cellHeight * state.anchorY;
            }

            dom.ctx.save();
            dom.ctx.beginPath();
            dom.ctx.rect(cx, cy, state.cellWidth, state.cellHeight);
            dom.ctx.clip();

            drawIsoGrid(state, dom.ctx, anchorX, anchorY);

            if (cell) {
                const srcRow = Math.floor(sourceIndex / state.numCols);
                const srcCol = sourceIndex % state.numCols;
                const sx = srcCol * state.cellWidth;
                const sy = srcRow * state.cellHeight;
                const dw = state.cellWidth * cell.scale;
                const dh = state.cellHeight * cell.scale;

                dom.ctx.drawImage(
                    state.currentImg,
                    sx,
                    sy,
                    state.cellWidth,
                    state.cellHeight,
                    cx + cell.x,
                    cy + cell.y,
                    dw,
                    dh
                );
            }

            if (cell && bbox && !bbox.isEmpty) {
                const realX = cx + bbox.minX * cell.scale + cell.x;
                const realY = cy + bbox.minY * cell.scale + cell.y;
                const realW = bbox.w * cell.scale;
                const realH = bbox.h * cell.scale;

                dom.ctx.save();
                if (state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c) {
                    dom.ctx.strokeStyle = "#00ff00";
                    dom.ctx.lineWidth = 1.5 / state.viewScale;
                    dom.ctx.setLineDash([4 / state.viewScale, 4 / state.viewScale]);
                } else {
                    dom.ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
                    dom.ctx.lineWidth = 1.5 / state.viewScale;
                    dom.ctx.setLineDash([4 / state.viewScale, 4 / state.viewScale]);
                }
                dom.ctx.strokeRect(realX, realY, realW, realH);
                dom.ctx.restore();
            }

            const crossSize = 10 / state.viewScale;
            dom.ctx.beginPath();
            dom.ctx.lineWidth = 1.5 / state.viewScale;
            dom.ctx.strokeStyle = "#00ffff";
            dom.ctx.moveTo(anchorX - crossSize, anchorY);
            dom.ctx.lineTo(anchorX + crossSize, anchorY);
            dom.ctx.moveTo(anchorX, anchorY - crossSize);
            dom.ctx.lineTo(anchorX, anchorY + crossSize);
            dom.ctx.stroke();

            dom.ctx.fillStyle = "red";
            const dotSize = 2 / state.viewScale;
            dom.ctx.fillRect(anchorX - dotSize / 2, anchorY - dotSize / 2, dotSize, dotSize);

            dom.ctx.restore();

            dom.ctx.strokeStyle = "rgba(80, 80, 80, 0.3)";
            dom.ctx.lineWidth = 1 / state.viewScale;
            dom.ctx.strokeRect(cx, cy, state.cellWidth, state.cellHeight);

            drawCellIndex(state, dom, r, c, cx, cy);

            if (state.selectedCell && state.selectedCell.r === r && state.selectedCell.c === c) {
                dom.ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
                dom.ctx.lineWidth = 2 / state.viewScale;
                dom.ctx.strokeRect(cx, cy, state.cellWidth, state.cellHeight);
            }
        }
    }

    dom.ctx.restore();

    drawReorderGhost(state, dom);
    drawOverlayUI(state, dom);
}

function drawCellIndex(
    state: AppState,
    dom: DomElements,
    row: number,
    col: number,
    cellX: number,
    cellY: number
): void {
    const index = row * state.numCols + col;
    const fontSize = 12 / state.viewScale;
    const padding = 4 / state.viewScale;
    const label = `#${index}`;

    dom.ctx.save();
    dom.ctx.font = `${fontSize}px Segoe UI`;
    dom.ctx.textBaseline = "middle";
    dom.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";

    const metrics = dom.ctx.measureText(label);
    const textWidth = metrics.width;
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
    const textHeight = ascent + descent;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding * 2;

    const x = cellX + padding;
    const y = cellY + padding;
    const textY = y + bgHeight / 2;

    dom.ctx.fillRect(x, y, bgWidth, bgHeight);
    dom.ctx.fillStyle = "#e5e7eb";
    dom.ctx.fillText(label, x + padding + (textWidth / 2), textY);
    dom.ctx.restore();
}

function drawReorderGhost(state: AppState, dom: DomElements): void {
    if (!state.reorderGhost.active || !state.currentImg) return;

    const sourceIndex = state.reorderGhost.sourceIndex;
    if (sourceIndex < 0) return;

    const cell = getSourceCell(state, sourceIndex);
    if (!cell) return;

    const srcRow = Math.floor(sourceIndex / state.numCols);
    const srcCol = sourceIndex % state.numCols;
    const sx = srcCol * state.cellWidth;
    const sy = srcRow * state.cellHeight;

    const screenCellW = state.cellWidth * state.viewScale;
    const screenCellH = state.cellHeight * state.viewScale;
    const scaledW = screenCellW * cell.scale;
    const scaledH = screenCellH * cell.scale;

    const offsetX = cell.x * state.viewScale;
    const offsetY = cell.y * state.viewScale;

    const dx = state.reorderGhost.screenX - scaledW / 2 + offsetX;
    const dy = state.reorderGhost.screenY - scaledH / 2 + offsetY;

    dom.ctx.save();
    dom.ctx.globalAlpha = 0.6;
    dom.ctx.drawImage(
        state.currentImg,
        sx,
        sy,
        state.cellWidth,
        state.cellHeight,
        dx,
        dy,
        scaledW,
        scaledH
    );
    dom.ctx.restore();
}

export function getOverlayLayout(state: AppState, dom: DomElements): OverlayLayout {
    if (!state.isImageLoaded || !state.selectedCell || state.reorderGhost.active) {
        return { visible: false, cellRect: { x: 0, y: 0, w: 0, h: 0 }, label: null, buttons: [] };
    }

    const { r, c } = state.selectedCell;
    const worldX = c * state.cellWidth;
    const worldY = r * state.cellHeight;
    const screenPos = worldToScreen(state, worldX, worldY);
    const screenW = state.cellWidth * state.viewScale;
    const screenH = state.cellHeight * state.viewScale;

    if (
        screenPos.x + screenW < 0 ||
        screenPos.x > dom.canvas.width ||
        screenPos.y + screenH < 0 ||
        screenPos.y > dom.canvas.height
    ) {
        return { visible: false, cellRect: { x: 0, y: 0, w: 0, h: 0 }, label: null, buttons: [] };
    }

    const btnW = 45;
    const btnH = 20;
    const iconW = 22;
    const iconH = 20;
    const gapY = 4;
    const colGap = 8;
    const topGap = 6;
    const labelGap = 6;

    const cellRect = { x: screenPos.x, y: screenPos.y, w: screenW, h: screenH };
    const topY = cellRect.y - iconH - topGap;

    const buttons: OverlayButton[] = [];
    buttons.push({ id: "reorder", x: cellRect.x, y: topY, w: iconW, h: iconH, label: "⋮⋮" });
    buttons.push({
        id: "delete",
        x: cellRect.x + cellRect.w - iconW,
        y: topY,
        w: iconW,
        h: iconH,
        label: "✕",
    });

    const sourceIndex = getSourceIndex(state, r, c);
    const cell = getSourceCell(state, sourceIndex);
    const scaleText = cell ? `x${cell.scale.toFixed(2)}` : "x1.00";

    dom.ctx.save();
    dom.ctx.font = "12px Segoe UI";
    const labelTextWidth = dom.ctx.measureText(scaleText).width;
    dom.ctx.restore();

    const labelW = labelTextWidth + 12;
    const labelH = iconH;
    const groupW = labelW + labelGap + iconW;
    const groupX = cellRect.x + (cellRect.w - groupW) / 2;
    const label: OverlayLabel = {
        x: groupX,
        y: topY,
        w: labelW,
        h: labelH,
        text: scaleText,
    };

    buttons.push({
        id: "reset",
        x: groupX + labelW + labelGap,
        y: topY,
        w: iconW,
        h: iconH,
        label: "⟲",
    });

    const negSteps = [-0.25, -0.1, -0.05, -0.02, -0.01];
    const posSteps = [0.25, 0.1, 0.05, 0.02, 0.01];
    const colHeight = btnH * negSteps.length + gapY * (negSteps.length - 1);
    const colY = cellRect.y + (cellRect.h - colHeight) / 2;
    const leftX = cellRect.x - btnW - colGap;
    const rightX = cellRect.x + cellRect.w + colGap;

    negSteps.forEach((step, index) => {
        const y = colY + index * (btnH + gapY);
        buttons.push({
            id: `scale:${step}`,
            x: leftX,
            y,
            w: btnW,
            h: btnH,
            label: step.toFixed(2),
        });
    });

    posSteps.forEach((step, index) => {
        const y = colY + index * (btnH + gapY);
        const labelText = `+${step.toFixed(2)}`;
        buttons.push({
            id: `scale:${step}`,
            x: rightX,
            y,
            w: btnW,
            h: btnH,
            label: labelText,
        });
    });

    return {
        visible: true,
        cellRect,
        label,
        buttons,
    };
}

function drawOverlayUI(state: AppState, dom: DomElements): void {
    const layout = getOverlayLayout(state, dom);
    if (!layout.visible) return;

    dom.ctx.save();
    dom.ctx.lineWidth = 1;

    if (layout.label) {
        dom.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        dom.ctx.fillRect(layout.label.x, layout.label.y, layout.label.w, layout.label.h);
        dom.ctx.fillStyle = "#4ade80";
        dom.ctx.font = "12px Segoe UI";
        dom.ctx.textBaseline = "middle";
        dom.ctx.textAlign = "center";
        dom.ctx.fillText(
            layout.label.text,
            layout.label.x + layout.label.w / 2,
            layout.label.y + layout.label.h / 2
        );
    }

    layout.buttons.forEach((button) => {
        let bg = "rgba(59, 130, 246, 0.9)";
        if (button.id === "delete") bg = "rgba(220, 38, 38, 0.9)";
        dom.ctx.fillStyle = bg;
        dom.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        dom.ctx.fillRect(button.x, button.y, button.w, button.h);
        dom.ctx.strokeRect(button.x, button.y, button.w, button.h);
        dom.ctx.fillStyle = "#ffffff";

        const fontSize = button.id.startsWith("scale:") ? 9 : 11;
        dom.ctx.font = `${fontSize}px Segoe UI`;
        dom.ctx.textBaseline = "middle";
        dom.ctx.textAlign = "center";
        if (button.label) {
            dom.ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2);
        }
    });

    dom.ctx.restore();
}
