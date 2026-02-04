import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { Button } from "@/code/objects/Button";
import { FONTS } from "@/code/Options";

export class ConfirmDialog extends GameObject {
    public title: string;
    public text: string;
    public onConfirm: () => void;
    public onCancel: () => void;

    private btnYes: Button;
    private btnNo: Button;

    private width: number = 300;
    private height: number = 150;

    constructor(title: string, text: string, onConfirm: () => void, onCancel: () => void) {
        super(0, 0);
        this.title = title;
        this.text = text;
        this.onConfirm = onConfirm;
        this.onCancel = onCancel;
        this.Layer = 1; // UI layer
        this.ZOrder = 10000; // Dialogs are modal, always on top

        this.btnYes = new Button(0, 0, 80, 30, "Có", "✅");
        this.btnYes.bgColor = "#15803d";
        this.btnYes.onClick = () => this.onConfirm();

        this.btnNo = new Button(0, 0, 80, 30, "Không", "❌");
        this.btnNo.bgColor = "#b91c1c";
        this.btnNo.onClick = () => this.onCancel();
    }

    public Update(delta: number): void {
        const domCanvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        if (!domCanvas) return;

        this.x = (domCanvas.width / 2) - (this.width / 2);
        this.y = (domCanvas.height / 2) - (this.height / 2);

        this.btnYes.x = this.x + 40;
        this.btnYes.y = this.y + 100;

        this.btnNo.x = this.x + 180;
        this.btnNo.y = this.y + 100;

        this.btnYes.Update(delta);
        this.btnNo.Update(delta);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        const w = renderer.width;
        const h = renderer.height;
        renderer.FillRect(0, 0, w, h, "rgba(0, 0, 0, 0.5)");

        renderer.FillRect(this.x, this.y, this.width, this.height, "#1e293b");

        const borderColor = "#94a3b8";
        renderer.FillRect(this.x, this.y, this.width, 2, borderColor);
        renderer.FillRect(this.x, this.y + this.height - 2, this.width, 2, borderColor);
        renderer.FillRect(this.x, this.y, 2, this.height, borderColor);
        renderer.FillRect(this.x + this.width - 2, this.y, 2, this.height, borderColor);

        renderer.FillRect(this.x + 2, this.y + 2, this.width - 4, 30, "#334155");

        renderer.SetFont(`bold 16px ${FONTS.main}`);
        renderer.SetTextAlign("center");
        renderer.SetTextBaseline("middle");
        renderer.SetFillStyle("#facc15");
        renderer.DrawText(this.title, this.x + this.width / 2, this.y + 17);

        renderer.SetFont(`14px ${FONTS.main}`);
        renderer.SetFillStyle("white");
        renderer.DrawText(this.text, this.x + this.width / 2, this.y + 60);

        this.btnYes.Draw(renderer, camera);
        this.btnNo.Draw(renderer, camera);
    }
}
