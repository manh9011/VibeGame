/**
 * Class that helps to manage mouse input.
 * Refactored to ES Module
 */

export const MouseInput = {
    X: 0,
    Y: 0,
    Pressed: [],

    Initialize: function (element) {
        var self = this;
        // Listen events on the specific element (usually canvas) if provided, otherwise document
        var target = element || document;

        target.onmousedown = function (event) { self.OnMouseDown(event); };
        target.onmouseup = function (event) { self.OnMouseUp(event); };
        target.onmousemove = function (event) { self.OnMouseMove(event); };
    },

    IsButtonDown: function (button) {
        if (this.Pressed[button] != null) {
            return this.Pressed[button];
        }
        return false;
    },

    OnMouseDown: function (event) {
        this.Pressed[event.button] = true;
    },

    OnMouseUp: function (event) {
        this.Pressed[event.button] = false;
    },

    OnMouseMove: function (event) {
        this.X = event.clientX;
        this.Y = event.clientY;
    }
};
