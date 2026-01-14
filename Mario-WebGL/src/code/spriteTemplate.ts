/**
 * Creates a specific type of sprite based on the information given.
 */

import { Enemy } from './enemy';
import { FlowerEnemy } from './flowerEnemy';
import type { NotchSprite } from './notchSprite';
import type { LevelState } from './levelState';

/**
 * Template used to spawn sprites (enemies) in the level.
 */
export class SpriteTemplate {
    /** Enemy type ID. */
    Type: number;
    /** Whether the enemy has wings. */
    Winged: boolean;
    /** The last tick this sprite was processed (visible). */
    LastVisibleTick: number;
    /** Whether the spawned sprite is dead. */
    IsDead: boolean;
    /** Reference to the active sprite instance. */
    Sprite: NotchSprite | null;

    constructor(type: number, winged: boolean) {
        this.Type = type;
        this.Winged = winged;
        this.LastVisibleTick = -1;
        this.IsDead = false;
        this.Sprite = null;
    }

    /**
     * Spawns a sprite instance based on this template into the world.
     */
    Spawn(world: LevelState, x: number, y: number, dir: number): void {
        if (this.IsDead) {
            return;
        }

        if (this.Type === Enemy.Flower) {
            this.Sprite = new FlowerEnemy(world, x * 16 + 15, y * 16 + 24);
        } else {
            this.Sprite = new Enemy(world, x * 16 + 8, y * 16 + 15, dir, this.Type, this.Winged);
        }
        this.Sprite.SpriteTemplate = this;
        world.AddSprite(this.Sprite);
    }
}
