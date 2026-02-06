import { AppState, CellTransform } from "./state";
import { DomElements } from "./dom";
import { findTranslationKey, I18nApi } from "./i18n";
import { analyzeImage, initCellOrder } from "./grid";
import { renderCanvas, updateOverlay } from "./canvas";

interface HistorySnapshot {
    id: string;
    timestamp: number;
    label?: string;
    labelKey?: string;
    imageKey: string | null;
    numCols: number;
    numRows: number;
    isoGridSize: number;
    isoTileW: number;
    isoTileH: number;
    cellOrder: number[];
    cellData: CellTransform[][];
}

interface HistoryStore {
    currentIndex: number;
    entries: HistorySnapshot[];
}

const STORAGE_KEY = "sprite-aligner-history";
const ORDER_KEY = "sprite-aligner-history-order";
const DB_NAME = "sprite-aligner-db";
const DB_STORE = "images";
const MAX_ENTRIES = 100;
const HISTORY_KEYS = [
    "history.load",
    "history.move",
    "history.scale",
    "history.resetCell",
    "history.reorder",
    "history.deleteCell",
    "history.paste",
    "history.edit",
    "history.applyGrid",
    "history.resetAll",
];

function cloneCellData(cellData: CellTransform[][]): CellTransform[][] {
    return cellData.map((row) => row.map((cell) => ({ ...cell })));
}

function buildSnapshot(state: AppState, labelKey: string): HistorySnapshot {
    return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now(),
        labelKey,
        imageKey: state.imageKey,
        numCols: state.numCols,
        numRows: state.numRows,
        isoGridSize: state.isoGridSize,
        isoTileW: state.isoTileW,
        isoTileH: state.isoTileH,
        cellOrder: [...state.cellOrder],
        cellData: cloneCellData(state.cellData),
    };
}

function makeStorageKey(fileId: string): string {
    return `${STORAGE_KEY}:${fileId}`;
}

function makeOrderKey(fileId: string): string {
    return `${ORDER_KEY}:${fileId}`;
}

function loadStore(fileId: string): HistoryStore {
    const raw = localStorage.getItem(makeStorageKey(fileId));
    if (!raw) return { currentIndex: -1, entries: [] };
    try {
        const parsed = JSON.parse(raw) as HistoryStore;
        if (!parsed || !Array.isArray(parsed.entries)) return { currentIndex: -1, entries: [] };
        parsed.entries.forEach((entry) => {
            if (!entry.labelKey && entry.label) {
                const key = findTranslationKey(entry.label, HISTORY_KEYS);
                if (key) entry.labelKey = key;
            }
        });
        return parsed;
    } catch {
        return { currentIndex: -1, entries: [] };
    }
}

function saveStore(fileId: string, store: HistoryStore): void {
    localStorage.setItem(makeStorageKey(fileId), JSON.stringify(store));
}

type HistoryOrder = "desc" | "asc";

function loadOrder(fileId: string): HistoryOrder {
    const raw = localStorage.getItem(makeOrderKey(fileId));
    return raw === "asc" ? "asc" : "desc";
}

function saveOrder(fileId: string, order: HistoryOrder): void {
    localStorage.setItem(makeOrderKey(fileId), order);
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function saveImageBlob(blob: Blob): Promise<string> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const key = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).put(blob, key);
        tx.oncomplete = () => resolve(key);
        tx.onerror = () => reject(tx.error);
    });
}

async function loadImageBlob(key: string): Promise<Blob | null> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, "readonly");
        const request = tx.objectStore(DB_STORE).get(key);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
    });
}

async function loadImageFromKey(key: string): Promise<HTMLImageElement | null> {
    const blob = await loadImageBlob(key);
    if (!blob) return null;
    const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });
}

function applySnapshot(state: AppState, dom: DomElements, snapshot: HistorySnapshot): void {
    state.numCols = snapshot.numCols;
    state.numRows = snapshot.numRows;
    state.isoGridSize = snapshot.isoGridSize;
    state.isoTileW = snapshot.isoTileW;
    state.isoTileH = snapshot.isoTileH;
    state.cellOrder = [...snapshot.cellOrder];
    state.cellData = cloneCellData(snapshot.cellData);
    if (state.totalWidth > 0 && state.totalHeight > 0) {
        state.cellWidth = state.totalWidth / snapshot.numCols;
        state.cellHeight = state.totalHeight / snapshot.numRows;
    }

    dom.inpCols.value = String(snapshot.numCols);
    dom.inpRows.value = String(snapshot.numRows);
    dom.inpIsoGridSize.value = String(snapshot.isoGridSize);
    dom.inpIsoTileW.value = String(snapshot.isoTileW);
    dom.inpIsoTileH.value = String(snapshot.isoTileH);
}

