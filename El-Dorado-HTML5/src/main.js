/**
 * --- MAIN ENTRY POINT ---
 */
import { GAME, DB } from './context.js';
import { BackgroundSystem } from './engine/background.js';
import { MainMenuState } from './scenes/MainMenuState.js';

window.onload = function () {
    BackgroundSystem.Initialize(); // Initialize background too (was in index.html script earlier but implicit in global scope)
    GAME.Initialize();
    GAME.ChangeState(MainMenuState);
};
