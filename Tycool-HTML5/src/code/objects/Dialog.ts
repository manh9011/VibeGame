import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { Button } from "@/code/objects/Button";
import { MouseInput } from "@/engine/input/mouseInput";
import { FONTS } from "@/code/Options";

export class Dialog extends GameObject {
    public width: number;
    public height: number;
    public title: string;
    public onClose: () => void;
    public children: GameObject[] = [];
    public active: boolean = false;

    private closeBtn: Button;
    private isDragging: boolean = false;
    private dragOffsetX: number = 0;
    private dragOffsetY: number = 0;

    constructor(x: number, y: number, width: number, height: number, title: string, onClose: () => void = () => { }) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.title = title;
        this.onClose = onClose;
        this.Layer = 1; // UI layer
        this.ZOrder = 2000; // Panels above normal UI

        this.closeBtn = new Button(x + width - 30, y + 5, 25, 25, "X");
        this.closeBtn.bgColor = "#b91c1c";
        this.closeBtn.onClick = () => {
            this.active = false;
            this.onClose();
        };
    }

    public AddChild(child: GameObject) {
        this.children.push(child);
    }

    public Update(delta: number): void {
        if (!this.active) return;

        const domCanvas = document.getElementById('game-canvas');
        if (!domCanvas) return;
        const rect = domCanvas.getBoundingClientRect();
        const mx = MouseInput.X - rect.left;
        const my = MouseInput.Y - rect.top;

        if (this.isDragging) {
            this.x = mx - this.dragOffsetX;
            this.y = my - this.dragOffsetY;

            if (!MouseInput.IsButtonDown(0)) {
                this.isDragging = false;
            }
        } else {
            if (mx >= this.x && mx <= this.x + this.width &&
                my >= this.y && my <= this.y + 40 &&
                MouseInput.IsButtonDown(0)) {

                if (!(mx >= this.closeBtn.x && mx <= this.closeBtn.x + this.closeBtn.width &&
                    my >= this.closeBtn.y && my <= this.closeBtn.y + this.closeBtn.height)) {
                    this.isDragging = true;
                    this.dragOffsetX = mx - this.x;
                    this.dragOffsetY = my - this.y;
                }
            }
        }

        this.closeBtn.x = this.x + this.width - 30;
        this.closeBtn.y = this.y + 5;
        this.closeBtn.Update(delta);

        this.children.forEach(c => {
            if (typeof (c as any).relX === 'undefined') {
                (c as any).relX = c.x;
                (c as any).relY = c.y;
            }

            c.x = this.x + (c as any).relX;
            c.y = this.y + (c as any).relY;

            c.Update(delta);
        });
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (!this.active) return;

        renderer.Save();
        renderer.FillRect(this.x + 5, this.y + 5, this.width, this.height, "rgba(0,0,0,0.5)");

        renderer.FillRect(this.x, this.y, this.width, this.height, "#1e293b");

        const borderColor = "#475569";
        renderer.FillRect(this.x, this.y, this.width, 2, borderColor);
        renderer.FillRect(this.x, this.y + this.height - 2, this.width, 2, borderColor);
        renderer.FillRect(this.x, this.y, 2, this.height, borderColor);
        renderer.FillRect(this.x + this.width - 2, this.y, 2, this.height, borderColor);

        renderer.FillRect(this.x + 2, this.y + 2, this.width - 4, 35, "#334155");

        renderer.SetFont(`bold 20px ${FONTS.main}`);
        renderer.SetTextAlign("left");
        renderer.SetTextBaseline("middle");
        renderer.SetFillStyle("#facc15");
        renderer.DrawText(this.title, this.x + 10, this.y + 19);

        this.closeBtn.Draw(renderer, camera);

        renderer.FillRect(this.x, this.y + 37, this.width, 2, borderColor);

        renderer.Restore();

        this.children.forEach(c => c.Draw(renderer, camera));
    }
}