function formatEntry(entry: HistorySnapshot, index: number, i18n: I18nApi): string {
    const date = new Date(entry.timestamp);
    const locale = i18n.getLocale();
    const time = new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(date);
    const label = entry.labelKey ? i18n.t(entry.labelKey) : entry.label ?? "";
    return `#${index + 1} ${time} · ${label}`;
}

export function createHistoryManager(dom: DomElements, i18n: I18nApi) {
    let store: HistoryStore = { currentIndex: -1, entries: [] };
    let order: HistoryOrder = "desc";
    let currentFileId: string | null = null;

    function updateOrderButton(): void {
        const titleKey = order === "desc" ? "buttons.orderHistoryNewest" : "buttons.orderHistoryOldest";
        const title = i18n.t(titleKey);
        dom.orderHistoryBtn.title = title;
        dom.orderHistoryBtn.setAttribute("aria-label", title);
    }

    function getOrderedIndices(): number[] {
        const indices = store.entries.map((_, index) => index);
        if (order === "desc") {
            indices.reverse();
        }
        return indices;
    }

    function refreshList(): void {
        dom.historyList.innerHTML = "";
        updateOrderButton();
        if (store.entries.length === 0) {
            const empty = document.createElement("div");
            empty.className = "history-empty";
            empty.textContent = i18n.t("history.empty");
            dom.historyList.appendChild(empty);
            return;
        }

        const ordered = getOrderedIndices();
        ordered.forEach((entryIndex, displayIndex) => {
            const entry = store.entries[entryIndex];
            const item = document.createElement("button");
            item.type = "button";
            item.className = "history-item";
            if (entryIndex === store.currentIndex) {
                item.classList.add("is-active");
            }
            item.textContent = formatEntry(entry, displayIndex, i18n);
            item.addEventListener("click", () => {
                void applyHistory(entryIndex, dom.__historyState as AppState);
            });
            dom.historyList.appendChild(item);
        });
    }

    async function applyHistory(index: number, state: AppState): Promise<void> {
        if (!currentFileId) return;
        const entry = store.entries[index];
        if (!entry) return;

        if (entry.imageKey) {
            if (state.imageKey !== entry.imageKey) {
                const img = await loadImageFromKey(entry.imageKey);
                if (!img) return;
                state.currentImg = img;
                state.isImageLoaded = true;
                state.imageKey = entry.imageKey;
                state.fileHandle = null;
                state.totalWidth = img.width;
                state.totalHeight = img.height;
                state.cellWidth = state.totalWidth / entry.numCols;
                state.cellHeight = state.totalHeight / entry.numRows;
            }
        }

        applySnapshot(state, dom, entry);
        analyzeImage(state);
        renderCanvas(state, dom, i18n);
        updateOverlay(state, dom);
        store.currentIndex = index;
        saveStore(currentFileId, store);
        refreshList();
    }

    async function capture(state: AppState, labelKey: string): Promise<void> {
        if (!currentFileId) return;
        const snapshot = buildSnapshot(state, labelKey);

        if (store.currentIndex < store.entries.length - 1) {
            store.entries = store.entries.slice(0, store.currentIndex + 1);
        }

        store.entries.push(snapshot);
        if (store.entries.length > MAX_ENTRIES) {
            store.entries.shift();
        }
        store.currentIndex = store.entries.length - 1;
        saveStore(currentFileId, store);
        refreshList();
    }

    async function undo(state: AppState): Promise<void> {
        if (!currentFileId) return;
        if (store.currentIndex <= 0) return;
        await applyHistory(store.currentIndex - 1, state);
    }

    async function redo(state: AppState): Promise<void> {
        if (!currentFileId) return;
        if (store.currentIndex >= store.entries.length - 1) return;
        await applyHistory(store.currentIndex + 1, state);
    }

    function clear(): void {
        if (!currentFileId) return;
        store.entries = [];
        store.currentIndex = -1;
        saveStore(currentFileId, store);
        refreshList();
    }

    function ensureOrder(state: AppState): void {
        if (!state.cellOrder || state.cellOrder.length === 0) {
            initCellOrder(state);
        }
    }

    function setContext(fileId: string | null): void {
        currentFileId = fileId;
        if (!fileId) {
            store = { currentIndex: -1, entries: [] };
            order = "desc";
            refreshList();
            return;
        }
        store = loadStore(fileId);
        order = loadOrder(fileId);
        refreshList();
    }

    (dom as DomElements & { __historyState?: AppState }).__historyState = undefined;
    setContext(null);

    return {
        capture,
        undo,
        redo,
        clear,
        toggleOrder() {
            order = order === "desc" ? "asc" : "desc";
            if (currentFileId) {
                saveOrder(currentFileId, order);
            }
            refreshList();
        },
        ensureOrder,
        refreshList,
        setContext,
        bindState(state: AppState) {
            (dom as DomElements & { __historyState?: AppState }).__historyState = state;
        },
    };
}

export type HistoryManager = ReturnType<typeof createHistoryManager>;
