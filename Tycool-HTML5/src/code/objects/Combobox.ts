import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { MouseInput } from "@/engine/input/mouseInput";
import { FONTS } from "@/code/Options";

export class Combobox extends GameObject {
    public width: number;
    public height: number;
    public options: { label: string, value: any }[] = [];
    public selectedIndex: number = -1;
    public isOpen: boolean = false;
    public onSelect: (value: any) => void = () => { };

    private isHovered: boolean = false;
    private wasMouseDown: boolean = false;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.Layer = 1; // UI layer
        this.ZOrder = 2000;
    }

    public AddOption(label: string, value: any) {
        this.options.push({ label, value });
        if (this.selectedIndex === -1) this.selectedIndex = 0;
    }

    public GetValue() {
        if (this.selectedIndex >= 0 && this.selectedIndex < this.options.length) {
            return this.options[this.selectedIndex].value;
        }
        return null;
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
            if (MouseInput.IsButtonDown(0) && !this.wasMouseDown) {
                this.isOpen = !this.isOpen;
            }
        } else {
            this.isHovered = false;
            if (MouseInput.IsButtonDown(0) && !this.wasMouseDown && this.isOpen) {
                const listHeight = this.options.length * 30;
                if (!(mx >= this.x && mx <= this.x + this.width &&
                    my >= this.y + this.height && my <= this.y + this.height + listHeight)) {
                    this.isOpen = false;
                }
            }
        }

        if (this.isOpen) {
            const listHeight = this.options.length * 30;
            if (mx >= this.x && mx <= this.x + this.width &&
                my >= this.y + this.height && my <= this.y + this.height + listHeight) {

                if (MouseInput.IsButtonDown(0) && !this.wasMouseDown) {
                    const relativeY = my - (this.y + this.height);
                    const index = Math.floor(relativeY / 30);
                    if (index >= 0 && index < this.options.length) {
                        this.selectedIndex = index;
                        this.isOpen = false;
                        this.onSelect(this.options[index].value);
                    }
                }
            }
        }

        this.wasMouseDown = MouseInput.IsButtonDown(0);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        renderer.FillRect(this.x, this.y, this.width, this.height, "#1e293b");
        const border = this.isHovered || this.isOpen ? "#facc15" : "#475569";
        renderer.FillRect(this.x, this.y, this.width, 2, border);
        renderer.FillRect(this.x, this.y + this.height - 2, this.width, 2, border);
        renderer.FillRect(this.x, this.y, 2, this.height, border);
        renderer.FillRect(this.x + this.width - 2, this.y, 2, this.height, border);

        const text = this.selectedIndex >= 0 ? this.options[this.selectedIndex].label : "Select...";
        renderer.SetFont(`16px ${FONTS.ui}`);
        renderer.SetTextAlign("left");
        renderer.SetTextBaseline("middle");
        renderer.SetFillStyle("white");
        renderer.DrawText(text, this.x + 10, this.y + this.height / 2);

        renderer.DrawText(this.isOpen ? "▲" : "▼", this.x + this.width - 20, this.y + this.height / 2);
    }

    public DrawDropdown(renderer: Renderer, camera: Camera): void {
        if (!this.isOpen) return;
        const border = "#facc15";

        const itemH = 30;
        const totalH = this.options.length * itemH;

        renderer.FillRect(this.x, this.y + this.height, this.width, totalH, "#0f172a");

        renderer.FillRect(this.x, this.y + this.height, this.width, 2, border);
        renderer.FillRect(this.x, this.y + this.height + totalH, this.width, 2, border);
        renderer.FillRect(this.x, this.y + this.height, 2, totalH, border);
        renderer.FillRect(this.x + this.width - 2, this.y + this.height, 2, totalH, border);

        this.options.forEach((opt, i) => {
            const iy = this.y + this.height + (i * itemH);

            if (i === this.selectedIndex) {
                renderer.FillRect(this.x + 2, iy + 2, this.width - 4, itemH - 4, "#334155");
            }

            renderer.SetFillStyle("white");
            renderer.SetFont(`16px ${FONTS.ui}`);
            renderer.SetTextAlign("left");
            renderer.SetTextBaseline("middle");
            renderer.DrawText(opt.label, this.x + 10, iy + itemH / 2);

            if (i < this.options.length - 1) {
                renderer.FillRect(this.x + 5, iy + itemH, this.width - 10, 1, "#1e293b");
            }
        });
    }
}
