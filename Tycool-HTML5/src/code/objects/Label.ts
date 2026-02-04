import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { FONTS } from "@/code/Options";

export class Label extends GameObject {
    public text: string;
    public color: string;
    public font: string;
    public align: CanvasTextAlign;

    constructor(x: number, y: number, text: string, color: string = "white", font: string = `16px ${FONTS.main}`) {
        super(x, y);
        this.text = text;
        this.color = color;
        this.font = font;
        this.align = "left";
        this.Layer = 1; // UI layer
        this.ZOrder = 1000;
    }

    public Update(delta: number): void { }

    public Draw(renderer: Renderer, camera: Camera): void {
        renderer.SetFont(this.font);
        renderer.SetFillStyle(this.color);
        renderer.SetTextAlign(this.align);
        renderer.SetTextBaseline("top");
        renderer.DrawText(this.text, this.x, this.y);
    }
}