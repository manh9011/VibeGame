/**
 * Mapping of key names to key codes.
 */
export const Keys = {
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90, // Typo in original was 80 (P), correcting to 90
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40
};

/**
 * Static object handling keyboard input scene.
 */
export const KeyboardInput = {
    Pressed: [] as boolean[],

    /**
     * Initializes keyboard event listeners.
     */
    Initialize: function (): void {
        var self = this;
        document.onkeydown = function (event) { self.KeyDownEvent(event); }
        document.onkeyup = function (event) { self.KeyUpEvent(event); }
    },

    /**
     * Checks if a specific key is currently held down.
     * @param key Key code to check.
     */
    IsKeyDown: function (key: number): boolean {
        if (this.Pressed[key] != null)
            return this.Pressed[key];
        return false;
    },

    KeyDownEvent: function (event: KeyboardEvent): void {
        this.Pressed[event.keyCode] = true;
        this.PreventScrolling(event);
    },

    KeyUpEvent: function (event: KeyboardEvent): void {
        this.Pressed[event.keyCode] = false;
        this.PreventScrolling(event);
    },

    PreventScrolling: function (event: KeyboardEvent): void {
        // 37: left, 38: up, 39: right, 40: down
        if (event.keyCode >= 37 && event.keyCode <= 40) {
            event.preventDefault();
        }
    }
};
