/**
 * --- ENJINE CORE SIMULATION ---
 */
import { BackgroundSystem } from './background.js';

export var Enjine = {
    GameCanvas: function () {
        this.Canvas = document.getElementById("gameCanvas");
        this.Context = this.Canvas.getContext("2d");
        this.Width = window.innerWidth;
        this.Height = window.innerHeight;
        this.Canvas.width = this.Width;
        this.Canvas.height = this.Height;

        var self = this;
        window.onresize = function () {
            self.Width = window.innerWidth;
            self.Height = window.innerHeight;
            self.Canvas.width = self.Width;
            self.Canvas.height = self.Height;
        };
    },

    Keys: { A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90, Left: 37, Up: 38, Right: 39, Down: 40 },

    Keyboard: {
        Pressed: {},
        Initialize: function () {
            document.onkeydown = function (event) { Enjine.Keyboard.Pressed[event.keyCode] = true; };
            document.onkeyup = function (event) { delete Enjine.Keyboard.Pressed[event.keyCode]; };
        },
        IsKeyDown: function (key) { return this.Pressed[key]; }
    },

    Mouse: {
        X: 0, Y: 0, Down: false, Clicked: false,
        Initialize: function (canvas) {
            canvas.onmousedown = function (e) { Enjine.Mouse.Down = true; Enjine.Mouse.Clicked = true; Enjine.Mouse.UpdatePos(e, canvas); };
            canvas.onmouseup = function (e) { Enjine.Mouse.Down = false; Enjine.Mouse.UpdatePos(e, canvas); };
            canvas.onmousemove = function (e) { Enjine.Mouse.UpdatePos(e, canvas); };
            canvas.ontouchstart = function (e) { e.preventDefault(); Enjine.Mouse.Down = true; Enjine.Mouse.Clicked = true; Enjine.Mouse.UpdatePos(e.touches[0], canvas); };
            canvas.ontouchend = function (e) { e.preventDefault(); Enjine.Mouse.Down = false; };
            canvas.ontouchmove = function (e) { e.preventDefault(); Enjine.Mouse.UpdatePos(e.touches[0], canvas); };
        },
        UpdatePos: function (e, canvas) {
            var rect = canvas.getBoundingClientRect();
            Enjine.Mouse.X = e.clientX - rect.left;
            Enjine.Mouse.Y = e.clientY - rect.top;
        }
    },

    GameState: function () {
        this.Enter = function () { };
        this.Exit = function () { };
        this.Update = function (delta) { };
        this.Draw = function (context) { };
    },

    Game: function () {
        this.CurrentState = null;
        this.Canvas = null;
        this.Timer = { Last: 0, Now: 0, Delta: 0 };

        this.Initialize = function () {
            this.Canvas = new Enjine.GameCanvas();
            Enjine.Keyboard.Initialize();
            Enjine.Mouse.Initialize(this.Canvas.Canvas);
            this.Loop();
        };

        this.ChangeState = function (state) {
            if (this.CurrentState != null) this.CurrentState.Exit();
            this.CurrentState = state;
            this.CurrentState.Enter();
        };

        this.Loop = function () {
            var self = this;
            requestAnimationFrame(function () { self.Loop(); });

            // FPS limiter - 30fps = ~33.33ms per frame
            this.Timer.Now = Date.now();
            let elapsed = this.Timer.Now - this.Timer.Last;

            if (elapsed < 33) return; // Skip frame if less than 33ms passed

            this.Timer.Delta = elapsed / 1000;
            if (this.Timer.Delta > 0.1) this.Timer.Delta = 0.1;
            this.Timer.Last = this.Timer.Now;

            BackgroundSystem.Update(this.Timer.Delta);

            if (this.CurrentState != null) {
                this.CurrentState.Update(this.Timer.Delta);
                this.CurrentState.Draw(this.Canvas.Context);
                Enjine.Mouse.Clicked = false;
            }
        };
    }
};
