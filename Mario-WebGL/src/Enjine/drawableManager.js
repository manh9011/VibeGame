/**
 * Class to help manage and draw a collection of sprites.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

export class DrawableManager {
    constructor() {
        this.Unsorted = true;
        this.Objects = [];
    }

    Add(object) {
        this.Objects.push(object);
        this.Unsorted = true;
    }

    AddRange(objects) {
        this.Objects = this.Objects.concat(objects);
        this.Unsorted = true;
    }

    Clear() {
        for (var i = 0; i < this.Objects.length; i++) {
            if (this.Objects[i].OnRemove) {
                this.Objects[i].OnRemove();
            }
        }
        this.Objects.length = 0;
    }

    Contains(obj) {
        var i = this.Objects.length;
        while (i--) {
            if (this.Objects[i] === obj) {
                return true;
            }
        }
        return false;
    }

    Remove(object) {
        var index = this.Objects.indexOf(object);
        if (index !== -1) {
            this.Objects.splice(index, 1);
            if (object.OnRemove) {
                object.OnRemove();
            }
        }
    }

    RemoveAt(index) {
        var object = this.Objects[index];
        this.Objects.splice(index, 1);
        if (object && object.OnRemove) {
            object.OnRemove();
        }
    }

    RemoveRange(index, length) {
        var removed = this.Objects.splice(index, length);
        for (var i = 0; i < removed.length; i++) {
            if (removed[i].OnRemove) {
                removed[i].OnRemove();
            }
        }
    }

    RemoveList(items) {
        var i = 0, j = 0;
        for (j = 0; j < items.length; j++) {
            for (i = 0; i < this.Objects.length; i++) {
                if (this.Objects[i] === items[j]) {
                    this.Objects.splice(i, 1);
                    if (items[j].OnRemove) {
                        items[j].OnRemove();
                    }
                    items.splice(j, 1);
                    j--;
                    break;
                }
            }
        }
    }

    Update(delta) {
        var i = 0;
        for (i = 0; i < this.Objects.length; i++) {
            if (this.Objects[i].Update) {
                this.Objects[i].Update(delta);
            }
        }
    }

    Draw(context, camera) {

        //sort the sprites based on their 'z depth' to get the correct drawing order
        if (this.Unsorted) {
            this.Unsorted = false;
            this.Objects.sort(function (x1, x2) { return x1.ZOrder - x2.ZOrder; });
        }

        var i = 0;
        for (i = 0; i < this.Objects.length; i++) {
            if (this.Objects[i].Draw) {
                this.Objects[i].Draw(context, camera);
            }
        }
    }
}
