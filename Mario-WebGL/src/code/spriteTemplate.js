/**
 * Creates a specific type of sprite based on the information given.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

import { Enemy } from './enemy.js';
import { FlowerEnemy } from './flowerEnemy.js';

export class SpriteTemplate {
    constructor(type, winged) {
        this.Type = type;
        this.Winged = winged;
        this.LastVisibleTick = -1;
        this.IsDead = false;
        this.Sprite = null;
    }

    Spawn(world, x, y, dir) {
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
