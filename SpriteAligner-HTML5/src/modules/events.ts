import { AnchorMode, AppState, CellIndex } from "./state";
import { DomElements } from "./dom";
import { I18nApi } from "./i18n";
import {
    analyzeImage,
    clampCellOffset,
    deleteCellAtTarget,
    getSourceBoundingBox,
    getSourceIndex,
    getTargetIndex,
    initCellOrder,
    initGridData,
    reorderCell,
    resetCellTransform,
    setGridDimensions,
} from "./grid";
import { getOverlayLayout, initCanvasSize, renderCanvas, screenToWorld, updateOverlay } from "./canvas";
import { HistoryManager, saveImageBlob } from "./history";

function parsePositiveInt(value: string, fallback: number): number {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return fallback;
}

function isAnchorMode(value: string): value is AnchorMode {
    return value === "ratio" || value === "pixel";
}

function parseNumberOrFraction(value: string): number | null {
    if (!value) return 1;
    const parts = value.split("/");
    if (parts.length === 1) {
        const parsed = Number.parseFloat(parts[0]);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (parts.length === 2) {
        const numerator = Number.parseFloat(parts[0]);
        const denominator = Number.parseFloat(parts[1]);
        if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
        return numerator / denominator;
    }
    return null;
}

function getAnchorBase(
    variable: "w" | "h" | null,
    mode: AnchorMode,
    axis: "x" | "y",
    state: AppState
): number {
    if (!variable) return 1;
    if (mode === "ratio") return 1;
    if (variable === "h") return state.cellHeight;
    if (variable === "w") return state.cellWidth;
    return axis === "x" ? state.cellWidth : state.cellHeight;
}

function parseAnchorExpression(
    value: string,
    mode: AnchorMode,
    axis: "x" | "y",
    state: AppState
): number | null {
    let raw = value.trim().toLowerCase();
    if (!raw) return null;

    raw = raw.replace(/\s+/g, "");
    if (raw.endsWith("px")) raw = raw.slice(0, -2);

    let variable: "w" | "h" | null = null;
    let expr = raw;

    if (expr.endsWith("w") || expr.endsWith("h")) {
        variable = expr.slice(-1) as "w" | "h";
        expr = expr.slice(0, -1);
    } else if (expr.startsWith("w") || expr.startsWith("h")) {
        variable = expr[0] as "w" | "h";
        const rest = expr.slice(1);
        if (!rest) {
            return getAnchorBase(variable, mode, axis, state);
        }
        if (rest.startsWith("/")) {
            const denom = parseNumberOrFraction(rest.slice(1));
            if (denom === null || denom === 0) return null;
            return getAnchorBase(variable, mode, axis, state) / denom;
        }
        if (rest.startsWith("*")) {
            expr = rest.slice(1);
        } else {
            return null;
        }
    }

    const coefficient = parseNumberOrFraction(expr);
    if (coefficient === null) return null;

    if (!variable) return coefficient;
    return coefficient * getAnchorBase(variable, mode, axis, state);
}

function syncAnchorFromInputs(state: AppState, dom: DomElements): void {
    const modeValue = dom.selAnchorMode.value;
    if (isAnchorMode(modeValue)) {
        state.anchorMode = modeValue;
    }

    const nextX = parseAnchorExpression(dom.inpAnchorX.value, state.anchorMode, "x", state);
    const nextY = parseAnchorExpression(dom.inpAnchorY.value, state.anchorMode, "y", state);

    if (nextX !== null && Number.isFinite(nextX)) state.anchorX = nextX;
    if (nextY !== null && Number.isFinite(nextY)) state.anchorY = nextY;
}

function applyAnchorInputs(state: AppState, dom: DomElements, i18n: I18nApi): void {
    syncAnchorFromInputs(state, dom);
    renderCanvas(state, dom, i18n);
}

function isTextInputTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
    );
}

function isPointInSpriteBounds(state: AppState, row: number, col: number, worldPos: { x: number; y: number }): boolean {
    const sourceIndex = getSourceIndex(state, row, col);
    if (sourceIndex < 0) return false;

    const sourceCoords = getSourceCoords(state, sourceIndex);
    if (!sourceCoords) return false;

    const cell = state.cellData[sourceCoords.r][sourceCoords.c];
    const bbox = getSourceBoundingBox(state, sourceIndex);
    if (!cell || !bbox || bbox.isEmpty) return false;

    const cellX = col * state.cellWidth;
    const cellY = row * state.cellHeight;
    const realX = cellX + bbox.minX * cell.scale + cell.x;
    const realY = cellY + bbox.minY * cell.scale + cell.y;
    const realW = bbox.w * cell.scale;
    const realH = bbox.h * cell.scale;

    return (
        worldPos.x >= realX &&
        worldPos.x <= realX + realW &&
        worldPos.y >= realY &&
        worldPos.y <= realY + realH
    );
}

function getFileIdentity(file: File): string {
    return `${file.name}::${file.size}::${file.lastModified}`;
}

function updateIsoSettings(state: AppState, dom: DomElements, i18n: I18nApi): void {
    state.isoGridSize = parsePositiveInt(dom.inpIsoGridSize.value, state.isoGridSize);
    state.isoTileW = parsePositiveInt(dom.inpIsoTileW.value, state.isoTileW);
    state.isoTileH = parsePositiveInt(dom.inpIsoTileH.value, state.isoTileH);
    renderCanvas(state, dom, i18n);
}

function updateGridSettings(state: AppState, dom: DomElements): void {
    const cols = parsePositiveInt(dom.inpCols.value, 6);
    const rows = parsePositiveInt(dom.inpRows.value, 6);
    setGridDimensions(state, cols, rows);
    syncAnchorFromInputs(state, dom);
}

function applyGridChange(state: AppState, dom: DomElements, i18n: I18nApi, history: HistoryManager): void {
    const nextCols = parsePositiveInt(dom.inpCols.value, state.numCols);
    const nextRows = parsePositiveInt(dom.inpRows.value, state.numRows);
    if (nextCols === state.numCols && nextRows === state.numRows) return;

    if (state.isImageLoaded && !confirm(i18n.t("confirm.applyGrid"))) {
        dom.inpCols.value = String(state.numCols);
        dom.inpRows.value = String(state.numRows);
        return;
    }

    updateGridSettings(state, dom);

    if (state.isImageLoaded) {
        initGridData(state, false);
        initCellOrder(state);
        analyzeImage(state);
        state.selectedCell = null;
        updateOverlay(state, dom);
        renderCanvas(state, dom, i18n);
        void history.capture(state, "history.applyGrid");
    }
}

function getSourceCoords(state: AppState, sourceIndex: number): { r: number; c: number } | null {
    if (sourceIndex < 0) return null;
    return {
        r: Math.floor(sourceIndex / state.numCols),
        c: sourceIndex % state.numCols,
    };
}

function adjustScale(state: AppState, dom: DomElements, i18n: I18nApi, delta: number): void {
    if (!state.selectedCell) return;
    const { r, c } = state.selectedCell;
    const sourceIndex = getSourceIndex(state, r, c);
    if (sourceIndex < 0) return;
    const sourceCoords = getSourceCoords(state, sourceIndex);
    if (!sourceCoords) return;

    const cell = state.cellData[sourceCoords.r][sourceCoords.c];

    let newScale = cell.scale + delta;
    if (newScale < 0.01) newScale = 0.01;
    if (newScale > 10.0) newScale = 10.0;

    cell.scale = newScale;
    clampCellOffset(state, sourceCoords.r, sourceCoords.c);

    renderCanvas(state, dom, i18n);
    updateOverlay(state, dom);
}

function resetSelectedCell(state: AppState, dom: DomElements, i18n: I18nApi): void {
    if (!state.selectedCell) return;
    const { r, c } = state.selectedCell;
    const sourceIndex = getSourceIndex(state, r, c);
    const sourceCoords = getSourceCoords(state, sourceIndex);
    if (!sourceCoords) return;
    resetCellTransform(state, sourceCoords.r, sourceCoords.c);
    renderCanvas(state, dom, i18n);
    updateOverlay(state, dom);
}

function exportImage(state: AppState, dom: DomElements): void {
    if (!state.isImageLoaded || !state.currentImg) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = state.totalWidth;
    tempCanvas.height = state.totalHeight;

    const tCtx = tempCanvas.getContext("2d");
    if (!tCtx) return;

    tCtx.clearRect(0, 0, state.totalWidth, state.totalHeight);
    tCtx.imageSmoothingEnabled = !dom.chkPixelMode.checked;

    for (let r = 0; r < state.numRows; r++) {
        for (let c = 0; c < state.numCols; c++) {
            const targetX = c * state.cellWidth;
            const targetY = r * state.cellHeight;
            const sourceIndex = getSourceIndex(state, r, c);
            if (sourceIndex < 0) continue;
            const sourceCoords = getSourceCoords(state, sourceIndex);
            if (!sourceCoords) continue;

            const cell = state.cellData[sourceCoords.r][sourceCoords.c];
            const sourceX = sourceCoords.c * state.cellWidth;
            const sourceY = sourceCoords.r * state.cellHeight;

            tCtx.save();
            tCtx.beginPath();
            tCtx.rect(targetX, targetY, state.cellWidth, state.cellHeight);
            tCtx.clip();

            tCtx.drawImage(
                state.currentImg,
                sourceX,
                sourceY,
                state.cellWidth,
                state.cellHeight,
                targetX + cell.x,
                targetY + cell.y,
                state.cellWidth * cell.scale,
                state.cellHeight * cell.scale
            );
            tCtx.restore();
        }
    }

    const link = document.createElement("a");
    link.download = "fixed_sprite_sheet.png";
    link.href = tempCanvas.toDataURL();
    link.click();
}

async function writeImageToHandle(state: AppState, dom: DomElements): Promise<void> {
    if (!state.isImageLoaded || !state.currentImg || !state.fileHandle) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = state.totalWidth;
    tempCanvas.height = state.totalHeight;

    const tCtx = tempCanvas.getContext("2d");
    if (!tCtx) return;

    tCtx.clearRect(0, 0, state.totalWidth, state.totalHeight);
    tCtx.imageSmoothingEnabled = !dom.chkPixelMode.checked;

    for (let r = 0; r < state.numRows; r++) {
        for (let c = 0; c < state.numCols; c++) {
            const targetX = c * state.cellWidth;
            const targetY = r * state.cellHeight;
            const sourceIndex = getSourceIndex(state, r, c);
            if (sourceIndex < 0) continue;
            const sourceCoords = getSourceCoords(state, sourceIndex);
            if (!sourceCoords) continue;

            const cell = state.cellData[sourceCoords.r][sourceCoords.c];
            const sourceX = sourceCoords.c * state.cellWidth;
            const sourceY = sourceCoords.r * state.cellHeight;

            tCtx.save();
            tCtx.beginPath();
            tCtx.rect(targetX, targetY, state.cellWidth, state.cellHeight);
            tCtx.clip();

            tCtx.drawImage(
                state.currentImg,
                sourceX,
                sourceY,
                state.cellWidth,
                state.cellHeight,
                targetX + cell.x,
                targetY + cell.y,
                state.cellWidth * cell.scale,
                state.cellHeight * cell.scale
            );
            tCtx.restore();
        }
    }

    const blob = await new Promise<Blob | null>((resolve) => {
        tempCanvas.toBlob((result) => resolve(result), "image/png");
    });

    if (!blob) return;

    const writable = await state.fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
}

