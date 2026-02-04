import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { MouseInput } from "@/engine/input/mouseInput";
import { FONTS } from "@/code/Options";

export class Button extends GameObject {
    public width: number;
    public height: number;
    public label: string;
    public icon: string;
    public bgColor: string = "#1e293b";
    public hoverColor: string = "#334155";
    public textColor: string = "#facc15";
    public onClick: () => void = () => { };
    public isHovered: boolean = false;
    public disabled: boolean = false;
    private wasMouseDown: boolean = false;

    constructor(x: number, y: number, width: number, height: number, label: string, icon: string = "") {
        super(x, y);
        this.width = width;
        this.height = height;
        this.label = label;
        this.icon = icon;
        this.Layer = 1; // UI layer
        this.ZOrder = 1000;
    }

    public Update(delta: number): void {
        const domCanvas = document.getElementById('game-canvas');
        if (!domCanvas) return;
        const rect = domCanvas.getBoundingClientRect();

        const mx = MouseInput.X - rect.left;
        const my = MouseInput.Y - rect.top;

        if (mx >= this.x && mx <= this.x + this.width &&
            my >= this.y && my <= this.y + this.height) {
            this.isHovered = true;

            // Only trigger click if not disabled
            if (!this.disabled && !MouseInput.IsButtonDown(0) && this.wasMouseDown) {
                this.onClick();
            }
        } else {
            this.isHovered = false;
        }

        this.wasMouseDown = MouseInput.IsButtonDown(0);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (!this.visible) return;

        const width = this.width;
        const height = this.height;

        // Colors - use grayed out when disabled
        let baseColor = this.isHovered && !this.disabled ? this.hoverColor : this.bgColor;
        const isPressed = this.isHovered && MouseInput.IsButtonDown(0) && !this.disabled;

        if (this.disabled) {
            baseColor = "#3f3f46"; // Gray when disabled
        }

        // Define rounded rect path
        const radius = 8;
        renderer.BeginPath();
        renderer.RoundRect(this.x, this.y, width, height, radius);
        renderer.ClosePath();

        // 1. Fill Background
        const grad = renderer.CreateLinearGradient(this.x, this.y, this.x, this.y + height);
        if (isPressed) {
            grad.addColorStop(0, "#0f172a");
            grad.addColorStop(1, "#334155");
            renderer.SetFillStyle(grad);
            renderer.Fill();
        } else {
            // Base color fill
            renderer.SetFillStyle(baseColor);
            renderer.Fill();

            // Gloss effect (white gradient top to bottom fade) - only for enabled
            if (!this.disabled) {
                const glossGrad = renderer.CreateLinearGradient(this.x, this.y, this.x, this.y + height / 2);
                glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
                glossGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");

                renderer.SetFillStyle(glossGrad);
                renderer.Fill();
            }
        }

        // 2. Stroke / Border
        renderer.SetLineWidth(2);
        renderer.SetStrokeStyle(this.disabled ? "#52525b" : (this.isHovered ? "#94a3b8" : "#475569"));
        renderer.Stroke();

        // 3. Draw Text
        renderer.SetFillStyle(this.disabled ? "#71717a" : this.textColor);
        renderer.SetFont(`bold 14px ${FONTS.ui}`);
        renderer.SetTextAlign("center");
        renderer.SetTextBaseline("middle");

        const text = this.icon ? `${this.icon} ${this.label}` : this.label;
        renderer.DrawText(text, this.x + this.width / 2, this.y + this.height / 2);
    }
}
