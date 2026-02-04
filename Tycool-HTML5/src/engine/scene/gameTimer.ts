/**
 * Interface for objects that receive time updates.
 */
export interface Updateable {
    Update(delta: number): void;
}

/**
 * Timer class to manage the game loop interval.
 */
export class GameTimer {
    FramesPerSecond: number;
    LastTime: number;
    IntervalFunc: ReturnType<typeof setInterval> | null;
    UpdateObject: Updateable | null;

    constructor() {
        this.FramesPerSecond = 1000 / 30;
        this.LastTime = 0;
        this.IntervalFunc = null;
        this.UpdateObject = null;
    }

    /**
     * Starts the game timer.
     */
    Start(): void {
        this.LastTime = new Date().getTime();
        var self = this;
        this.IntervalFunc = setInterval(function () { self.Tick() }, this.FramesPerSecond);
    }

    /**
     * Called on every tick of the timer. Calculates delta time and updates the object.
     */
    Tick(): void {
        if (this.UpdateObject != null) {
            var newTime = new Date().getTime();
            var delta = (newTime - this.LastTime) / 1000;
            this.LastTime = newTime;

            this.UpdateObject.Update(delta);
        }
    }

    /**
     * Stops the game timer.
     */
    Stop(): void {
        if (this.IntervalFunc) {
            clearInterval(this.IntervalFunc);
        }
    }
}
