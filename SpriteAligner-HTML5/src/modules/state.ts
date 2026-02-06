export interface Point {
    x: number;
    y: number;
}

export interface CellTransform {
    x: number;
    y: number;
    scale: number;
}

export interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    w: number;
    h: number;
    isEmpty: boolean;
}

export interface CellIndex {
    r: number;
    c: number;
}

export type AnchorMode = "ratio" | "pixel";

export interface AppState {
    currentImg: HTMLImageElement | null;
    isImageLoaded: boolean;
    fileHandle: FileSystemFileHandle | null;
    imageKey: string | null;
    fileIdentity: string | null;

    numCols: number;
    numRows: number;
    cellWidth: number;
    cellHeight: number;
    totalWidth: number;
    totalHeight: number;

    isoGridSize: number;
    isoTileW: number;
    isoTileH: number;

    anchorMode: AnchorMode;
    anchorX: number;
    anchorY: number;

    viewScale: number;
    viewPanX: number;
    viewPanY: number;
    isPanning: boolean;
    isSpacePressed: boolean;

    isDraggingSprite: boolean;
    selectedCell: CellIndex | null;
    dragTarget: CellIndex | null;
    lastMousePos: Point;

    cellData: CellTransform[][];
    boundingBoxes: BoundingBox[][];
    cellOrder: number[];
    reorderGhost: {
        active: boolean;
        sourceIndex: number;
        screenX: number;
        screenY: number;
    };
}

export function createInitialState(): AppState {
    return {
        currentImg: null,
        isImageLoaded: false,
        fileHandle: null,
        imageKey: null,
        fileIdentity: null,

        numCols: 6,
        numRows: 6,
        cellWidth: 0,
        cellHeight: 0,
        totalWidth: 0,
        totalHeight: 0,

        isoGridSize: 6,
        isoTileW: 64,
        isoTileH: 32,

        anchorMode: "ratio",
        anchorX: 0.5,
        anchorY: 0.75,

        viewScale: 1.0,
        viewPanX: 0,
        viewPanY: 0,
        isPanning: false,
        isSpacePressed: false,

        isDraggingSprite: false,
        selectedCell: null,
        dragTarget: null,
        lastMousePos: { x: 0, y: 0 },

        cellData: [],
        boundingBoxes: [],
        cellOrder: [],
        reorderGhost: {
            active: false,
            sourceIndex: -1,
            screenX: 0,
            screenY: 0,
        },
    };
}
