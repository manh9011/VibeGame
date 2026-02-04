/**
 * Interface defining properties for objects involved in collision detection.
 */
export interface CollisionObject {
    X: number;
    Y: number;
    Width: number;
    Height: number;
    CollisionEvent?: (other: CollisionObject) => void;
}

/**
 * Wrapper class for objects to handle collision detection.
 */
export class Collideable implements CollisionObject {
    Base: CollisionObject;
    X: number;
    Y: number;
    Width: number;
    Height: number;
    CollisionEvent: (other: CollisionObject) => void;

    constructor(obj: CollisionObject, width: number, height: number, collisionEvent?: (other: CollisionObject) => void) {
        this.Base = obj;
        this.X = obj.X;
        this.Y = obj.Y;
        this.Width = width;
        this.Height = height;

        if (collisionEvent) {
            this.CollisionEvent = collisionEvent;
        } else {
            this.CollisionEvent = function () { }
        }
    }

    /**
     * Updates the position of the collideable based on the base object.
     */
    Update(): void {
        this.X = this.Base.X;
        this.Y = this.Base.Y;
    }

    /**
     * Checks for collision with another collideable object.
     * @param other The other object to check collision against.
     */
    CheckCollision(other: Collideable): void {
        var left1 = this.X, left2 = other.X;
        var right1 = (this.X + this.Width), right2 = (other.X + other.Width);
        var top1 = this.Y, top2 = other.Y;
        var bottom1 = (this.Y + this.Height), bottom2 = other.Y + other.Height;

        if (bottom1 < top2) {
            return;
        }
        if (top1 > bottom2) {
            return;
        }
        if (right1 < left2) {
            return;
        }
        if (left1 > right2) {
            return;
        }

        //collision, fire the events!
        this.CollisionEvent(other);

        // Using check for other.CollisionEvent assuming other is Collideable or compatible
        if (other.CollisionEvent) {
            other.CollisionEvent(this);
        }
    }
}
