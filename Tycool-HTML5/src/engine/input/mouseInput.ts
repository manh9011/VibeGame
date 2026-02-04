/**
 * Static object handling mouse input scene.
 */
export const MouseInput = {
    X: 0,
    Y: 0,
    DeltaX: 0,
    DeltaY: 0,
    WheelDelta: 0,
    Pressed: [] as boolean[],

    /**
     * Initializes mouse event listeners on the specified element.
     * @param element The HTML element to listen for mouse events on.
     */
    Initialize: function (element: HTMLElement): void {
        var self = this;
        // Listen events on the specific element (usually canvas) if provided, otherwise document
        var target = element || document;

        target.onmousedown = function (event) { self.OnMouseDown(event as MouseEvent); };
        target.onmouseup = function (event) { self.OnMouseUp(event as MouseEvent); };
        target.onmousemove = function (event) { self.OnMouseMove(event as MouseEvent); };
        target.onwheel = function (event) { self.OnWheel(event as WheelEvent); };
    },

    /**
     * Checks if a specific mouse button is down.
     * @param button Button code to check.
     */
    IsButtonDown: function (button: number): boolean {
        if (this.Pressed[button] != null) {
            return this.Pressed[button];
        }
        return false;
    },

    OnMouseDown: function (event: MouseEvent): void {
        this.Pressed[event.button] = true;
    },

    OnMouseUp: function (event: MouseEvent): void {
        this.Pressed[event.button] = false;
    },

    OnMouseMove: function (event: MouseEvent): void {
        this.DeltaX += event.clientX - this.X;
        this.DeltaY += event.clientY - this.Y;
        this.X = event.clientX;
        this.Y = event.clientY;
    },

    OnWheel: function (event: WheelEvent): void {
        event.preventDefault();
        this.WheelDelta += event.deltaY;
    },

    /**
     * Resets per-frame deltas. Call at end of Update.
     */
    Reset: function (): void {
        this.DeltaX = 0;
        this.DeltaY = 0;
        this.WheelDelta = 0;
    }
};