async function openFileWithFsAccess(
    state: AppState,
    dom: DomElements,
    i18n: I18nApi,
    history: HistoryManager
): Promise<void> {
    if (!("showOpenFilePicker" in window)) {
        dom.fileInput.click();
        return;
    }

    const [handle] = await (window as any).showOpenFilePicker({
        multiple: false,
        types: [
            {
                description: "Images",
                accept: {
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                },
            },
        ],
    });

    if (!handle) return;

    const file = await handle.getFile();
    const imageKey = await saveImageBlob(file);
    const fileIdentity = getFileIdentity(file);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
        const img = new Image();
        img.onload = async () => {
            state.fileHandle = handle;
            state.currentImg = img;
            state.isImageLoaded = true;
            state.viewScale = 1.0;
            state.imageKey = imageKey;
            state.fileIdentity = fileIdentity;
            history.setContext(fileIdentity);

            updateGridSettings(state, dom);
            initGridData(state, false);
            initCellOrder(state);
            analyzeImage(state);
            centerImage(state, dom);

            state.selectedCell = null;
            updateOverlay(state, dom);
            renderCanvas(state, dom, i18n);

            dom.resetBtn.disabled = false;
            dom.downloadBtn.disabled = false;

            await history.capture(state, "history.load");
        };

        const result = loadEvent.target?.result;
        if (typeof result === "string") {
            img.src = result;
        }
    };

    reader.readAsDataURL(file);
}

function centerImage(state: AppState, dom: DomElements): void {
    const canvasW = dom.canvas.width;
    const canvasH = dom.canvas.height;
    const imageW = state.totalWidth * state.viewScale;
    const imageH = state.totalHeight * state.viewScale;

    state.viewPanX = Math.round((canvasW - imageW) / 2);
    state.viewPanY = Math.round((canvasH - imageH) / 2);
}

function findMissingSourceIndex(state: AppState): number {
    const total = state.numCols * state.numRows;
    const used = new Set(state.cellOrder.filter((value) => value >= 0));
    for (let i = 0; i < total; i++) {
        if (!used.has(i)) return i;
    }
    return -1;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((result) => resolve(result), "image/png");
    });
}

async function copySelectedCell(state: AppState): Promise<void> {
    if (!state.isImageLoaded || !state.currentImg || !state.selectedCell) return;
    if (!navigator.clipboard || !navigator.clipboard.write) return;

    try {
        const { r, c } = state.selectedCell;
        const sourceIndex = getSourceIndex(state, r, c);
        if (sourceIndex < 0) return;

        const sourceCoords = getSourceCoords(state, sourceIndex);
        if (!sourceCoords) return;

        const cell = state.cellData[sourceCoords.r][sourceCoords.c];

        const cellW = Math.round(state.cellWidth);
        const cellH = Math.round(state.cellHeight);
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cellW;
        tempCanvas.height = cellH;

        const tCtx = tempCanvas.getContext("2d");
        if (!tCtx) return;
        tCtx.imageSmoothingEnabled = false;

        const sourceX = Math.round(sourceCoords.c * state.cellWidth);
        const sourceY = Math.round(sourceCoords.r * state.cellHeight);

        tCtx.save();
        tCtx.beginPath();
        tCtx.rect(0, 0, cellW, cellH);
        tCtx.clip();

        tCtx.drawImage(
            state.currentImg,
            sourceX,
            sourceY,
            cellW,
            cellH,
            cell.x,
            cell.y,
            cellW * cell.scale,
            cellH * cell.scale
        );
        tCtx.restore();

        const blob = await canvasToBlob(tempCanvas);
        if (!blob) return;

        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch (error) {
        console.warn("Copy failed.", error);
    }
}

async function pasteIntoSelectedCell(
    state: AppState,
    dom: DomElements,
    i18n: I18nApi,
    history: HistoryManager
): Promise<void> {
    if (!state.isImageLoaded || !state.currentImg || !state.selectedCell) return;
    if (!navigator.clipboard || !navigator.clipboard.read) return;

    try {
        const items = await navigator.clipboard.read();
        let blob: Blob | null = null;
        for (const item of items) {
            if (item.types.includes("image/png")) {
                blob = await item.getType("image/png");
                break;
            }
            if (item.types.includes("image/jpeg")) {
                blob = await item.getType("image/jpeg");
                break;
            }
        }
        if (!blob) return;

        const image = await new Promise<HTMLImageElement | null>((resolve) => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };
            img.src = url;
        });

        if (!image) return;

        const { r, c } = state.selectedCell;
        let sourceIndex = getSourceIndex(state, r, c);
        if (sourceIndex < 0) {
            const missing = findMissingSourceIndex(state);
            sourceIndex = missing >= 0 ? missing : getTargetIndex(state, r, c);
            state.cellOrder[getTargetIndex(state, r, c)] = sourceIndex;
        }

        const sourceCoords = getSourceCoords(state, sourceIndex);
        if (!sourceCoords) return;

        const baseCanvas = document.createElement("canvas");
        baseCanvas.width = state.totalWidth;
        baseCanvas.height = state.totalHeight;
        const baseCtx = baseCanvas.getContext("2d");
        if (!baseCtx) return;
        baseCtx.imageSmoothingEnabled = false;

        baseCtx.drawImage(state.currentImg, 0, 0);

        const cellW = Math.round(state.cellWidth);
        const cellH = Math.round(state.cellHeight);
        const destX = Math.round(sourceCoords.c * state.cellWidth);
        const destY = Math.round(sourceCoords.r * state.cellHeight);

        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = image.width;
        srcCanvas.height = image.height;
        const srcCtx = srcCanvas.getContext("2d");
        if (!srcCtx) return;
        srcCtx.imageSmoothingEnabled = false;
        srcCtx.drawImage(image, 0, 0);

        let pasteData: ImageData;
        if (image.width === cellW && image.height === cellH) {
            pasteData = srcCtx.getImageData(0, 0, image.width, image.height);
        } else {
            const scaleCanvas = document.createElement("canvas");
            scaleCanvas.width = cellW;
            scaleCanvas.height = cellH;
            const scaleCtx = scaleCanvas.getContext("2d");
            if (!scaleCtx) return;
            scaleCtx.imageSmoothingEnabled = false;
            scaleCtx.drawImage(srcCanvas, 0, 0, cellW, cellH);
            pasteData = scaleCtx.getImageData(0, 0, cellW, cellH);
        }

        baseCtx.clearRect(destX, destY, cellW, cellH);
        baseCtx.putImageData(pasteData, destX, destY);

        const mergedBlob = await canvasToBlob(baseCanvas);
        if (!mergedBlob) return;

        const imageKey = await saveImageBlob(mergedBlob);
        const mergedImage = await new Promise<HTMLImageElement | null>((resolve) => {
            const url = URL.createObjectURL(mergedBlob);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };
            img.src = url;
        });

        if (!mergedImage) return;

        state.currentImg = mergedImage;
        state.imageKey = imageKey;
        state.totalWidth = mergedImage.width;
        state.totalHeight = mergedImage.height;
        state.cellWidth = state.totalWidth / state.numCols;
        state.cellHeight = state.totalHeight / state.numRows;

        analyzeImage(state);
        renderCanvas(state, dom, i18n);
        updateOverlay(state, dom);
        await history.capture(state, "history.paste");
    } catch (error) {
        console.warn("Paste failed.", error);
    }
}

