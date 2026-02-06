import { AppState, BoundingBox, CellTransform } from "./state";

export function setGridDimensions(state: AppState, cols: number, rows: number): void {
    state.numCols = Math.max(1, cols);
    state.numRows = Math.max(1, rows);

    if (state.currentImg) {
        state.totalWidth = state.currentImg.width;
        state.totalHeight = state.currentImg.height;
        state.cellWidth = state.totalWidth / state.numCols;
        state.cellHeight = state.totalHeight / state.numRows;
    }
}

export function initGridData(state: AppState, keepExisting = false): void {
    if (keepExisting) return;

    const rows: CellTransform[][] = [];
    for (let r = 0; r < state.numRows; r++) {
        const row: CellTransform[] = [];
        for (let c = 0; c < state.numCols; c++) {
            row.push({ x: 0, y: 0, scale: 1.0 });
        }
        rows.push(row);
    }
    state.cellData = rows;
}

export function initCellOrder(state: AppState): void {
    const total = state.numCols * state.numRows;
    state.cellOrder = Array.from({ length: total }, (_, index) => index);
}

export function getTargetIndex(state: AppState, row: number, col: number): number {
    return row * state.numCols + col;
}

export function getSourceIndex(state: AppState, row: number, col: number): number {
    const index = getTargetIndex(state, row, col);
    return state.cellOrder[index] ?? -1;
}

export function getSourceCell(state: AppState, sourceIndex: number): CellTransform | null {
    if (sourceIndex < 0) return null;
    const row = Math.floor(sourceIndex / state.numCols);
    const col = sourceIndex % state.numCols;
    return state.cellData[row]?.[col] ?? null;
}

export function getSourceBoundingBox(state: AppState, sourceIndex: number): BoundingBox | null {
    if (sourceIndex < 0) return null;
    const row = Math.floor(sourceIndex / state.numCols);
    const col = sourceIndex % state.numCols;
    return state.boundingBoxes[row]?.[col] ?? null;
}

export function deleteCellAtTarget(state: AppState, targetIndex: number): void {
    const total = state.cellOrder.length;
    if (targetIndex < 0 || targetIndex >= total) return;
    state.cellOrder.splice(targetIndex, 1);
    state.cellOrder.push(-1);
}

export function reorderCell(state: AppState, fromIndex: number, toIndex: number): void {
    const total = state.cellOrder.length;
    if (fromIndex < 0 || fromIndex >= total) return;
    if (toIndex < 0 || toIndex >= total) return;
    if (fromIndex === toIndex) return;

    const [moved] = state.cellOrder.splice(fromIndex, 1);
    state.cellOrder.splice(toIndex, 0, moved);
}

export function analyzeImage(state: AppState): void {
    if (!state.currentImg) return;

    const { totalWidth, totalHeight, cellWidth, cellHeight, numRows, numCols } = state;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = totalWidth;
    tempCanvas.height = totalHeight;

    const tCtx = tempCanvas.getContext("2d");
    if (!tCtx) return;

    tCtx.drawImage(state.currentImg, 0, 0);

    const fullImageData = tCtx.getImageData(0, 0, totalWidth, totalHeight);
    const data = fullImageData.data;

    const boxes: BoundingBox[][] = [];

    for (let r = 0; r < numRows; r++) {
        const rowBoxes: BoundingBox[] = [];
        for (let c = 0; c < numCols; c++) {
            const sx = Math.floor(c * cellWidth);
            const sy = Math.floor(r * cellHeight);
            const sw = Math.ceil(cellWidth);
            const sh = Math.ceil(cellHeight);

            let minX = sw;
            let maxX = -1;
            let minY = sh;
            let maxY = -1;
            let found = false;

            for (let y = 0; y < sh; y++) {
                const globalY = sy + y;
                if (globalY >= totalHeight) break;
                for (let x = 0; x < sw; x++) {
                    const globalX = sx + x;
                    if (globalX >= totalWidth) break;
                    const idx = (globalY * totalWidth + globalX) * 4 + 3;
                    if (data[idx] > 10) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                        found = true;
                    }
                }
            }

            if (found) {
                rowBoxes.push({
                    minX,
                    minY,
                    maxX,
                    maxY,
                    w: maxX - minX,
                    h: maxY - minY,
                    isEmpty: false,
                });
            } else {
                rowBoxes.push({
                    minX: 0,
                    minY: 0,
                    maxX: 0,
                    maxY: 0,
                    w: 0,
                    h: 0,
                    isEmpty: true,
                });
            }
        }
        boxes.push(rowBoxes);
    }

    state.boundingBoxes = boxes;
}

export function clampCellOffset(state: AppState, row: number, col: number): void {
    const cell = state.cellData[row]?.[col];
    const bbox = state.boundingBoxes[row]?.[col];

    if (!cell || !bbox || bbox.isEmpty) return;

    const scale = cell.scale;
    const minAllowX = -(bbox.minX * scale);
    const maxAllowX = state.cellWidth - bbox.maxX * scale;
    const minAllowY = -(bbox.minY * scale);
    const maxAllowY = state.cellHeight - bbox.maxY * scale;

    if (minAllowX <= maxAllowX) {
        cell.x = Math.max(minAllowX, Math.min(maxAllowX, cell.x));
    } else {
        cell.x = Math.max(maxAllowX, Math.min(minAllowX, cell.x));
    }

    if (minAllowY <= maxAllowY) {
        cell.y = Math.max(minAllowY, Math.min(maxAllowY, cell.y));
    } else {
        cell.y = Math.max(maxAllowY, Math.min(minAllowY, cell.y));
    }
}

export function resetCellTransform(state: AppState, row: number, col: number): void {
    const cell = state.cellData[row]?.[col];
    if (!cell) return;
    cell.x = 0;
    cell.y = 0;
    cell.scale = 1.0;
}
