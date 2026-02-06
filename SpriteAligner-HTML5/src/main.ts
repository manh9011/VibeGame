import "./styles/index.css";
import { createInitialState } from "./modules/state";
import { getDomElements } from "./modules/dom";
import { createI18n } from "./modules/i18n";
import { bindEvents } from "./modules/events";
import { initCanvasSize, renderCanvas, updateOverlay } from "./modules/canvas";
import { createHistoryManager } from "./modules/history";

const state = createInitialState();
const dom = getDomElements();
const i18n = createI18n();
const history = createHistoryManager(dom, i18n);
history.bindState(state);

i18n.setLanguageSelect(dom.languageSelect, () => {
    history.refreshList();
    renderCanvas(state, dom, i18n);
    updateOverlay(state, dom);
});

i18n.applyTranslations();
initCanvasSize(state, dom, i18n);

bindEvents(state, dom, i18n, history);
