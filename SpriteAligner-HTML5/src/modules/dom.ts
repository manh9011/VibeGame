export interface DomElements {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    wrapper: HTMLElement;
    overlayControls: HTMLElement;
    lblScale: HTMLElement;

    fileInput: HTMLInputElement;
    openFileBtn: HTMLButtonElement;
    inpCols: HTMLInputElement;
    inpRows: HTMLInputElement;
    resetBtn: HTMLButtonElement;
    downloadBtn: HTMLButtonElement;

    inpIsoGridSize: HTMLInputElement;
    inpIsoTileW: HTMLInputElement;
    inpIsoTileH: HTMLInputElement;

    selAnchorMode: HTMLSelectElement;
    inpAnchorX: HTMLInputElement;
    inpAnchorY: HTMLInputElement;

    chkPixelMode: HTMLInputElement;
    chkShowShortcuts: HTMLInputElement;
    languageSelect: HTMLSelectElement;
    historyList: HTMLDivElement;
    undoBtn: HTMLButtonElement;
    redoBtn: HTMLButtonElement;
    orderHistoryBtn: HTMLButtonElement;
    clearHistoryBtn: HTMLButtonElement;

    scaleButtons: HTMLButtonElement[];
    resetCellBtn: HTMLButtonElement;
    deleteCellBtn: HTMLButtonElement;
    reorderHandleBtn: HTMLButtonElement;

    cellMenu: HTMLElement;
    cellMenuEdit: HTMLButtonElement;
    cellMenuCopy: HTMLButtonElement;
    cellMenuPaste: HTMLButtonElement;

    cellEditor: HTMLElement;
    editorCanvas: HTMLCanvasElement;
    editorCanvasWrap: HTMLElement;
    editorCursor: HTMLElement;
    editorBody: HTMLElement;
    editorPalette: HTMLElement;
    editorPaletteModes: HTMLButtonElement[];
    editorPatternButtons: HTMLButtonElement[];
    editorShapeButtons: HTMLButtonElement[];
    editorToolButtons: HTMLButtonElement[];
    editorColor: HTMLInputElement;
    editorColorRight: HTMLInputElement;
    editorSizeGroup: HTMLElement;
    editorSizeButtons: HTMLButtonElement[];
    editorDeleteSelectionBtn: HTMLButtonElement;
    editorUndoBtn: HTMLButtonElement;
    editorRedoBtn: HTMLButtonElement;
    editorSaveBtn: HTMLButtonElement;
    editorCancelBtn: HTMLButtonElement;
    editorMaximizeBtn: HTMLButtonElement;
    editorCloseBtn: HTMLButtonElement;
}

function requireElement<T extends HTMLElement>(id: string, type: { new (): T }): T {
    const el = document.getElementById(id);
    if (!el) {
        throw new Error(`Missing element: ${id}`);
    }
    if (!(el instanceof type)) {
        throw new Error(`Unexpected element type for: ${id}`);
    }
    return el;
}

export function getDomElements(): DomElements {
    const canvas = requireElement("mainCanvas", HTMLCanvasElement);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Unable to create 2D context.");
    }

    return {
        canvas,
        ctx,
        wrapper: requireElement("canvasWrapper", HTMLElement),
        overlayControls: requireElement("overlayControls", HTMLElement),
        lblScale: requireElement("lblScale", HTMLElement),

        fileInput: requireElement("fileInput", HTMLInputElement),
        openFileBtn: requireElement("openFileBtn", HTMLButtonElement),
        inpCols: requireElement("inpCols", HTMLInputElement),
        inpRows: requireElement("inpRows", HTMLInputElement),
        resetBtn: requireElement("resetBtn", HTMLButtonElement),
        downloadBtn: requireElement("downloadBtn", HTMLButtonElement),

        inpIsoGridSize: requireElement("inpIsoGridSize", HTMLInputElement),
        inpIsoTileW: requireElement("inpIsoTileW", HTMLInputElement),
        inpIsoTileH: requireElement("inpIsoTileH", HTMLInputElement),

        selAnchorMode: requireElement("selAnchorMode", HTMLSelectElement),
        inpAnchorX: requireElement("inpAnchorX", HTMLInputElement),
        inpAnchorY: requireElement("inpAnchorY", HTMLInputElement),

        chkPixelMode: requireElement("chkPixelMode", HTMLInputElement),
        chkShowShortcuts: requireElement("chkShowShortcuts", HTMLInputElement),
        languageSelect: requireElement("languageSelect", HTMLSelectElement),
        historyList: requireElement("historyList", HTMLDivElement),
        undoBtn: requireElement("undoBtn", HTMLButtonElement),
        redoBtn: requireElement("redoBtn", HTMLButtonElement),
        orderHistoryBtn: requireElement("orderHistoryBtn", HTMLButtonElement),
        clearHistoryBtn: requireElement("clearHistoryBtn", HTMLButtonElement),

        scaleButtons: Array.from(document.querySelectorAll<HTMLButtonElement>(".scale-btn[data-scale]")),
        resetCellBtn: requireElement("resetCellBtn", HTMLButtonElement),
        deleteCellBtn: requireElement("deleteCellBtn", HTMLButtonElement),
        reorderHandleBtn: requireElement("reorderHandleBtn", HTMLButtonElement),

        cellMenu: requireElement("cellMenu", HTMLElement),
        cellMenuEdit: requireElement("cellMenu", HTMLElement).querySelector<HTMLButtonElement>("[data-action=\"edit\"]")!,
        cellMenuCopy: requireElement("cellMenu", HTMLElement).querySelector<HTMLButtonElement>("[data-action=\"copy\"]")!,
        cellMenuPaste: requireElement("cellMenu", HTMLElement).querySelector<HTMLButtonElement>("[data-action=\"paste\"]")!,

        cellEditor: requireElement("cellEditor", HTMLElement),
        editorCanvas: requireElement("editorCanvas", HTMLCanvasElement),
        editorCanvasWrap: requireElement("editorCanvasWrap", HTMLElement),
        editorCursor: requireElement("editorCursor", HTMLElement),
        editorBody: requireElement("editorBody", HTMLElement),
        editorPalette: requireElement("editorPalette", HTMLElement),
        editorPaletteModes: Array.from(document.querySelectorAll<HTMLButtonElement>(".editor-palette-mode-btn")),
        editorPatternButtons: Array.from(document.querySelectorAll<HTMLButtonElement>(".editor-pattern-btn")),
        editorShapeButtons: Array.from(document.querySelectorAll<HTMLButtonElement>(".editor-shape-btn")),
        editorToolButtons: Array.from(document.querySelectorAll<HTMLButtonElement>(".editor-tool-btn")),
        editorColor: requireElement("editorColor", HTMLInputElement),
        editorColorRight: requireElement("editorColorRight", HTMLInputElement),
        editorSizeGroup: requireElement("editorSizeGroup", HTMLElement),
        editorSizeButtons: Array.from(document.querySelectorAll<HTMLButtonElement>(".editor-size-btn")),
        editorDeleteSelectionBtn: requireElement("editorDeleteSelectionBtn", HTMLButtonElement),
        editorUndoBtn: requireElement("editorUndoBtn", HTMLButtonElement),
        editorRedoBtn: requireElement("editorRedoBtn", HTMLButtonElement),
        editorSaveBtn: requireElement("editorSaveBtn", HTMLButtonElement),
        editorCancelBtn: requireElement("editorCancelBtn", HTMLButtonElement),
        editorMaximizeBtn: requireElement("editorMaximizeBtn", HTMLButtonElement),
        editorCloseBtn: requireElement("editorCloseBtn", HTMLButtonElement),
    };
}