export function bindEvents(state: AppState, dom: DomElements, i18n: I18nApi, history: HistoryManager): void {
    let isReordering = false;
    let reorderSourceIndex = -1;
    let draggedCell = false;
    type EditorTool = "pan" | "select" | "pencil" | "fill" | "eraser" | "shape";
    type EditorCell = {
        target: CellIndex;
        sourceIndex: number;
        sourceCoords: { r: number; c: number };
        needsAssign: boolean;
    };
    const editorCtx = dom.editorCanvas.getContext("2d");
    let editorOpen = false;
    let editorTool: EditorTool = "pan";
    let editorImageData: ImageData | null = null;
    let editorCell: EditorCell | null = null;
    let editorScale = 12;
    let editorDisplayScale = 12;
    let editorZoom = 1;
    let editorHistory: ImageData[] = [];
    let editorHistoryIndex = -1;
    let editorDrawing = false;
    let lastDrawPos: { x: number; y: number } | null = null;
    let editorDrawColor: [number, number, number, number] | null = null;
    let editorCursorColor: string | null = null;
    let shapeDrawing = false;
    let shapeStart: { x: number; y: number } | null = null;
    let shapeBaseData: ImageData | null = null;
    let activeShape = "line";
    let selectionActive = false;
    let selectionRect = { x: 0, y: 0, w: 0, h: 0 };
    let selectionStart: { x: number; y: number } | null = null;
    let selectionOffset = { x: 0, y: 0 };
    let selectionData: ImageData | null = null;
    let moveBaseData: ImageData | null = null;
    let isSelecting = false;
    let isMovingSelection = false;
    let editorMaximized = false;
    let editorPanning = false;
    let editorPanStart: { x: number; y: number } | null = null;
    let editorSpacePressed = false;

    window.addEventListener("resize", () => initCanvasSize(state, dom, i18n));

    dom.chkPixelMode.addEventListener("change", () => renderCanvas(state, dom, i18n));
    dom.chkShowShortcuts.addEventListener("change", () => {
        const isVisible = dom.chkShowShortcuts.checked;
        const hint = document.getElementById("shortcutHint");
        if (hint) hint.style.display = isVisible ? "block" : "none";
    });

    const hint = document.getElementById("shortcutHint");
    if (hint) hint.style.display = dom.chkShowShortcuts.checked ? "block" : "none";

    if (!editorCtx) {
        console.warn("Editor canvas context unavailable.");
    }

    function closeCellMenu(): void {
        dom.cellMenu.classList.remove("is-open");
        dom.cellMenu.setAttribute("aria-hidden", "true");
    }

    function openCellMenu(x: number, y: number): void {
        dom.cellMenu.classList.add("is-open");
        dom.cellMenu.setAttribute("aria-hidden", "false");
        const rect = dom.cellMenu.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width - 8;
        const maxTop = window.innerHeight - rect.height - 8;
        const left = Math.max(8, Math.min(x, maxLeft));
        const top = Math.max(8, Math.min(y, maxTop));
        dom.cellMenu.style.left = `${left}px`;
        dom.cellMenu.style.top = `${top}px`;
    }

    function setSelectionActive(active: boolean): void {
        selectionActive = active;
        dom.editorDeleteSelectionBtn.disabled = !active;
    }

    function updateEditorHistoryButtons(): void {
        dom.editorUndoBtn.disabled = editorHistoryIndex <= 0;
        dom.editorRedoBtn.disabled = editorHistoryIndex >= editorHistory.length - 1;
    }

    function pushEditorHistory(): void {
        if (!editorImageData) return;
        const snapshot = cloneImageData(editorImageData);
        if (editorHistoryIndex < editorHistory.length - 1) {
            editorHistory = editorHistory.slice(0, editorHistoryIndex + 1);
        }
        editorHistory.push(snapshot);
        if (editorHistory.length > 50) {
            editorHistory.shift();
        }
        editorHistoryIndex = editorHistory.length - 1;
        updateEditorHistoryButtons();
    }

    function restoreEditorHistory(index: number): void {
        if (!editorHistory[index]) return;
        editorHistoryIndex = index;
        editorImageData = cloneImageData(editorHistory[index]);
        clearSelection();
        renderEditor();
        updateEditorHistoryButtons();
    }

    function clearSelection(): void {
        selectionStart = null;
        selectionData = null;
        moveBaseData = null;
        isSelecting = false;
        isMovingSelection = false;
        selectionRect = { x: 0, y: 0, w: 0, h: 0 };
        setSelectionActive(false);
    }

    function computeEditorScale(width: number, height: number): number {
        const maxSize = 420;
        const scale = Math.floor(Math.min(maxSize / width, maxSize / height));
        if (!Number.isFinite(scale) || scale <= 0) return 2;
        return Math.max(2, Math.min(24, scale));
    }

    function updateEditorZoom(): void {
        editorDisplayScale = editorScale * editorZoom;
        dom.editorCanvas.style.width = `${dom.editorCanvas.width * editorDisplayScale}px`;
        dom.editorCanvas.style.height = `${dom.editorCanvas.height * editorDisplayScale}px`;
        dom.editorCanvasWrap.style.setProperty("--pixel-size", `${editorDisplayScale}px`);
        updateEditorCursor(null);
    }

    function centerEditorView(): void {
        const body = dom.editorBody;
        body.scrollLeft = 0;
        body.scrollTop = 0;
        requestAnimationFrame(() => {
            const left = Math.max(0, (body.scrollWidth - body.clientWidth) / 2);
            const top = Math.max(0, (body.scrollHeight - body.clientHeight) / 2);
            body.scrollLeft = left;
            body.scrollTop = top;
        });
    }

    function getActiveBrushSize(): number {
        const active = dom.editorSizeButtons.find((btn) => btn.classList.contains("is-active"));
        const value = active?.dataset.size ? Number.parseInt(active.dataset.size, 10) : 1;
        return Number.isFinite(value) && value > 0 ? value : 1;
    }

    function setActiveBrushSize(size: number): void {
        dom.editorSizeButtons.forEach((btn) => {
            btn.classList.toggle("is-active", Number.parseInt(btn.dataset.size || "0", 10) === size);
        });
    }

    function updateEditorCursor(pos: { x: number; y: number } | null): void {
        if (!pos || !editorOpen || (editorTool !== "pencil" && editorTool !== "eraser")) {
            dom.editorCursor.style.transform = "translate(-9999px, -9999px)";
            dom.editorCursor.style.opacity = "0";
            return;
        }
        dom.editorCursor.style.opacity = "1";
        const brushSize = getActiveBrushSize();
        const size = Math.max(1, brushSize) * editorDisplayScale;
        dom.editorCursor.style.width = `${size}px`;
        dom.editorCursor.style.height = `${size}px`;
        const canvasRect = dom.editorCanvas.getBoundingClientRect();
        const wrapRect = dom.editorCanvasWrap.getBoundingClientRect();
        const offsetLeft = canvasRect.left - wrapRect.left;
        const offsetTop = canvasRect.top - wrapRect.top;
        const half = Math.floor((brushSize - 1) / 2);
        const left = offsetLeft + (pos.x - half) * editorDisplayScale;
        const top = offsetTop + (pos.y - half) * editorDisplayScale;
        dom.editorCursor.style.transform = `translate(${left}px, ${top}px)`;

        if (editorTool === "eraser") {
            dom.editorCursor.style.background = "rgba(255, 255, 255, 0.1)";
            dom.editorCursor.style.borderColor = "rgba(248, 113, 113, 0.9)";
        } else {
            const color = editorCursorColor ?? dom.editorColor.value;
            dom.editorCursor.style.background = `${color}44`;
            dom.editorCursor.style.borderColor = `${color}cc`;
        }

        dom.editorCursor.style.borderRadius = "0";
    }

    function getEditorPixelFromEventClamped(event: PointerEvent): { x: number; y: number } | null {
        const rect = dom.editorCanvas.getBoundingClientRect();
        const rawX = ((event.clientX - rect.left) / rect.width) * dom.editorCanvas.width;
        const rawY = ((event.clientY - rect.top) / rect.height) * dom.editorCanvas.height;
        if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) return null;
        const x = Math.max(0, Math.min(dom.editorCanvas.width - 1, Math.floor(rawX)));
        const y = Math.max(0, Math.min(dom.editorCanvas.height - 1, Math.floor(rawY)));
        return { x, y };
    }

    function cloneImageData(data: ImageData): ImageData {
        return new ImageData(new Uint8ClampedArray(data.data), data.width, data.height);
    }

    function getPixelIndex(width: number, x: number, y: number): number {
        return (y * width + x) * 4;
    }

    function getPixel(data: ImageData, x: number, y: number): [number, number, number, number] {
        const idx = getPixelIndex(data.width, x, y);
        return [data.data[idx], data.data[idx + 1], data.data[idx + 2], data.data[idx + 3]];
    }

    function setPixel(data: ImageData, x: number, y: number, r: number, g: number, b: number, a: number): void {
        const idx = getPixelIndex(data.width, x, y);
        data.data[idx] = r;
        data.data[idx + 1] = g;
        data.data[idx + 2] = b;
        data.data[idx + 3] = a;
    }

    function colorToRgba(value: string): [number, number, number, number] {
        let hex = value.trim().replace("#", "");
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((ch) => `${ch}${ch}`)
                .join("");
        }
        if (hex.length !== 6) return [0, 0, 0, 255];
        const num = Number.parseInt(hex, 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
    }

    function colorsMatch(a: [number, number, number, number], b: [number, number, number, number]): boolean {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
    }

    function extractRegion(data: ImageData, x: number, y: number, w: number, h: number): ImageData {
        const region = new ImageData(w, h);
        for (let yy = 0; yy < h; yy++) {
            for (let xx = 0; xx < w; xx++) {
                const srcX = x + xx;
                const srcY = y + yy;
                if (srcX < 0 || srcY < 0 || srcX >= data.width || srcY >= data.height) continue;
                const srcIdx = getPixelIndex(data.width, srcX, srcY);
                const destIdx = getPixelIndex(region.width, xx, yy);
                region.data[destIdx] = data.data[srcIdx];
                region.data[destIdx + 1] = data.data[srcIdx + 1];
                region.data[destIdx + 2] = data.data[srcIdx + 2];
                region.data[destIdx + 3] = data.data[srcIdx + 3];
            }
        }
        return region;
    }

    function clearRegion(data: ImageData, x: number, y: number, w: number, h: number): void {
        for (let yy = 0; yy < h; yy++) {
            for (let xx = 0; xx < w; xx++) {
                const px = x + xx;
                const py = y + yy;
                if (px < 0 || py < 0 || px >= data.width || py >= data.height) continue;
                setPixel(data, px, py, 0, 0, 0, 0);
            }
        }
    }

    function blitRegion(target: ImageData, src: ImageData, dx: number, dy: number): void {
        for (let yy = 0; yy < src.height; yy++) {
            for (let xx = 0; xx < src.width; xx++) {
                const tx = dx + xx;
                const ty = dy + yy;
                if (tx < 0 || ty < 0 || tx >= target.width || ty >= target.height) continue;
                const srcIdx = getPixelIndex(src.width, xx, yy);
                const destIdx = getPixelIndex(target.width, tx, ty);
                target.data[destIdx] = src.data[srcIdx];
                target.data[destIdx + 1] = src.data[srcIdx + 1];
                target.data[destIdx + 2] = src.data[srcIdx + 2];
                target.data[destIdx + 3] = src.data[srcIdx + 3];
            }
        }
    }

    function renderEditor(): void {
        if (!editorCtx || !editorImageData) return;
        const base = isMovingSelection && moveBaseData ? moveBaseData : editorImageData;
        editorCtx.imageSmoothingEnabled = false;
        editorCtx.putImageData(base, 0, 0);
        if (isMovingSelection && selectionData) {
            editorCtx.putImageData(selectionData, selectionRect.x, selectionRect.y);
        }
        if ((selectionActive || isSelecting || isMovingSelection) && selectionRect.w > 1 && selectionRect.h > 1) {
            editorCtx.save();
            editorCtx.strokeStyle = "rgba(59, 130, 246, 0.9)";
            editorCtx.lineWidth = 1;
            editorCtx.setLineDash([2, 2]);
            editorCtx.strokeRect(selectionRect.x + 0.5, selectionRect.y + 0.5, selectionRect.w, selectionRect.h);
            editorCtx.restore();
        }
    }

    function setEditorTool(nextTool: EditorTool): void {
        editorTool = nextTool;
        dom.editorToolButtons.forEach((btn) => {
            btn.classList.toggle("is-active", btn.dataset.tool === nextTool);
        });
        dom.editorSizeGroup.classList.add("is-visible");
        const hideCursor = editorTool === "pencil" || editorTool === "eraser";
        dom.editorCanvas.classList.toggle("hide-cursor", hideCursor);
        dom.editorCanvasWrap.classList.toggle("hide-cursor", hideCursor);
        dom.editorCanvas.style.cursor = editorTool === "pan" ? "grab" : "crosshair";
        editorDrawColor = null;
        editorCursorColor = null;
        shapeDrawing = false;
        shapeStart = null;
        shapeBaseData = null;
        updateEditorCursor(null);
    }

    function getEditorColorString(button: number): string {
        return button === 2 ? dom.editorColorRight.value : dom.editorColor.value;
    }

    function getEditorDrawColor(button: number): [number, number, number, number] {
        return colorToRgba(getEditorColorString(button));
    }

    const PRESET_PALETTES: Record<string, string[]> = {
        basic: [
            "#000000", "#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb", "#f3f4f6",
            "#ffffff", "#ef4444", "#dc2626", "#f97316", "#f59e0b", "#facc15", "#84cc16", "#22c55e", "#10b981", "#14b8a6",
            "#06b6d4", "#0ea5e9", "#3b82f6", "#2563eb", "#1d4ed8", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
        ],
        warm: [
            "#1f0a0a", "#3b0a0a", "#7f1d1d", "#991b1b", "#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fecaca", "#f97316",
            "#ea580c", "#c2410c", "#9a3412", "#f59e0b", "#d97706", "#b45309", "#fbbf24", "#fcd34d", "#fde68a", "#fef3c7",
            "#fb7185", "#f43f5e", "#ec4899", "#be123c", "#9f1239", "#7f1d1d", "#fde2e4", "#f9e5d8", "#ffe4b5", "#fff1e6",
        ],
        cool: [
            "#0f172a", "#111827", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0", "#f8fafc",
            "#0f766e", "#0d9488", "#14b8a6", "#2dd4bf", "#67e8f9", "#06b6d4", "#0ea5e9", "#38bdf8", "#3b82f6", "#2563eb",
            "#1d4ed8", "#6366f1", "#4f46e5", "#4338ca", "#312e81", "#22c55e", "#16a34a", "#84cc16", "#a3e635", "#d9f99d",
        ],
        pastel: [
            "#fde2e4", "#fad2e1", "#fbcfe8", "#f5d0fe", "#e9d5ff", "#dbeafe", "#bfdbfe", "#bae6fd", "#cffafe", "#ccfbf1",
            "#dcfce7", "#f0fdf4", "#fef9c3", "#fde68a", "#fef3c7", "#f9e5d8", "#f3e8ff", "#ede9fe", "#e0f2fe", "#e2ece9",
            "#f1f5f9", "#f8fafc", "#ffe4e6", "#fecdd3", "#fef2f2", "#fff7ed", "#ffedd5", "#fefce8", "#ecfccb", "#e2e8f0",
        ],
        mono: [
            "#000000", "#111111", "#1f1f1f", "#2e2e2e", "#3d3d3d", "#4c4c4c", "#5b5b5b", "#6a6a6a", "#7a7a7a", "#8a8a8a",
            "#9a9a9a", "#aaaaaa", "#bababa", "#c8c8c8", "#d6d6d6", "#e4e4e4", "#f0f0f0", "#f5f5f5", "#fafafa", "#ffffff",
            "#0a0a0a", "#141414", "#1a1a1a", "#242424", "#2a2a2a", "#333333", "#3a3a3a", "#444444", "#4a4a4a", "#555555",
        ],
    };

    function buildEditorPalette(imageData: ImageData, limit = 12): string[] {
        const { width, height, data } = imageData;
        const total = width * height;
        const step = Math.max(1, Math.floor(Math.sqrt(total / 12000)));
        const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();

        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const idx = (y * width + x) * 4;
                const a = data[idx + 3];
                if (a < 40) continue;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
                const bucket = buckets.get(key);
                if (bucket) {
                    bucket.count += 1;
                    bucket.r += r;
                    bucket.g += g;
                    bucket.b += b;
                } else {
                    buckets.set(key, { count: 1, r, g, b });
                }
            }
        }

        const sorted = Array.from(buckets.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        return sorted.map((bucket) => {
            const count = Math.max(1, bucket.count);
            const r = Math.round(bucket.r / count);
            const g = Math.round(bucket.g / count);
            const b = Math.round(bucket.b / count);
            return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
                .toString(16)
                .padStart(2, "0")}`;
        });
    }

    function renderPaletteSwatches(colors: string[]): void {
        dom.editorPalette.innerHTML = "";
        colors.forEach((color) => {
            const swatch = document.createElement("button");
            swatch.type = "button";
            swatch.className = "editor-swatch";
            swatch.style.color = color;
            swatch.title = color;
            swatch.dataset.color = color;
            swatch.addEventListener("click", () => {
                dom.editorColor.value = color;
                editorCursorColor = color;
                updateEditorCursor(null);
            });
            dom.editorPalette.appendChild(swatch);
        });
    }

    function updateEditorPalette(): void {
        if (!editorImageData) {
            dom.editorPalette.innerHTML = "";
            return;
        }
        const activeMode = dom.editorPaletteModes.find((btn) => btn.classList.contains("is-active"));
        const mode = activeMode?.dataset.mode || "image";
        if (mode !== "image" && PRESET_PALETTES[mode]) {
            renderPaletteSwatches(PRESET_PALETTES[mode]);
            return;
        }
        const colors = buildEditorPalette(editorImageData, 30);
        renderPaletteSwatches(colors);
    }

    const SHAPE_ICONS: Record<string, (ctx: CanvasRenderingContext2D, size: number) => void> = {
        line: (ctx, size) => {
            ctx.beginPath();
            ctx.moveTo(2, size - 3);
            ctx.lineTo(size - 3, 2);
            ctx.stroke();
        },
        rect: (ctx, size) => {
            ctx.strokeRect(3, 3, size - 6, size - 6);
        },
        rect_fill: (ctx, size) => {
            ctx.fillRect(3, 3, size - 6, size - 6);
        },
        circle: (ctx, size) => {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
            ctx.stroke();
        },
        circle_fill: (ctx, size) => {
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
            ctx.fill();
        },
        ellipse: (ctx, size) => {
            ctx.beginPath();
            ctx.ellipse(size / 2, size / 2, size / 2 - 3, size / 2 - 5, 0, 0, Math.PI * 2);
            ctx.stroke();
        },
        ellipse_fill: (ctx, size) => {
            ctx.beginPath();
            ctx.ellipse(size / 2, size / 2, size / 2 - 3, size / 2 - 5, 0, 0, Math.PI * 2);
            ctx.fill();
        },
        triangle: (ctx, size) => {
            ctx.beginPath();
            ctx.moveTo(size / 2, 3);
            ctx.lineTo(size - 3, size - 3);
            ctx.lineTo(3, size - 3);
            ctx.closePath();
            ctx.stroke();
        },
        triangle_fill: (ctx, size) => {
            ctx.beginPath();
            ctx.moveTo(size / 2, 3);
            ctx.lineTo(size - 3, size - 3);
            ctx.lineTo(3, size - 3);
            ctx.closePath();
            ctx.fill();
        },
        diamond: (ctx, size) => {
            ctx.beginPath();
            ctx.moveTo(size / 2, 2);
            ctx.lineTo(size - 3, size / 2);
            ctx.lineTo(size / 2, size - 3);
            ctx.lineTo(3, size / 2);
            ctx.closePath();
            ctx.stroke();
        },
        diamond_fill: (ctx, size) => {
            ctx.beginPath();
            ctx.moveTo(size / 2, 2);
            ctx.lineTo(size - 3, size / 2);
            ctx.lineTo(size / 2, size - 3);
            ctx.lineTo(3, size / 2);
            ctx.closePath();
            ctx.fill();
        },
        plus: (ctx, size) => {
            const c = Math.floor(size / 2);
            ctx.beginPath();
            ctx.moveTo(c, 3);
            ctx.lineTo(c, size - 3);
            ctx.moveTo(3, c);
            ctx.lineTo(size - 3, c);
            ctx.stroke();
        },
        cross: (ctx, size) => {
            ctx.beginPath();
            ctx.moveTo(3, 3);
            ctx.lineTo(size - 3, size - 3);
            ctx.moveTo(size - 3, 3);
            ctx.lineTo(3, size - 3);
            ctx.stroke();
        },
        star: (ctx, size) => {
            const c = Math.floor(size / 2);
            ctx.beginPath();
            ctx.moveTo(c, 2);
            ctx.lineTo(c, size - 3);
            ctx.moveTo(2, c);
            ctx.lineTo(size - 3, c);
            ctx.moveTo(3, 3);
            ctx.lineTo(size - 3, size - 3);
            ctx.moveTo(size - 3, 3);
            ctx.lineTo(3, size - 3);
            ctx.stroke();
        },
        arrow: (ctx, size) => {
            ctx.beginPath();
            ctx.moveTo(3, size - 4);
            ctx.lineTo(size - 5, 4);
            ctx.lineTo(size - 5, 10);
            ctx.moveTo(size - 5, 4);
            ctx.lineTo(size - 11, 4);
            ctx.stroke();
        },
    };

    function renderShapeButtons(): void {
        dom.editorShapeButtons.forEach((btn) => {
            const id = btn.dataset.shape || "line";
            const canvas = document.createElement("canvas");
            const size = 18;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, size, size);
            ctx.strokeStyle = "#ffffff";
            ctx.fillStyle = "#ffffff";
            ctx.lineWidth = 2;
            const draw = SHAPE_ICONS[id];
            if (draw) draw(ctx, size);
            btn.style.backgroundImage = `url(${canvas.toDataURL()})`;
            btn.style.backgroundSize = `${size}px ${size}px`;
        });
    }

    const PATTERN_DEFS: Record<string, { size: number; map: number[] }> = {
        solid: { size: 4, map: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        checker: { size: 4, map: [1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1] },
        checker2: { size: 4, map: [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1] },
        dots: { size: 4, map: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1] },
        dots2: { size: 4, map: [0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0] },
        hatch: { size: 4, map: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
        hatch2: { size: 4, map: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0] },
        hstripe: { size: 4, map: [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0] },
        vstripe: { size: 4, map: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
        diag: { size: 4, map: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] },
        diag2: { size: 4, map: [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0] },
        grid: { size: 4, map: [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0] },
        grid2: { size: 4, map: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1] },
        cross: { size: 4, map: [0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0] },
        noise: { size: 4, map: [1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1] },
    };

    let activePattern = "solid";

    function getPatternValue(id: string, x: number, y: number): boolean {
        const def = PATTERN_DEFS[id] ?? PATTERN_DEFS.solid;
        const size = def.size;
        const ix = ((x % size) + size) % size;
        const iy = ((y % size) + size) % size;
        return def.map[iy * size + ix] === 1;
    }

    function renderPatternButtons(): void {
        dom.editorPatternButtons.forEach((btn) => {
            const id = btn.dataset.pattern || "solid";
            const def = PATTERN_DEFS[id] ?? PATTERN_DEFS.solid;
            const size = def.size;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = "#ffffff";
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (def.map[y * size + x] === 1) {
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            btn.style.backgroundImage = `url(${canvas.toDataURL()})`;
            btn.style.backgroundSize = `${size * 2}px ${size * 2}px`;
        });
    }

    function floodFillPattern(startX: number, startY: number, fillColor: [number, number, number, number], patternId: string): void {
        if (!editorImageData) return;
        const targetColor = getPixel(editorImageData, startX, startY);
        const { width, height } = editorImageData;
        const visited = new Uint8Array(width * height);
        const stack: Array<[number, number]> = [[startX, startY]];

        while (stack.length > 0) {
            const [x, y] = stack.pop() as [number, number];
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const idx = y * width + x;
            if (visited[idx]) continue;
            visited[idx] = 1;
            const currentColor = getPixel(editorImageData, x, y);
            if (!colorsMatch(currentColor, targetColor)) continue;
            if (getPatternValue(patternId, x, y)) {
                setPixel(editorImageData, x, y, fillColor[0], fillColor[1], fillColor[2], fillColor[3]);
            }
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }

    function drawFilledShape(
        minX: number,
        minY: number,
        maxX: number,
        maxY: number,
        predicate: (x: number, y: number) => boolean,
        color: [number, number, number, number]
    ): void {
        if (!editorImageData) return;
        const clampedMinX = Math.max(0, minX);
        const clampedMinY = Math.max(0, minY);
        const clampedMaxX = Math.min(editorImageData.width - 1, maxX);
        const clampedMaxY = Math.min(editorImageData.height - 1, maxY);
        for (let y = clampedMinY; y <= clampedMaxY; y++) {
            for (let x = clampedMinX; x <= clampedMaxX; x++) {
                if (predicate(x, y)) {
                    setPixel(editorImageData, x, y, color[0], color[1], color[2], color[3]);
                }
            }
        }
    }

    function drawFilledShapeFull(
        predicate: (x: number, y: number) => boolean,
        color: [number, number, number, number]
    ): void {
        if (!editorImageData) return;
        for (let y = 0; y < editorImageData.height; y++) {
            for (let x = 0; x < editorImageData.width; x++) {
                if (predicate(x, y)) {
                    setPixel(editorImageData, x, y, color[0], color[1], color[2], color[3]);
                }
            }
        }
    }

    function drawEllipseOutline(
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        brushSize: number,
        color: [number, number, number, number]
    ): void {
        if (rx <= 0 || ry <= 0) return;
        const steps = Math.max(12, Math.ceil(2 * Math.PI * Math.max(rx, ry)));
        let prevX = Math.round(cx + rx);
        let prevY = Math.round(cy);
        for (let i = 1; i <= steps; i++) {
            const t = (i / steps) * Math.PI * 2;
            const x = Math.round(cx + Math.cos(t) * rx);
            const y = Math.round(cy + Math.sin(t) * ry);
            drawLine(prevX, prevY, x, y, brushSize, color);
            prevX = x;
            prevY = y;
        }
    }

    function drawShape(
        shapeId: string,
        start: { x: number; y: number },
        end: { x: number; y: number },
        color: [number, number, number, number],
        brushSize: number
    ): void {
        const x0 = start.x;
        const y0 = start.y;
        const x1 = end.x;
        const y1 = end.y;
        const minX = Math.min(x0, x1);
        const maxX = Math.max(x0, x1);
        const minY = Math.min(y0, y1);
        const maxY = Math.max(y0, y1);
        const margin = Math.max(0, Math.floor((brushSize - 1) / 2));
        const padMinX = minX - margin;
        const padMaxX = maxX + margin;
        const padMinY = minY - margin;
        const padMaxY = maxY + margin;
        const midX = Math.floor((padMinX + padMaxX) / 2);
        const midY = Math.floor((padMinY + padMaxY) / 2);

        switch (shapeId) {
            case "line":
                drawLine(x0, y0, x1, y1, brushSize, color);
                return;
            case "rect":
                drawLine(padMinX, padMinY, padMaxX, padMinY, brushSize, color);
                drawLine(padMaxX, padMinY, padMaxX, padMaxY, brushSize, color);
                drawLine(padMaxX, padMaxY, padMinX, padMaxY, brushSize, color);
                drawLine(padMinX, padMaxY, padMinX, padMinY, brushSize, color);
                return;
            case "rect_fill":
                drawFilledShapeFull((x, y) => x >= minX && x <= maxX && y >= minY && y <= maxY, color);
                return;
            case "circle":
            case "circle_fill": {
                const rx = Math.max(1, Math.floor((padMaxX - padMinX) / 2));
                const ry = rx;
                const cx = padMinX + rx;
                const cy = padMinY + ry;
                if (shapeId === "circle_fill") {
                    drawFilledShapeFull(
                        (x, y) => {
                            const dx = (x - cx) / rx;
                            const dy = (y - cy) / ry;
                            const d = dx * dx + dy * dy;
                            return d <= 1;
                        },
                        color
                    );
                } else {
                    drawEllipseOutline(cx, cy, rx, ry, brushSize, color);
                }
                return;
            }
            case "ellipse":
            case "ellipse_fill": {
                const rx = Math.max(1, Math.floor((padMaxX - padMinX) / 2));
                const ry = Math.max(1, Math.floor((padMaxY - padMinY) / 2));
                const cx = padMinX + rx;
                const cy = padMinY + ry;
                if (shapeId === "ellipse_fill") {
                    drawFilledShapeFull(
                        (x, y) => {
                            const dx = (x - cx) / rx;
                            const dy = (y - cy) / ry;
                            const d = dx * dx + dy * dy;
                            return d <= 1;
                        },
                        color
                    );
                } else {
                    drawEllipseOutline(cx, cy, rx, ry, brushSize, color);
                }
                return;
            }
            case "triangle": {
                drawLine(midX, padMinY, padMaxX, padMaxY, brushSize, color);
                drawLine(padMaxX, padMaxY, padMinX, padMaxY, brushSize, color);
                drawLine(padMinX, padMaxY, midX, padMinY, brushSize, color);
                return;
            }
            case "triangle_fill": {
                const ax = midX, ay = minY;
                const bx = maxX, by = maxY;
                const cx = minX, cy = maxY;
                const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
                drawFilledShapeFull((x, y) => {
                    const w1 = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
                    const w2 = (cx - bx) * (y - by) - (cy - by) * (x - bx);
                    const w3 = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);
                    return area >= 0 ? w1 >= 0 && w2 >= 0 && w3 >= 0 : w1 <= 0 && w2 <= 0 && w3 <= 0;
                }, color);
                return;
            }
            case "diamond": {
                drawLine(midX, padMinY, padMaxX, midY, brushSize, color);
                drawLine(padMaxX, midY, midX, padMaxY, brushSize, color);
                drawLine(midX, padMaxY, padMinX, midY, brushSize, color);
                drawLine(padMinX, midY, midX, padMinY, brushSize, color);
                return;
            }
            case "diamond_fill": {
                drawFilledShapeFull((x, y) => {
                    return Math.abs(x - midX) + Math.abs(y - midY) <= Math.max(maxX - midX, maxY - midY);
                }, color);
                return;
            }
            case "plus": {
                drawLine(midX, padMinY, midX, padMaxY, brushSize, color);
                drawLine(padMinX, midY, padMaxX, midY, brushSize, color);
                return;
            }
            case "cross": {
                drawLine(padMinX, padMinY, padMaxX, padMaxY, brushSize, color);
                drawLine(padMaxX, padMinY, padMinX, padMaxY, brushSize, color);
                return;
            }
            case "star": {
                drawLine(midX, padMinY, midX, padMaxY, brushSize, color);
                drawLine(padMinX, midY, padMaxX, midY, brushSize, color);
                drawLine(padMinX, padMinY, padMaxX, padMaxY, brushSize, color);
                drawLine(padMaxX, padMinY, padMinX, padMaxY, brushSize, color);
                return;
            }
            case "arrow": {
                const dx = x1 - x0;
                const dy = y1 - y0;
                const len = Math.hypot(dx, dy);
                if (len === 0) {
                    drawLine(x0, y0, x0, y0, brushSize, color);
                    return;
                }
                const ux = dx / len;
                const uy = dy / len;
                const arrowLen = Math.max(3, brushSize * 2);
                const angle = Math.PI / 6;
                const bx = -ux;
                const by = -uy;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                const leftX = bx * cosA - by * sinA;
                const leftY = bx * sinA + by * cosA;
                const rightX = bx * cosA + by * sinA;
                const rightY = -bx * sinA + by * cosA;
                drawLine(x0, y0, x1, y1, brushSize, color);
                drawLine(x1, y1, Math.round(x1 + leftX * arrowLen), Math.round(y1 + leftY * arrowLen), brushSize, color);
                drawLine(x1, y1, Math.round(x1 + rightX * arrowLen), Math.round(y1 + rightY * arrowLen), brushSize, color);
                return;
            }
            default:
                drawLine(x0, y0, x1, y1, brushSize, color);
        }
    }

    function getEditorPixelFromEvent(event: PointerEvent): { x: number; y: number } | null {
        const rect = dom.editorCanvas.getBoundingClientRect();
        const x = Math.floor(((event.clientX - rect.left) / rect.width) * dom.editorCanvas.width);
        const y = Math.floor(((event.clientY - rect.top) / rect.height) * dom.editorCanvas.height);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        if (x < 0 || y < 0 || x >= dom.editorCanvas.width || y >= dom.editorCanvas.height) return null;
        return { x, y };
    }

    function drawBrush(x: number, y: number, size: number, color: [number, number, number, number]): void {
        if (!editorImageData) return;
        const brushSize = Math.max(1, Math.floor(size));
        const half = Math.floor((brushSize - 1) / 2);
        const startX = Math.max(0, x - half);
        const startY = Math.max(0, y - half);
        const endX = Math.min(editorImageData.width - 1, startX + brushSize - 1);
        const endY = Math.min(editorImageData.height - 1, startY + brushSize - 1);
        for (let yy = startY; yy <= endY; yy++) {
            for (let xx = startX; xx <= endX; xx++) {
                setPixel(editorImageData, xx, yy, color[0], color[1], color[2], color[3]);
            }
        }
    }

    function drawLine(
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        size: number,
        color: [number, number, number, number]
    ): void {
        const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        if (steps === 0) {
            drawBrush(x0, y0, size, color);
            return;
        }
        for (let i = 0; i <= steps; i++) {
            const x = Math.round(x0 + ((x1 - x0) * i) / steps);
            const y = Math.round(y0 + ((y1 - y0) * i) / steps);
            drawBrush(x, y, size, color);
        }
    }

    function floodFill(startX: number, startY: number, fillColor: [number, number, number, number]): void {
        if (!editorImageData) return;
        const targetColor = getPixel(editorImageData, startX, startY);
        if (colorsMatch(targetColor, fillColor)) return;
        const stack: Array<[number, number]> = [[startX, startY]];
        const { width, height } = editorImageData;
        while (stack.length > 0) {
            const [x, y] = stack.pop() as [number, number];
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            const currentColor = getPixel(editorImageData, x, y);
            if (!colorsMatch(currentColor, targetColor)) continue;
            setPixel(editorImageData, x, y, fillColor[0], fillColor[1], fillColor[2], fillColor[3]);
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }

    function openEditorForCell(cell: CellIndex): void {
        if (!editorCtx || !state.isImageLoaded || !state.currentImg) return;
        closeCellMenu();
        const sourceIndex = getSourceIndex(state, cell.r, cell.c);
        let assignedIndex = sourceIndex;
        let needsAssign = false;
        if (assignedIndex < 0) {
            const missing = findMissingSourceIndex(state);
            assignedIndex = missing >= 0 ? missing : getTargetIndex(state, cell.r, cell.c);
            needsAssign = true;
        }
        const sourceCoords = getSourceCoords(state, assignedIndex);
        if (!sourceCoords) return;

        const cellW = Math.max(1, Math.round(state.cellWidth));
        const cellH = Math.max(1, Math.round(state.cellHeight));
        dom.editorCanvas.width = cellW;
        dom.editorCanvas.height = cellH;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = cellW;
        tempCanvas.height = cellH;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;
        tempCtx.clearRect(0, 0, cellW, cellH);
        if (sourceIndex >= 0) {
            tempCtx.drawImage(
                state.currentImg,
                sourceCoords.c * state.cellWidth,
                sourceCoords.r * state.cellHeight,
                state.cellWidth,
                state.cellHeight,
                0,
                0,
                cellW,
                cellH
            );
        }

        editorImageData = tempCtx.getImageData(0, 0, cellW, cellH);
        editorCell = { target: cell, sourceIndex: assignedIndex, sourceCoords, needsAssign };
        editorScale = computeEditorScale(cellW, cellH);
        editorZoom = 1;
        updateEditorZoom();
        editorPanning = false;
        editorPanStart = null;
        editorSpacePressed = false;
        editorHistory = [];
        editorHistoryIndex = -1;
        pushEditorHistory();
        clearSelection();
        setEditorTool("pan");
        dom.editorPaletteModes.forEach((btn) => {
            btn.classList.toggle("is-active", btn.dataset.mode === "image");
        });
        activePattern = "solid";
        dom.editorPatternButtons.forEach((btn) => {
            btn.classList.toggle("is-active", btn.dataset.pattern === "solid");
        });
        activeShape = "line";
        dom.editorShapeButtons.forEach((btn) => {
            btn.classList.toggle("is-active", btn.dataset.shape === "line");
        });
        renderPatternButtons();
        renderShapeButtons();
        updateEditorPalette();
        dom.editorMaximizeBtn.setAttribute("aria-label", i18n.t("editor.maximize"));
        dom.editorMaximizeBtn.setAttribute("title", i18n.t("editor.maximize"));
        dom.editorMaximizeBtn.innerHTML = "<span class=\"msr\">open_in_full</span>";
        editorOpen = true;
        dom.cellEditor.classList.add("is-open");
        dom.cellEditor.setAttribute("aria-hidden", "false");
        renderEditor();
        centerEditorView();
    }

    async function saveEditorImage(): Promise<void> {
        if (!editorImageData || !editorCell || !state.currentImg) return;
        const baseCanvas = document.createElement("canvas");
        baseCanvas.width = state.totalWidth;
        baseCanvas.height = state.totalHeight;
        const baseCtx = baseCanvas.getContext("2d");
        if (!baseCtx) return;
        baseCtx.imageSmoothingEnabled = false;
        baseCtx.drawImage(state.currentImg, 0, 0);

        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = editorImageData.width;
        exportCanvas.height = editorImageData.height;
        const exportCtx = exportCanvas.getContext("2d");
        if (!exportCtx) return;
        exportCtx.putImageData(editorImageData, 0, 0);

        const destX = editorCell.sourceCoords.c * state.cellWidth;
        const destY = editorCell.sourceCoords.r * state.cellHeight;
        baseCtx.clearRect(destX, destY, state.cellWidth, state.cellHeight);
        baseCtx.drawImage(
            exportCanvas,
            0,
            0,
            exportCanvas.width,
            exportCanvas.height,
            destX,
            destY,
            state.cellWidth,
            state.cellHeight
        );

        const mergedBlob = await canvasToBlob(baseCanvas);
        if (!mergedBlob) return;
        const imageKey = await saveImageBlob(mergedBlob);
        const mergedImage = await new Promise<HTMLImageElement | null>((resolve) => {
            const url = URL.createObjectURL(mergedBlob);
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };
            img.src = url;
        });
        if (!mergedImage) return;

        if (editorCell.needsAssign) {
            const targetIndex = getTargetIndex(state, editorCell.target.r, editorCell.target.c);
            state.cellOrder[targetIndex] = editorCell.sourceIndex;
        }

        state.currentImg = mergedImage;
        state.imageKey = imageKey;
        state.totalWidth = mergedImage.width;
        state.totalHeight = mergedImage.height;
        state.cellWidth = state.totalWidth / state.numCols;
        state.cellHeight = state.totalHeight / state.numRows;

        analyzeImage(state);
        renderCanvas(state, dom, i18n);
        updateOverlay(state, dom);
        await history.capture(state, "history.edit");
        closeEditor();
    }

    function closeEditor(): void {
        editorOpen = false;
        editorImageData = null;
        editorCell = null;
        clearSelection();
        editorHistory = [];
        editorHistoryIndex = -1;
        updateEditorHistoryButtons();
        editorMaximized = false;
        dom.editorMaximizeBtn.setAttribute("aria-label", i18n.t("editor.maximize"));
        dom.editorMaximizeBtn.setAttribute("title", i18n.t("editor.maximize"));
        dom.editorMaximizeBtn.innerHTML = "&#x26F6;";
        dom.cellEditor.querySelector(".editor-card")?.classList.remove("is-maximized");
        dom.cellEditor.classList.remove("is-open");
        dom.cellEditor.setAttribute("aria-hidden", "true");
    }

    dom.cellMenuEdit.addEventListener("click", () => {
        closeCellMenu();
        if (state.selectedCell) openEditorForCell(state.selectedCell);
    });
    dom.cellMenuCopy.addEventListener("click", () => {
        closeCellMenu();
        void copySelectedCell(state);
    });
    dom.cellMenuPaste.addEventListener("click", () => {
        closeCellMenu();
        void pasteIntoSelectedCell(state, dom, i18n, history);
    });

    window.addEventListener("mousedown", (event) => {
        if (!dom.cellMenu.classList.contains("is-open")) return;
        if (dom.cellMenu.contains(event.target as Node)) return;
        closeCellMenu();
    });

    dom.editorToolButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const tool = btn.dataset.tool as EditorTool | undefined;
            if (!tool) return;
            setEditorTool(tool);
        });
    });

    dom.editorColor.addEventListener("input", () => {
        if (!editorOpen) return;
    });

    dom.editorSizeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!editorOpen) return;
            const value = Number.parseInt(btn.dataset.size || "1", 10);
            setActiveBrushSize(Number.isFinite(value) ? value : 1);
            updateEditorCursor(null);
        });
    });

    dom.editorPaletteModes.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!editorOpen) return;
            dom.editorPaletteModes.forEach((item) => {
                item.classList.toggle("is-active", item === btn);
            });
            updateEditorPalette();
        });
    });

    dom.editorPatternButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!editorOpen) return;
            activePattern = btn.dataset.pattern || "solid";
            dom.editorPatternButtons.forEach((item) => {
                item.classList.toggle("is-active", item === btn);
            });
        });
    });

    dom.editorShapeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!editorOpen) return;
            activeShape = btn.dataset.shape || "line";
            dom.editorShapeButtons.forEach((item) => {
                item.classList.toggle("is-active", item === btn);
            });
            setEditorTool("shape");
        });
    });

    dom.editorDeleteSelectionBtn.addEventListener("click", () => {
        if (!editorImageData || !selectionActive) return;
        clearRegion(editorImageData, selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
        clearSelection();
        pushEditorHistory();
        renderEditor();
    });

    dom.editorSaveBtn.addEventListener("click", () => {
        void saveEditorImage();
    });
    dom.editorCancelBtn.addEventListener("click", () => {
        closeEditor();
    });
    dom.editorUndoBtn.addEventListener("click", () => {
        if (!editorOpen) return;
        restoreEditorHistory(editorHistoryIndex - 1);
    });
    dom.editorRedoBtn.addEventListener("click", () => {
        if (!editorOpen) return;
        restoreEditorHistory(editorHistoryIndex + 1);
    });
    dom.editorMaximizeBtn.addEventListener("click", () => {
        editorMaximized = !editorMaximized;
        const card = dom.cellEditor.querySelector(".editor-card");
        card?.classList.toggle("is-maximized", editorMaximized);
        if (editorMaximized) {
            dom.editorMaximizeBtn.setAttribute("aria-label", i18n.t("editor.restore"));
            dom.editorMaximizeBtn.setAttribute("title", i18n.t("editor.restore"));
            dom.editorMaximizeBtn.innerHTML = "<span class=\"msr\">close_fullscreen</span>";
        } else {
            dom.editorMaximizeBtn.setAttribute("aria-label", i18n.t("editor.maximize"));
            dom.editorMaximizeBtn.setAttribute("title", i18n.t("editor.maximize"));
            dom.editorMaximizeBtn.innerHTML = "<span class=\"msr\">open_in_full</span>";
        }
    });
    dom.editorCloseBtn.addEventListener("click", () => {
        closeEditor();
    });
    dom.cellEditor.addEventListener("mousedown", (event) => {
        if (event.target === dom.cellEditor) closeEditor();
    });

    dom.editorCanvas.addEventListener("pointerdown", (event) => {
        if (!editorOpen || !editorCtx || !editorImageData) return;
        if (editorTool === "pan" && event.button === 0) {
            editorPanning = true;
            editorPanStart = { x: event.clientX, y: event.clientY };
            dom.editorCanvas.setPointerCapture(event.pointerId);
            dom.editorCanvas.style.cursor = "grabbing";
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if (editorTool === "pan") return;
        if (event.button !== 0 && event.button !== 2) return;
        event.preventDefault();
        const pos = getEditorPixelFromEvent(event);
        if (!pos) return;
        editorCursorColor = editorTool === "eraser" ? null : getEditorColorString(event.button);
        updateEditorCursor(pos);
        dom.editorCanvas.setPointerCapture(event.pointerId);
        const brushSize = getActiveBrushSize();
        const color = getEditorDrawColor(event.button);
        const eraseColor: [number, number, number, number] = [0, 0, 0, 0];

        if (editorTool === "shape") {
            shapeDrawing = true;
            shapeStart = pos;
            shapeBaseData = editorImageData ? cloneImageData(editorImageData) : null;
            editorDrawColor = color;
            renderEditor();
            return;
        }

        if (editorTool === "fill") {
            if (activePattern === "solid") {
                floodFill(pos.x, pos.y, color);
            } else {
                floodFillPattern(pos.x, pos.y, color, activePattern);
            }
            pushEditorHistory();
            renderEditor();
            return;
        }

        if (editorTool === "select") {
            if (
                selectionActive &&
                pos.x >= selectionRect.x &&
                pos.x < selectionRect.x + selectionRect.w &&
                pos.y >= selectionRect.y &&
                pos.y < selectionRect.y + selectionRect.h
            ) {
                isMovingSelection = true;
                selectionOffset = { x: pos.x - selectionRect.x, y: pos.y - selectionRect.y };
                selectionData = extractRegion(editorImageData, selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
                moveBaseData = cloneImageData(editorImageData);
                clearRegion(moveBaseData, selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
            } else {
                clearSelection();
                isSelecting = true;
                selectionStart = pos;
                selectionRect = { x: pos.x, y: pos.y, w: 1, h: 1 };
            }
            renderEditor();
            return;
        }

        editorDrawing = true;
        lastDrawPos = pos;
        editorDrawColor = editorTool === "eraser" ? eraseColor : color;
        drawLine(pos.x, pos.y, pos.x, pos.y, brushSize, editorDrawColor);
        renderEditor();
    });

    dom.editorCanvas.addEventListener("pointermove", (event) => {
        if (!editorOpen || !editorCtx || !editorImageData) return;
        if (editorPanning && editorPanStart) {
            const dx = event.clientX - editorPanStart.x;
            const dy = event.clientY - editorPanStart.y;
            editorPanStart = { x: event.clientX, y: event.clientY };
            dom.editorBody.scrollLeft -= dx;
            dom.editorBody.scrollTop -= dy;
            return;
        }
        const pos = getEditorPixelFromEvent(event);
        updateEditorCursor(pos);
        if (!pos) return;
        const brushSize = getActiveBrushSize();
        const color = colorToRgba(dom.editorColor.value);
        const eraseColor: [number, number, number, number] = [0, 0, 0, 0];

        if (shapeDrawing && shapeStart && shapeBaseData) {
            editorImageData = cloneImageData(shapeBaseData);
            drawShape(activeShape, shapeStart, pos, editorDrawColor ?? color, brushSize);
            renderEditor();
            return;
        }

        if (editorDrawing && lastDrawPos) {
            const drawColor = editorTool === "eraser" ? eraseColor : editorDrawColor ?? color;
            drawLine(lastDrawPos.x, lastDrawPos.y, pos.x, pos.y, brushSize, drawColor);
            lastDrawPos = pos;
            renderEditor();
            return;
        }

        if (isSelecting && selectionStart) {
            const clamped = getEditorPixelFromEventClamped(event);
            if (!clamped) return;
            const x0 = selectionStart.x;
            const y0 = selectionStart.y;
            const x1 = clamped.x;
            const y1 = clamped.y;
            const minX = Math.max(0, Math.min(x0, x1));
            const minY = Math.max(0, Math.min(y0, y1));
            const maxX = Math.min(editorImageData.width - 1, Math.max(x0, x1));
            const maxY = Math.min(editorImageData.height - 1, Math.max(y0, y1));
            selectionRect = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
            renderEditor();
            return;
        }

        if (isMovingSelection && selectionData && moveBaseData) {
            const nextX = Math.max(
                0,
                Math.min(pos.x - selectionOffset.x, editorImageData.width - selectionRect.w)
            );
            const nextY = Math.max(
                0,
                Math.min(pos.y - selectionOffset.y, editorImageData.height - selectionRect.h)
            );
            selectionRect = { ...selectionRect, x: nextX, y: nextY };
            renderEditor();
        }
    });

    dom.editorCanvas.addEventListener("pointerup", (event) => {
        if (!editorOpen || !editorCtx || !editorImageData) return;
        dom.editorCanvas.releasePointerCapture(event.pointerId);
        if (editorPanning) {
            editorPanning = false;
            editorPanStart = null;
            dom.editorCanvas.style.cursor = editorTool === "pan" ? "grab" : "crosshair";
            return;
        }
        updateEditorCursor(getEditorPixelFromEvent(event));
        if (shapeDrawing) {
            const pos = getEditorPixelFromEvent(event);
            if (pos && shapeStart && shapeBaseData) {
                editorImageData = cloneImageData(shapeBaseData);
                drawShape(activeShape, shapeStart, pos, editorDrawColor ?? colorToRgba(dom.editorColor.value), getActiveBrushSize());
                pushEditorHistory();
                renderEditor();
            }
            shapeDrawing = false;
            shapeStart = null;
            shapeBaseData = null;
            return;
        }
        if (editorDrawing) {
            editorDrawing = false;
            lastDrawPos = null;
            editorDrawColor = null;
            editorCursorColor = null;
            pushEditorHistory();
        }
        if (isSelecting) {
            isSelecting = false;
            setSelectionActive(true);
            renderEditor();
        }
        if (isMovingSelection && selectionData && moveBaseData) {
            editorImageData = cloneImageData(moveBaseData);
            blitRegion(editorImageData, selectionData, selectionRect.x, selectionRect.y);
            isMovingSelection = false;
            moveBaseData = null;
            pushEditorHistory();
            renderEditor();
        }
    });

    dom.editorCanvas.addEventListener("pointercancel", (event) => {
        if (!editorOpen || !editorCtx || !editorImageData) return;
        dom.editorCanvas.releasePointerCapture(event.pointerId);
        if (editorPanning) {
            editorPanning = false;
            editorPanStart = null;
            dom.editorCanvas.style.cursor = editorTool === "pan" ? "grab" : "crosshair";
        }
        updateEditorCursor(null);
        editorDrawing = false;
        lastDrawPos = null;
        editorDrawColor = null;
        editorCursorColor = null;
        if (shapeDrawing && shapeBaseData) {
            editorImageData = cloneImageData(shapeBaseData);
        }
        shapeDrawing = false;
        shapeStart = null;
        shapeBaseData = null;
        isSelecting = false;
        if (isMovingSelection && selectionData && moveBaseData) {
            editorImageData = cloneImageData(moveBaseData);
            blitRegion(editorImageData, selectionData, selectionRect.x, selectionRect.y);
            isMovingSelection = false;
            moveBaseData = null;
        }
        renderEditor();
    });

    dom.editorCanvas.addEventListener("pointerleave", () => {
        if (!editorOpen) return;
        updateEditorCursor(null);
    });

    dom.editorCanvas.addEventListener("contextmenu", (event) => {
        if (!editorOpen) return;
        event.preventDefault();
    });

    dom.editorBody.addEventListener("wheel", (event) => {
        if (!editorOpen) return;
        const target = event.target as HTMLElement | null;
        if (!target || (!dom.editorCanvasWrap.contains(target) && target !== dom.editorCanvas)) return;
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        editorZoom = Math.max(0.5, Math.min(4, editorZoom + delta));
        updateEditorZoom();
    }, { passive: false });

    dom.editorBody.addEventListener("mousedown", (event) => {
        if (!editorOpen) return;
        if (event.button !== 1 && !editorSpacePressed && !(editorTool === "pan" && event.button === 0)) return;
        editorPanning = true;
        editorPanStart = { x: event.clientX, y: event.clientY };
        dom.editorCanvas.style.cursor = "grabbing";
        event.preventDefault();
    });

    dom.editorBody.addEventListener("mousemove", (event) => {
        if (!editorOpen || !editorPanning || !editorPanStart) return;
        const dx = event.clientX - editorPanStart.x;
        const dy = event.clientY - editorPanStart.y;
        editorPanStart = { x: event.clientX, y: event.clientY };
        dom.editorBody.scrollLeft -= dx;
        dom.editorBody.scrollTop -= dy;
    });

    dom.editorBody.addEventListener("mouseup", () => {
        if (!editorOpen) return;
        editorPanning = false;
        editorPanStart = null;
        dom.editorCanvas.style.cursor = editorTool === "pan" ? "grab" : "crosshair";
    });

    window.addEventListener("mouseup", () => {
        if (!editorOpen) return;
        editorPanning = false;
        editorPanStart = null;
        dom.editorCanvas.style.cursor = editorTool === "pan" ? "grab" : "crosshair";
        updateEditorCursor(null);
    });

    [dom.inpIsoGridSize, dom.inpIsoTileW, dom.inpIsoTileH].forEach((input) => {
        input.addEventListener("input", () => updateIsoSettings(state, dom, i18n));
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") updateIsoSettings(state, dom, i18n);
        });
    });

    [dom.inpAnchorX, dom.inpAnchorY].forEach((input) => {
        input.addEventListener("input", () => applyAnchorInputs(state, dom, i18n));
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                applyAnchorInputs(state, dom, i18n);
            }
        });
    });

    dom.selAnchorMode.addEventListener("change", () => applyAnchorInputs(state, dom, i18n));


    [dom.inpCols, dom.inpRows].forEach((input) => {
        input.addEventListener("input", () => {
            if (!state.isImageLoaded) updateGridSettings(state, dom);
        });
        input.addEventListener("change", () => applyGridChange(state, dom, i18n, history));
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                applyGridChange(state, dom, i18n, history);
            }
        });
    });

    dom.canvas.addEventListener(
        "wheel",
        (event) => {
            event.preventDefault();
            if (editorOpen) return;
            if (!state.isImageLoaded) return;

            const zoomIntensity = 0.1;
            const delta = event.deltaY > 0 ? -zoomIntensity : zoomIntensity;
            const newScale = Math.min(Math.max(0.1, state.viewScale + delta), 10.0);

            const rect = dom.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const worldPos = screenToWorld(state, mouseX, mouseY);
            state.viewPanX = mouseX - worldPos.x * newScale;
            state.viewPanY = mouseY - worldPos.y * newScale;
            state.viewScale = newScale;

            renderCanvas(state, dom, i18n);
            updateOverlay(state, dom);
        },
        { passive: false }
    );

    window.addEventListener("keydown", (event) => {
        if (editorOpen) {
            if (event.code === "Space" && !event.repeat) {
                event.preventDefault();
                editorSpacePressed = true;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                closeEditor();
            }
            if (event.key === "Delete" && selectionActive && editorImageData) {
                event.preventDefault();
                clearRegion(editorImageData, selectionRect.x, selectionRect.y, selectionRect.w, selectionRect.h);
                clearSelection();
                pushEditorHistory();
                renderEditor();
            }
            if ((event.ctrlKey || event.metaKey) && !event.repeat) {
                const key = event.key.toLowerCase();
                if (key === "z") {
                    event.preventDefault();
                    if (event.shiftKey) {
                        restoreEditorHistory(editorHistoryIndex + 1);
                    } else {
                        restoreEditorHistory(editorHistoryIndex - 1);
                    }
                }
                if (key === "y") {
                    event.preventDefault();
                    restoreEditorHistory(editorHistoryIndex + 1);
                }
            }
            return;
        }

        if (isTextInputTarget(event.target)) return;

        if ((event.ctrlKey || event.metaKey) && !event.repeat) {
            const key = event.key.toLowerCase();
            if (key === "c") {
                event.preventDefault();
                void copySelectedCell(state);
                return;
            }
            if (key === "v") {
                event.preventDefault();
                void pasteIntoSelectedCell(state, dom, i18n, history);
                return;
            }
        }

        if (event.code === "Space" && !event.repeat) {
            state.isSpacePressed = true;
            if (state.isImageLoaded) dom.canvas.style.cursor = "grab";
        }

        if (!state.isImageLoaded || !state.selectedCell) return;

        if (event.key === "Delete") {
            event.preventDefault();
            if (!confirm(i18n.t("confirm.deleteCell"))) return;
            const targetIndex = getTargetIndex(state, state.selectedCell.r, state.selectedCell.c);
            deleteCellAtTarget(state, targetIndex);
            renderCanvas(state, dom, i18n);
            updateOverlay(state, dom);
            void history.capture(state, "history.deleteCell");
            return;
        }

        let dx = 0;
        let dy = 0;
        switch (event.key) {
            case "ArrowLeft":
                dx = -1;
                break;
            case "ArrowRight":
                dx = 1;
                break;
            case "ArrowUp":
                dy = -1;
                break;
            case "ArrowDown":
                dy = 1;
                break;
            default:
                return;
        }

        event.preventDefault();
        const { r, c } = state.selectedCell;
        const sourceIndex = getSourceIndex(state, r, c);
        const sourceCoords = getSourceCoords(state, sourceIndex);
        if (!sourceCoords) return;

        const cell = state.cellData[sourceCoords.r][sourceCoords.c];
        cell.x += dx;
        cell.y += dy;
        clampCellOffset(state, sourceCoords.r, sourceCoords.c);
        renderCanvas(state, dom, i18n);
        updateOverlay(state, dom);
        void history.capture(state, "history.move");
    });

    window.addEventListener("keyup", (event) => {
        if (editorOpen) {
            if (event.code === "Space") {
                editorSpacePressed = false;
            }
            return;
        }
        if (event.code === "Space") {
            state.isSpacePressed = false;
            if (state.isImageLoaded) dom.canvas.style.cursor = "default";
            state.isPanning = false;
        }
    });

    dom.canvas.addEventListener("mousedown", (event) => {
        if (editorOpen) return;
        if (!state.isImageLoaded) return;
        if (event.button === 2) return;
        const rect = dom.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        state.lastMousePos = { x: mouseX, y: mouseY };
        draggedCell = false;

        const overlayLayout = getOverlayLayout(state, dom);
        if (overlayLayout.visible) {
            const hit = overlayLayout.buttons.find(
                (button) =>
                    mouseX >= button.x &&
                    mouseX <= button.x + button.w &&
                    mouseY >= button.y &&
                    mouseY <= button.y + button.h
            );

            if (hit) {
                switch (hit.id) {
                    case "reorder": {
                        isReordering = true;
                        reorderSourceIndex = getTargetIndex(state, state.selectedCell!.r, state.selectedCell!.c);
                        state.isDraggingSprite = false;
                        state.isPanning = false;
                        dom.canvas.style.cursor = "grabbing";
                        state.reorderGhost.active = true;
                        state.reorderGhost.sourceIndex = getSourceIndex(
                            state,
                            state.selectedCell!.r,
                            state.selectedCell!.c
                        );
                        state.reorderGhost.screenX = mouseX;
                        state.reorderGhost.screenY = mouseY;
                        renderCanvas(state, dom, i18n);
                        return;
                    }
                    case "delete": {
                        if (!confirm(i18n.t("confirm.deleteCell"))) return;
                        const targetIndex = getTargetIndex(state, state.selectedCell!.r, state.selectedCell!.c);
                        deleteCellAtTarget(state, targetIndex);
                        renderCanvas(state, dom, i18n);
                        updateOverlay(state, dom);
                        void history.capture(state, "history.deleteCell");
                        return;
                    }
                    case "reset": {
                        resetSelectedCell(state, dom, i18n);
                        void history.capture(state, "history.resetCell");
                        return;
                    }
                    default: {
                        if (hit.id.startsWith("scale:")) {
                            const value = Number.parseFloat(hit.id.split(":")[1]);
                            if (Number.isFinite(value)) {
                                adjustScale(state, dom, i18n, value);
                                void history.capture(state, "history.scale");
                            }
                            return;
                        }
                    }
                }
            }
        }

        if (state.isSpacePressed || event.button === 1) {
            state.isPanning = true;
            dom.canvas.style.cursor = "grabbing";
            return;
        }

        const worldPos = screenToWorld(state, mouseX, mouseY);
        const c = Math.floor(worldPos.x / state.cellWidth);
        const r = Math.floor(worldPos.y / state.cellHeight);

        if (c >= 0 && c < state.numCols && r >= 0 && r < state.numRows) {
            state.selectedCell = { r, c };
            const hitSprite = isPointInSpriteBounds(state, r, c, worldPos);
            state.isDraggingSprite = hitSprite;
            state.dragTarget = hitSprite ? { r, c } : null;
            renderCanvas(state, dom, i18n);
            updateOverlay(state, dom);
        }
    });

    dom.canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        if (editorOpen || !state.isImageLoaded) return;
        const rect = dom.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const worldPos = screenToWorld(state, mouseX, mouseY);
        const c = Math.floor(worldPos.x / state.cellWidth);
        const r = Math.floor(worldPos.y / state.cellHeight);
        if (c < 0 || c >= state.numCols || r < 0 || r >= state.numRows) {
            closeCellMenu();
            return;
        }

        state.selectedCell = { r, c };
        renderCanvas(state, dom, i18n);
        updateOverlay(state, dom);
        dom.cellMenuCopy.disabled = !state.selectedCell;
        dom.cellMenuPaste.disabled = !navigator.clipboard || !navigator.clipboard.read;
        openCellMenu(event.clientX, event.clientY);
    });

    window.addEventListener("mousemove", (event) => {
        if (editorOpen) return;
        if (!state.isImageLoaded) return;
        const rect = dom.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const dx = mouseX - state.lastMousePos.x;
        const dy = mouseY - state.lastMousePos.y;
        state.lastMousePos = { x: mouseX, y: mouseY };

        if (isReordering) {
            state.reorderGhost.active = true;
            state.reorderGhost.screenX = mouseX;
            state.reorderGhost.screenY = mouseY;
            renderCanvas(state, dom, i18n);
            updateOverlay(state, dom);
            return;
        }

        if (state.isPanning) {
            state.viewPanX += dx;
            state.viewPanY += dy;
            renderCanvas(state, dom, i18n);
            return;
        }

        if (state.isDraggingSprite && state.dragTarget) {
            const { r, c } = state.dragTarget;
            const sourceIndex = getSourceIndex(state, r, c);
            const sourceCoords = getSourceCoords(state, sourceIndex);
            if (!sourceCoords) return;

            const cell = state.cellData[sourceCoords.r][sourceCoords.c];
            cell.x += dx / state.viewScale;
            cell.y += dy / state.viewScale;

            clampCellOffset(state, sourceCoords.r, sourceCoords.c);
            draggedCell = true;

            renderCanvas(state, dom, i18n);
            updateOverlay(state, dom);
        }
    });

    window.addEventListener("mouseup", (event) => {
        if (editorOpen) return;
        state.isPanning = false;
        state.isDraggingSprite = false;
        state.dragTarget = null;
        state.reorderGhost.active = false;

        if (draggedCell) {
            void history.capture(state, "history.move");
        }

        if (isReordering) {
            isReordering = false;
            const rect = dom.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const worldPos = screenToWorld(state, mouseX, mouseY);
            const targetCol = Math.floor(worldPos.x / state.cellWidth);
            const targetRow = Math.floor(worldPos.y / state.cellHeight);

            if (
                targetCol >= 0 &&
                targetCol < state.numCols &&
                targetRow >= 0 &&
                targetRow < state.numRows
            ) {
                const toIndex = getTargetIndex(state, targetRow, targetCol);
                reorderCell(state, reorderSourceIndex, toIndex);
                state.selectedCell = { r: targetRow, c: targetCol };
                renderCanvas(state, dom, i18n);
                updateOverlay(state, dom);
                void history.capture(state, "history.reorder");
            } else {
                renderCanvas(state, dom, i18n);
                updateOverlay(state, dom);
            }
        }

        dom.canvas.style.cursor = state.isSpacePressed ? "grab" : "default";

        if (state.isImageLoaded) updateOverlay(state, dom);
    });


    dom.openFileBtn.addEventListener("click", () => {
        void openFileWithFsAccess(state, dom, i18n, history);
    });

    dom.fileInput.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement | null;
        const file = target?.files?.[0];
        if (!file) return;

        void (async () => {
            const imageKey = await saveImageBlob(file);
            const fileIdentity = getFileIdentity(file);
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const img = new Image();
                img.onload = async () => {
                    state.currentImg = img;
                    state.isImageLoaded = true;
                    state.viewScale = 1.0;
                    state.fileHandle = null;
                    state.imageKey = imageKey;
                    state.fileIdentity = fileIdentity;
                    history.setContext(fileIdentity);

                    updateGridSettings(state, dom);
                    initGridData(state, false);
                    initCellOrder(state);
                    analyzeImage(state);
                    centerImage(state, dom);

                    state.selectedCell = null;
                    updateOverlay(state, dom);
                    renderCanvas(state, dom, i18n);

                    dom.resetBtn.disabled = false;
                    dom.downloadBtn.disabled = false;

                    await history.capture(state, "history.load");
                };

                const result = loadEvent.target?.result;
                if (typeof result === "string") {
                    img.src = result;
                }
            };

            reader.readAsDataURL(file);
        })();
    });

    dom.resetBtn.addEventListener("click", () => {
        if (confirm(i18n.t("confirm.resetAll"))) {
            initGridData(state, false);
            initCellOrder(state);
            renderCanvas(state, dom, i18n);
            updateOverlay(state, dom);
            void history.capture(state, "history.resetAll");
        }
    });

    dom.downloadBtn.addEventListener("click", () => {
        if (state.fileHandle && "showOpenFilePicker" in window) {
            void writeImageToHandle(state, dom);
        } else {
            exportImage(state, dom);
        }
    });

    dom.orderHistoryBtn.addEventListener("click", () => {
        history.toggleOrder();
    });

    dom.clearHistoryBtn.addEventListener("click", () => {
        if (!confirm(i18n.t("confirm.clearHistory"))) return;
        history.clear();
    });

    dom.undoBtn.addEventListener("click", () => {
        void history.undo(state);
    });

    dom.redoBtn.addEventListener("click", () => {
        void history.redo(state);
    });

}







