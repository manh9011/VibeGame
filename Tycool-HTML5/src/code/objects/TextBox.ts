import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { MouseInput } from "@/engine/input/mouseInput";
import { FONTS } from "@/code/Options";

export class TextBox extends GameObject {
    public width: number;
    public height: number;
    public text: string = "";
    public placeholder: string = "";
    public isFocused: boolean = false;
    public maxLength: number = 2048;
    public isPassword: boolean = false;

    // Style properties
    public bgColor: string = "rgba(15, 23, 42, 0.6)"; // Semi-transparent dark blue
    public focusColor: string = "rgba(15, 23, 42, 0.9)";
    public borderColor: string = "#475569";
    public focusBorderColor: string = "#3b82f6"; // Blue focus
    public textColor: string = "#f8fafc";
    public placeholderColor: string = "#64748b";

    private cursorTimer: number = 0;
    private showCursor: boolean = false;
    private keyHandler: (e: KeyboardEvent) => void;
    private wasMouseDown: boolean = false;
    private clearBtnHovered: boolean = false;

    constructor(x: number, y: number, width: number, height: number, initialText: string = "") {
        super(x, y);
        this.width = width;
        this.height = height;
        this.text = initialText;
        this.Layer = 1; // UI Layer
        this.ZOrder = 1000;

        // Bind key handler
        this.keyHandler = this.HandleKeyDown.bind(this);
        window.addEventListener('keydown', this.keyHandler);
    }

    public Dispose(): void {
        window.removeEventListener('keydown', this.keyHandler);
    }

