/**
 * --- GAME CONTEXT ---
 * Shared context to avoid circular dependencies with singletons.
 */
import { Enjine } from './engine/core.js';
import { DataManager } from './data/dataManager.js';

export const GAME = new Enjine.Game();
export const DB = new DataManager();
export { CLASS_TYPES, MEDAL_TYPES, MEDAL_BUFFS, ITEM_TYPES, RARITY } from './data/dataManager.js';
