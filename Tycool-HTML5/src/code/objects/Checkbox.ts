import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { MouseInput } from "@/engine/input/mouseInput";
import { FONTS } from "@/code/Options";

export class Checkbox extends GameObject {
    public width: number;
    public height: number;
    public label: string;
    public checked: boolean = false;
    public onChange: ((checked: boolean) => void) | null = null;

    public bgColor: string = "#374151";
    public checkedColor: string = "#f59e0b";
    public textColor: string = "white";

    private boxSize: number = 20;
    private wasDown: boolean = false;

    constructor(x: number, y: number, label: string, checked: boolean = false) {
        super(x, y);
        this.label = label;
        this.checked = checked;
        this.boxSize = 20;
        this.width = this.boxSize + 8 + label.length * 10;
        this.height = 24;
        this.Layer = 1;
        this.ZOrder = 6000;
    }

    public Update(delta: number): void {
        const mx = MouseInput.X;
        const my = MouseInput.Y;
        const isDown = MouseInput.IsButtonDown(0);

        // Click detection (was down, now released)
        if (this.wasDown && !isDown) {
            if (mx >= this.x && mx <= this.x + this.width &&
                my >= this.y && my <= this.y + this.height) {
                this.checked = !this.checked;
                if (this.onChange) {
                    this.onChange(this.checked);
                }
            }
        }
        this.wasDown = isDown;
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        const boxX = this.x;
        const boxY = this.y + (this.height - this.boxSize) / 2;

        // Draw checkbox box
        renderer.FillRect(boxX, boxY, this.boxSize, this.boxSize, this.bgColor);

        // Draw border
        renderer.SetStrokeStyle("#6b7280");
        renderer.SetLineWidth(2);
        renderer.BeginPath();
        renderer.MoveTo(boxX, boxY);
        renderer.LineTo(boxX + this.boxSize, boxY);
        renderer.LineTo(boxX + this.boxSize, boxY + this.boxSize);
        renderer.LineTo(boxX, boxY + this.boxSize);
        renderer.ClosePath();
        renderer.Stroke();

        // Draw checkmark if checked
        if (this.checked) {
            renderer.FillRect(boxX + 3, boxY + 3, this.boxSize - 6, this.boxSize - 6, this.checkedColor);

            // Draw checkmark symbol
            renderer.SetStrokeStyle("white");
            renderer.SetLineWidth(2);
            renderer.BeginPath();
            renderer.MoveTo(boxX + 5, boxY + 10);
            renderer.LineTo(boxX + 8, boxY + 14);
            renderer.LineTo(boxX + 15, boxY + 6);
            renderer.Stroke();
        }

        // Draw label
        renderer.SetFont(`14px ${FONTS.main}`);
        renderer.SetFillStyle(this.textColor);
        renderer.SetTextAlign("left");
        renderer.SetTextBaseline("middle");
        renderer.DrawText(this.label, this.x + this.boxSize + 8, this.y + this.height / 2);
    }
}