    private HandleKeyDown(e: KeyboardEvent): void {
        if (!this.isFocused) return;

        // Handle Paste (Ctrl+V)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                if (text) {
                    // Remove newlines for a single-line textbox
                    const cleanText = text.replace(/[\r\n]+/g, '');
                    const remaining = this.maxLength - this.text.length;
                    if (remaining > 0) {
                        this.text += cleanText.substring(0, remaining);
                    }
                }
            }).catch(err => {
                console.error('Failed to read clipboard:', err);
            });
            return;
        }

        // Ignore other control keys
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // Prevent default browser actions for some keys
        if (e.key === 'Backspace') {
            this.text = this.text.slice(0, -1);
            e.preventDefault();
        } else if (e.key.length === 1 && this.text.length < this.maxLength) {
            this.text += e.key;
        }
    }

    public Update(delta: number): void {
        const domCanvas = document.getElementById('game-canvas');
        if (!domCanvas) return;
        const rect = domCanvas.getBoundingClientRect();

        const mx = MouseInput.X - rect.left;
        const my = MouseInput.Y - rect.top;

        // Check clear button hover/click
        const clearBtnSize = 20;
        const clearBtnX = this.x + this.width - clearBtnSize - 8;
        const clearBtnY = this.y + (this.height - clearBtnSize) / 2;

        this.clearBtnHovered = false;
        if (this.text.length > 0 &&
            mx >= clearBtnX && mx <= clearBtnX + clearBtnSize &&
            my >= clearBtnY && my <= clearBtnY + clearBtnSize) {

            this.clearBtnHovered = true;

            if (MouseInput.IsButtonDown(0) && !this.wasMouseDown) {
                this.text = "";
                this.isFocused = true; // Keep focus
            }
        }

        // Check for click to focus/blur
        if (MouseInput.IsButtonDown(0) && !this.wasMouseDown) {
            // Only update focus on mouse DOWN event
            // If hovered on clear button, we already handled it
            if (!this.clearBtnHovered) {
                if (mx >= this.x && mx <= this.x + this.width &&
                    my >= this.y && my <= this.y + this.height) {
                    this.isFocused = true;
                } else {
                    this.isFocused = false;
                }
            }
        }
        this.wasMouseDown = MouseInput.IsButtonDown(0);

        // Blink cursor
        if (this.isFocused) {
            this.cursorTimer += delta;
            if (this.cursorTimer > 0.5) {
                this.cursorTimer = 0;
                this.showCursor = !this.showCursor;
            }
        } else {
            this.showCursor = false;
        }
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        const bgColor = this.isFocused ? this.focusColor : this.bgColor;
        const borderColor = this.isFocused ? this.focusBorderColor : this.borderColor;

        // Draw Background
        renderer.FillRect(this.x, this.y, this.width, this.height, bgColor);

        // Draw Border
        renderer.SetStrokeStyle(borderColor);
        renderer.SetLineWidth(2);
        renderer.StrokeRect(this.x, this.y, this.width, this.height);

        // Constants
        const clearBtnSize = 20;
        const padding = 8;
        const clearBtnX = this.x + this.width - clearBtnSize - padding;
        const clearBtnY = this.y + (this.height - clearBtnSize) / 2;

        // ----------------------------------------------------
        // Draw Clear Button (if text exists)
        // ----------------------------------------------------
        if (this.text.length > 0) {
            renderer.SetFillStyle(this.clearBtnHovered ? "#94a3b8" : "#475569");

            // Draw circle background
            renderer.BeginPath();
            renderer.Arc(clearBtnX + clearBtnSize / 2, clearBtnY + clearBtnSize / 2, clearBtnSize / 2, 0, Math.PI * 2);
            renderer.Fill();

            // Draw X
            renderer.SetStrokeStyle("#f1f5f9");
            renderer.SetLineWidth(2);
            renderer.BeginPath();
            const xPad = 6;
            renderer.MoveTo(clearBtnX + xPad, clearBtnY + xPad);
            renderer.LineTo(clearBtnX + clearBtnSize - xPad, clearBtnY + clearBtnSize - xPad);
            renderer.MoveTo(clearBtnX + clearBtnSize - xPad, clearBtnY + xPad);
            renderer.LineTo(clearBtnX + xPad, clearBtnY + clearBtnSize - xPad);
            renderer.Stroke();
        }

        // ----------------------------------------------------
        // Draw Text with Ellipsis
        // ----------------------------------------------------
        renderer.SetFont(`16px ${FONTS.main}`);
        renderer.SetTextAlign("left");
        renderer.SetTextBaseline("middle");

        // Determine available text width
        // If text exists, we leave room for clear button, otherwise full width minus padding
        const hasClearBtn = this.text.length > 0;
        const availableWidth = hasClearBtn
            ? (this.width - 20 - clearBtnSize - padding)
            : (this.width - 20);

        let displayText = this.text;

        if (this.isPassword) {
            displayText = "*".repeat(this.text.length);
        }

        if (displayText.length === 0 && this.placeholder) {
            // Placeholder
            renderer.SetFillStyle(this.placeholderColor);
            renderer.DrawText(this.placeholder, this.x + 10, this.y + this.height / 2);
        } else {
            renderer.SetFillStyle(this.textColor);

            // Check for truncation
            const fullWidth = renderer.MeasureText(displayText).width;

            if (fullWidth > availableWidth) {
                // Truncate from end and add "..."
                let truncated = displayText;
                while (truncated.length > 0 && renderer.MeasureText(truncated + "...").width > availableWidth) {
                    truncated = truncated.slice(0, -1);
                }
                displayText = truncated + "...";
            }

            renderer.DrawText(displayText, this.x + 10, this.y + this.height / 2);
        }

        // ----------------------------------------------------
        // Draw Cursor
        // ----------------------------------------------------
        if (this.showCursor && this.isFocused) {
            // If we are truncated, cursor position is tricky. 
            // Ideally, input fields SCROLL rather than ellipsis when focused.
            // But if we must use ellipsis, the cursor at the end might be off-screen or weird.
            // For now, let's put it at the end of the VISIBLE text.
            const textWidth = renderer.MeasureText(displayText).width;
            const cursorX = this.x + 10 + textWidth;

            // Only draw if within bounds (minus the clear button safety margin)
            if (cursorX < this.x + this.width - 5) {
                renderer.FillRect(cursorX, this.y + 10, 2, this.height - 20, this.textColor);
            }
        }
    }
}
