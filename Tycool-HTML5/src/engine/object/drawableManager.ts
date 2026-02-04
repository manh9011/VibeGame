import { Renderer } from '@/engine/renderer/renderer';
import { Camera } from '@/engine/scene/camera';

/**
 * Interface for objects that can be drawn and updated by the DrawableManager.
 */
export interface IDrawable {
    ZOrder: number;
    Draw(renderer: Renderer, camera: Camera): void;
    Update?(delta: number): void;
    UpdateNoMove?(delta: number): void;
    CollideCheck?(): void;
    BumpCheck?(x: number, y: number): void;
    Layer?: number;
}

/**
 * Manages a list of drawable objects, handling their updates and rendering.
 */
export class DrawableManager {
    Unsorted: boolean;
    Objects: IDrawable[];

    constructor() {
        this.Unsorted = true;
        this.Objects = [];
    }

    /**
     * Adds an object to the manager.
     * @param object The object to add.
     */
    Add(object: IDrawable): void {
        this.Objects.push(object);
        this.Unsorted = true;
    }

    /**
     * Adds a list of objects to the manager.
     * @param objects The list of objects to add.
     */
    AddRange(objects: IDrawable[]): void {
        this.Objects = this.Objects.concat(objects);
        this.Unsorted = true;
    }

    /**
     * Removes all objects from the manager.
     */
    Clear(): void {
        this.Objects.splice(0, this.Objects.length);
    }

    /**
     * Checks if the manager contains a specific object.
     * @param obj The object to check.
     */
    Contains(obj: IDrawable): boolean {
        var i = this.Objects.length;
        while (i--) {
            if (this.Objects[i] === obj) {
                return true;
            }
        }
        return false;
    }

    /**
     * Removes a specific object from the manager.
     * @param object The object to remove.
     */
    Remove(object: IDrawable): void {
        var index = this.Objects.indexOf(object);
        this.Objects.splice(index, 1);
    }

    /**
     * Removes an object at a specific index.
     * @param index The index of the object to remove.
     */
    RemoveAt(index: number): void {
        this.Objects.splice(index, 1);
    }

    /**
     * Removes a range of objects.
     * @param index Starting index.
     * @param length Number of items to remove.
     */
    RemoveRange(index: number, length: number): void {
        this.Objects.splice(index, length);
    }

    /**
     * Removes a list of specific objects.
     * @param items The list of objects to remove.
     */
    RemoveList(items: IDrawable[]): void {
        var i = 0, j = 0;
        for (j = 0; j < items.length; j++) {
            for (i = 0; i < this.Objects.length; i++) {
                if (this.Objects[i] === items[j]) {
                    this.Objects.splice(i, 1);
                    break;
                }
            }
        }
    }

    /**
     * Updates all objects in the manager.
     * @param delta Time elapsed since last update.
     */
    Update(delta: number): void {
        var i = 0;
        for (i = 0; i < this.Objects.length; i++) {
            if (this.Objects[i].Update) {
                this.Objects[i].Update!(delta);
            }
        }
    }

    /**
     * Draws all objects in the manager.
     * @param renderer The renderer instance.
     * @param camera The game camera.
     */
    Draw(renderer: Renderer, camera: Camera): void {
        //sort the sprites based on their 'z depth' to get the correct drawing order
        if (this.Unsorted) {
            this.Unsorted = false;
            this.Objects.sort(function (x1, x2) {
                if (x1.Layer !== undefined && x2.Layer !== undefined && x1.Layer !== x2.Layer) {
                    return x1.Layer - x2.Layer;
                }
                return x1.ZOrder - x2.ZOrder;
            });
        }

        var i = 0;
        for (i = 0; i < this.Objects.length; i++) {
            if (this.Objects[i].Draw) {
                this.Objects[i].Draw(renderer, camera);
            }
        }
    }
}
